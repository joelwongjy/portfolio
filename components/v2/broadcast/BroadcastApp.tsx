import { AnimatePresence, motion } from "framer-motion";
import dynamic from "next/dynamic";
import { Saira } from "next/font/google";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { hero } from "@/data/hero";

import { CHAPTERS, LAP_LENGTH } from "../lap";
import { loadCity } from "../three/monaco/city";
import { initialCtrl, MapMode, SceneCtrl, Telemetry } from "../three/monaco/ctrl";
import { deltaAt, formatLapTime, LapFile, loadLap, sampleAt, timeAt } from "../telemetry";
import { boards, brand, jobs, projects } from "./data";
import {
  CarData,
  GARAGE_SCREEN,
  GarageScreen,
  Insight,
  Intro,
  PitTower,
  ProjectInsight,
  TimingBox,
  Tower,
  TrackMap,
  Transport,
} from "./hud";

// Saira at a wide setting stands in for the broadcast's Formula1 Display,
// which is proprietary. A visitor with Formula1 Display installed gets it
// via local() in globals.css ("F1 Broadcast").
const f1 = Saira({ subsets: ["latin"], axes: ["wdth"], style: ["normal", "italic"], variable: "--font-f1", display: "swap" });

const MonacoScene = dynamic(() => import("../three/monaco/MonacoScene"), { ssr: false });

type Phase = "grid" | "lap";

// a whole 71 s lap takes this much wheel travel: about 1,600 px a corner
const PX_PER_LAP = 12000;
const RATES = [1, 0.5, 0.25];

// the corner whose boards the car is passing
const chapterAtDistance = (d: number) => CHAPTERS.findIndex((c) => d >= c.at - 210 && d <= c.at + 110);

export const BroadcastApp = () => {
  const ctrl = useRef<SceneCtrl>(initialCtrl());
  const wake = useRef<() => void>(() => {});
  const garageScreen = useRef<HTMLElement | null>(null);

  const [lap, setLap] = useState<LapFile | null>(null);
  const [mode, setModeState] = useState<MapMode>("grid");
  const [phase, setPhase] = useState<Phase>("grid");
  const [project, setProject] = useState<number | null>(null);
  const [tele, setTele] = useState<Telemetry>({ t: 0, d: 0, playing: false });
  const [rate, setRate] = useState(1);
  const [map, setMap] = useState<{ path: string; pts: { x: number; y: number }[] } | null>(null);
  const [lastChapter, setLastChapter] = useState(-1);

  const timers = useRef<number[]>([]);
  const stopAt = useRef<number | null>(null);
  const phaseRef = useRef<Phase>("grid");
  phaseRef.current = phase;

  useEffect(() => {
    loadLap().then(setLap).catch(() => {});
    // decode the garage screenshots up front so the screens never paint late
    projects.forEach((p) => {
      const img = new Image();
      img.decoding = "async";
      img.src = p.image;
    });
    // the mini map, from the same circuit data as the 3D scene
    loadCity()
      .then((c) => {
        const t = c.track;
        let x0 = Infinity;
        let x1 = -Infinity;
        let z0 = Infinity;
        let z1 = -Infinity;
        for (let i = 0; i < t.n; i++) {
          x0 = Math.min(x0, t.pos[i * 3]);
          x1 = Math.max(x1, t.pos[i * 3]);
          z0 = Math.min(z0, t.pos[i * 3 + 2]);
          z1 = Math.max(z1, t.pos[i * 3 + 2]);
        }
        const s = 92 / Math.max(x1 - x0, z1 - z0);
        const ox = (100 - (x1 - x0) * s) / 2;
        const oy = (100 - (z1 - z0) * s) / 2;
        const pts: { x: number; y: number }[] = [];
        for (let i = 0; i < t.n; i++) pts.push({ x: ox + (t.pos[i * 3] - x0) * s, y: oy + (t.pos[i * 3 + 2] - z0) * s });
        const path = pts.filter((_, i) => i % 3 === 0).map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ") + " Z";
        setMap({ path, pts });
      })
      .catch(() => {});
    const pending = timers.current;
    return () => pending.forEach(window.clearTimeout);
  }, []);

  const total = lap ? lap.drivers.VER.lapTime : 71.365;
  const boardsWithFont = useMemo(() => boards.map((b) => ({ ...b, font: f1.style.fontFamily })), []);
  const chapterTimes = useMemo(
    () => (lap ? CHAPTERS.map((c) => timeAt(lap.drivers.VER, c.at)) : CHAPTERS.map(() => 0)),
    [lap]
  );

  // ——— talking to the scene ———
  const set = useCallback((patch: Partial<SceneCtrl>, fly = false) => {
    Object.assign(ctrl.current, patch);
    if (fly) ctrl.current.shot++;
    if (patch.mode) setModeState(patch.mode);
    if ("project" in patch) setProject(patch.project ?? null);
    wake.current();
  }, []);

  const clearTimers = () => {
    timers.current.forEach(window.clearTimeout);
    timers.current = [];
  };
  // ——— actions ———
  const goGrid = useCallback(() => {
    clearTimers();
    setPhase("grid");
        stopAt.current = null;
    set({ mode: "grid", lights: 0, playing: false, jump: 0, target: 0, project: null }, true);
  }, [set]);

  // straight off the line: the real launch plays out to Sainte Dévote and
  // waits for you there
  const startLap = useCallback(() => {
    clearTimers();
    setPhase("lap");
    stopAt.current = chapterTimes[0] + 0.6;
    set({ mode: "race", lights: 0, target: 0, jump: 0, playing: true, rate: 1, project: null }, true);
    setRate(1);
  }, [set, chapterTimes]);

  const seek = useCallback(
    (t: number, flyIfFar = true) => {
      stopAt.current = null;
      const clamped = Math.max(0, Math.min(total + 1.5, t));
      const far = Math.abs(clamped - ctrl.current.target) > 12;
      if (ctrl.current.mode !== "race" || (far && flyIfFar)) {
        setPhase("lap");
        set({ mode: "race", jump: clamped, playing: false, lights: 0, project: null }, true);
      } else {
        set({ target: clamped, playing: false });
      }
    },
    [set, total]
  );

  const goChapter = useCallback((i: number) => seek(chapterTimes[i] + 0.3), [seek, chapterTimes]);

  const togglePlay = useCallback(() => {
    if (ctrl.current.mode !== "race") {
      startLap();
      return;
    }
    const playing = !ctrl.current.playing;
    stopAt.current = null;
    if (playing && ctrl.current.target >= total) set({ jump: 0, target: 0 });
    set({ playing });
  }, [set, startLap, total]);

  const cycleRate = useCallback(() => {
    const next = RATES[(RATES.indexOf(ctrl.current.rate) + 1) % RATES.length];
    setRate(next);
    set({ rate: next });
  }, [set]);

  const goPits = useCallback(
    (j: number | null = null) => {
      clearTimers();
            set({ mode: "pits", project: j, lights: 0, playing: false }, true);
    },
    [set]
  );

  const backToLap = useCallback(() => {
    if (phaseRef.current === "lap") set({ mode: "race", project: null }, true);
    else goGrid();
  }, [set, goGrid]);

  const heli = useCallback(() => set({ mode: "overview", playing: false, project: null }, true), [set]);

  // stop at the first corner after the launch
  useEffect(() => {
    if (stopAt.current != null && tele.t >= stopAt.current) {
      stopAt.current = null;
      set({ playing: false, target: tele.t });
    }
  }, [tele.t, set]);

  // ——— scroll, swipe and keys scrub the lap ———
  const mapRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = mapRef.current;
    if (!el) return;
    const scrub = (dt: number) => {
      stopAt.current = null;
      const target = Math.max(0, Math.min(total + 1.5, ctrl.current.target + dt));
      set({ target, playing: false });
    };
    let lastHop = 0;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (ctrl.current.mode === "pits") {
        const c = ctrl.current;
        if (c.project != null) {
          // in a garage, a firm scroll moves to the next or previous one
          const now = performance.now();
          if (Math.abs(e.deltaY) > 30 && now - lastHop > 900) {
            lastHop = now;
            const next = c.project + (e.deltaY > 0 ? 1 : -1);
            if (next >= 0 && next < projects.length) set({ project: next }, true);
          }
          return;
        }
        set({ pitPan: c.pitPan + (e.deltaX + e.deltaY) * 0.06 });
        return;
      }
      if (ctrl.current.mode === "grid" && phaseRef.current === "grid" && e.deltaY > 24) {
        startLap();
        return;
      }
      if (ctrl.current.mode !== "race" || phaseRef.current !== "lap") return;
      scrub((e.deltaY / PX_PER_LAP) * total);
    };
    let lastY = 0;
    const onTouchStart = (e: TouchEvent) => {
      lastY = e.touches[0].clientY;
    };
    const onTouchMove = (e: TouchEvent) => {
      const y = e.touches[0].clientY;
      const dy = lastY - y;
      lastY = y;
      if (ctrl.current.mode !== "race" || phaseRef.current !== "lap") return;
      e.preventDefault();
      scrub(((dy * 2.2) / PX_PER_LAP) * total);
    };
    // drag to slide along the pit lane
    let drag: { x: number; pan: number } | null = null;
    const onDown = (e: PointerEvent) => {
      if (ctrl.current.mode === "pits" && ctrl.current.project == null) drag = { x: e.clientX, pan: ctrl.current.pitPan };
    };
    const onMove = (e: PointerEvent) => {
      if (!drag || !(e.buttons & 1)) return;
      set({ pitPan: drag.pan - (e.clientX - drag.x) * 0.12 });
    };
    const onUp = () => {
      drag = null;
    };
    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
    };
  }, [set, startLap, total]);

  const chapter = chapterAtDistance(tele.d);
  useEffect(() => {
    if (chapter >= 0) setLastChapter(chapter);
  }, [chapter]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        togglePlay();
        return;
      }
      if (ctrl.current.mode !== "race") return;
      const now = ctrl.current.target;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        const next = chapterTimes.findIndex((ct) => ct > now + 0.5);
        seek(next < 0 ? total + 1.2 : chapterTimes[next] + 0.3, false);
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        const prev = [...chapterTimes].reverse().find((ct) => ct < now - 1);
        seek(prev ?? 0, false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [togglePlay, seek, chapterTimes, total]);

  // ——— the broadcast ———
  const sample = lap ? sampleAt(lap.drivers.VER, Math.min(tele.t, total)) : null;
  const delta = lap ? deltaAt(lap, Math.min(tele.t, total)) : 0;
  const carDot = map ? map.pts[Math.floor(((((tele.d % LAP_LENGTH) + LAP_LENGTH) % LAP_LENGTH) / 2)) % map.pts.length] : null;
  const corners = map ? CHAPTERS.map((c) => map.pts[Math.floor(c.at / 2) % map.pts.length]) : [];
  const racing = mode === "race";
  void hero;
  const finished = racing && tele.t >= total;
  const marks = CHAPTERS.map((c, i) => ({ at: chapterTimes[i], label: c.corner, color: brand(jobs[i]?.organisation ?? "").color }));
  const towerActive = racing ? (chapter >= 0 ? chapter : lastChapter) : -1;

  return (
    <div
      className={`${f1.variable} fixed inset-0 overflow-hidden bg-[#DCE6EC] text-white antialiased`}
      style={{ height: "100dvh", fontFamily: '"F1 Broadcast", var(--font-f1), system-ui, sans-serif', fontStretch: "112%" }}
    >
      <div ref={mapRef} className="absolute inset-0 touch-none">
        <MonacoScene
          ctrl={ctrl}
          wakeRef={wake}
          livery="#3671C6"
          lap={lap?.drivers.VER ?? null}
          boards={boardsWithFont}
          chapterPins={[]}
          garagePins={[]}
          onChapterPin={() => {}}
          onGaragePin={(i) => goPits(i)}
          pitSelected={mode === "pits" ? project : null}
          garageScreenRef={garageScreen}
          garageScreenSize={GARAGE_SCREEN}
          onTelemetry={setTele}
        />
      </div>

      {/* the open garage's back-wall screen (desktop; phones get the card) */}
      <div className="pointer-events-none absolute inset-0 z-[5] hidden overflow-hidden md:block">
        <GarageScreen
          active={mode === "pits" ? project : null}
          onPick={(i) => goPits(i)}
          screenRef={(el) => {
            garageScreen.current = el;
          }}
        />
      </div>

      {/* ——— top left: the tower ——— */}
      <div className={`pointer-events-none absolute left-3 top-3 z-10 hidden ${mode === "grid" ? "" : "md:block"}`}>
        <div className="pointer-events-auto">
          {mode === "pits" ? (
            <PitTower active={project} onPick={(i) => goPits(i)} onBack={backToLap} />
          ) : (
            <Tower active={towerActive} onPick={goChapter} clock={racing ? formatLapTime(Math.min(tele.t, total)) : "0:00.000"} />
          )}
        </div>
      </div>

      {/* ——— top right: timing and the track map ——— */}
      {lap && (racing || mode === "overview") && (
        <div className="pointer-events-none absolute right-3 top-3 z-10 flex flex-col items-end gap-2">
          <div className="pointer-events-auto scale-[0.9] origin-top-right md:scale-100">
            <TimingBox lap={lap} t={tele.t} delta={delta} />
          </div>
          {map && (
            <div className="pointer-events-auto hidden md:block">
              <TrackMap path={map.path} car={carDot} corners={corners} active={towerActive} onPick={goChapter} />
            </div>
          )}
        </div>
      )}

      {/* ——— bottom: the lower third, car data and the transport bar ——— */}
      <div className="pointer-events-none absolute inset-x-3 bottom-3 z-10 flex flex-col gap-2">
        <div className="flex items-end justify-between gap-3">
          <div className="pointer-events-auto w-full md:w-auto">
            {/* no exit animations here: rapid card changes (scrubbing past
                corners, jumping between modes) jam AnimatePresence's
                "wait" mode and leave a stale card on screen */}
            <>
              {racing && chapter >= 0 && !finished && <Insight key={`c${chapter}`} chapter={chapter} />}
              {racing && finished && (
                <motion.div
                  key="flag"
                  initial={{ y: 16, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-full overflow-hidden bg-[#181B26]/[0.96] shadow-xl md:w-[400px]"
                >
                  <div className="flex items-center gap-3 px-4 py-3">
                    <span
                      className="h-10 w-10 shrink-0 rounded-sm"
                      style={{ background: "repeating-conic-gradient(#fff 0% 25%, #111 0% 50%) 0 0 / 10px 10px" }}
                    />
                    <div>
                      <p className="text-[22px] font-black uppercase italic leading-none">Pole position</p>
                      <p className="mt-1 text-[13px] font-semibold uppercase tracking-wide text-white/60">
                        1:11.365 · 0.084 ahead of Alonso
                      </p>
                    </div>
                  </div>
                  <p className="border-t border-white/10 px-4 py-3 text-[14px] text-white/80">
                    That&apos;s the lap, and the career so far. The side projects are parked in the pit lane.
                  </p>
                  <div className="grid grid-cols-3 border-t border-white/10 text-[12px] font-black uppercase tracking-wide">
                    <button onClick={() => goPits(null)} className="bg-[#E10600] py-3 hover:brightness-110">Pit lane</button>
                    <button onClick={() => seek(0)} className="border-l border-white/10 py-3 hover:bg-white/[0.06]">Replay</button>
                    <a href={hero.resumeLink} target="_blank" rel="noreferrer" className="border-l border-white/10 py-3 text-center hover:bg-white/[0.06]">Résumé</a>
                  </div>
                </motion.div>
              )}
              {mode === "pits" && project != null && projects[project] && (
                <div className="md:hidden">
                  <ProjectInsight key={`p${project}`} p={projects[project]} index={project} onPick={(i) => goPits(i)} />
                </div>
              )}
              {mode === "pits" && project == null && (
                <motion.div key="pits" initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0 }} className="md:hidden">
                  <PitTower active={null} onPick={(i) => goPits(i)} onBack={backToLap} />
                </motion.div>
              )}
            </>
          </div>
          {racing && sample && (
            <div className="pointer-events-auto hidden lg:block">
              <CarData s={sample} />
            </div>
          )}
        </div>
        {mode === "grid" && (
          <div className="pointer-events-auto">
            <Intro onStart={startLap} onPits={() => goPits(null)} />
          </div>
        )}
        {(racing || mode === "overview") && (
          <div className="pointer-events-auto">
            <Transport
              t={tele.t}
              total={total}
              playing={tele.playing}
              rate={rate}
              marks={marks}
              onPlay={togglePlay}
              onRate={cycleRate}
              onSeek={(t) => seek(t, false)}
            >
              <div className="flex shrink-0 items-center gap-1 text-[12px] font-black uppercase tracking-wide">
                <button
                  onClick={() => goPits(null)}
                  className="flex items-center gap-2 rounded px-2.5 py-1.5 hover:bg-white/10"
                  aria-label="Pit lane: side projects"
                >
                  <span className="flex h-[19px] w-[17px] items-center justify-center rounded-[3px] bg-white text-[12px] font-black text-[#181B26]">
                    P
                  </span>
                  <span>Pit lane</span>
                </button>
                <span className="hidden sm:contents">
                  <BarButton onClick={heli}>Heli cam</BarButton>
                  <BarButton onClick={goGrid}>Grid</BarButton>
                </span>
              </div>
            </Transport>
          </div>
        )}
        <p className="pointer-events-auto text-right text-[10px] font-semibold text-slate-700/70">
          Lap data: OpenF1 (unofficial, not associated with Formula 1) · Map © OpenStreetMap ·{" "}
          <Link href="/classic" className="underline">
            Plain version
          </Link>
        </p>
      </div>
    </div>
  );
};

const BarButton = ({ onClick, children }: { onClick: () => void; children: React.ReactNode }) => (
  <button onClick={onClick} className="rounded px-2.5 py-2 hover:bg-white/10">
    {children}
  </button>
);
