import { motion } from "framer-motion";
import { ReactNode, useRef } from "react";

import { hero } from "@/data/hero";
import { Project } from "@/data/projects";

import { jobYears } from "../jobYears";
import { CHAPTERS } from "../lap";
import { orgName } from "../OrganisationLogo";
import { PROJECT_ICONS } from "../projectIcons";
import { CarSample, formatLapTime, LapFile } from "../telemetry";
import { brand, GITHUB, jobs, logoSrc, projects, yearValue } from "./data";

// TV-broadcast graphics: dark panels, team-colour slivers, tabular numbers.

const panel = "bg-[#181B26]/[0.96] text-white shadow-[0_10px_30px_rgba(0,0,0,0.35)]";

export const RED = "#E10600";
const PURPLE = "#A64DFF";
const GREEN = "#22C55E";
const YELLOW = "#F5C518";

// ——— timing tower, after F1 TV's 2025–26 graphics ————————————————————————
// Square corners, a dark navy panel with faint motion streaks, a session
// clock over a red rule, the leader's position in a red square, then
// position · team mark · three-letter code · gap · tyre letter per row.

export const TOWER_BG =
  "linear-gradient(160deg, rgba(255,255,255,0.035) 0%, transparent 40%), repeating-linear-gradient(115deg, rgba(255,255,255,0.018) 0 2px, transparent 2px 22px), #181B26";
const TOWER_RED = "#E8331A";
const TYRE = { S: "#E8331A", M: "#F2D21B", H: "#F2F2F2" } as const;

const CODES: Record<string, string> = {
  tiktok: "TIK",
  kisi: "KIS",
  propel: "PRO",
  shopee: "SHO",
  bantu: "BAN",
  gdsc: "GDS",
};
export const code = (org: string) => CODES[org] ?? org.slice(0, 3).toUpperCase();

// stint length as a tyre compound: short stints on softs, long ones on hards
const months = (start: string, end: string) => Math.max(1, Math.round((yearValue(end) - yearValue(start)) * 12));
const compound = (m: number): keyof typeof TYRE => (m < 6 ? "S" : m < 13 ? "M" : "H");
const tenure = (m: number) => (m < 12 ? `${m}m` : `${Math.floor(m / 12)}y ${m % 12}m`);

// each company's own logo on a small white plate, the way the tower shows
// team badges; GDSC's wordmark is too long for the plate, so it gets its
// red and blue chevrons
const Mark = ({ org }: { org: string }) => {
  const src = org === "gdsc" ? undefined : logoSrc(org);
  return (
    <span className="flex h-[21px] w-[46px] items-center justify-center rounded-[3px] bg-white px-1">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="max-h-[15px] max-w-full object-contain" />
      ) : (
        <svg viewBox="0 0 24 16" className="h-3.5 w-5" fill="none" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 2 2 8l6 6" stroke="#EA4335" />
          <path d="M16 2l6 6-6 6" stroke="#4285F4" />
        </svg>
      )}
    </span>
  );
};

const TowerHeader = ({ title, clock }: { title: string; clock: string }) => (
  <>
    <div className="flex h-[38px] items-center justify-center gap-2 px-3">
      <span className="text-[19px] font-black italic leading-none tracking-[-0.02em]">
        J<span style={{ color: TOWER_RED }}>W</span>
      </span>
      <span className="text-[15px] font-bold uppercase leading-none tracking-[0.02em]">{title}</span>
    </div>
    <div className="mx-1.5 flex h-[30px] items-center justify-center bg-white/[0.045] text-[17px] font-bold tabular-nums">
      {clock}
    </div>
    <div className="mt-1.5 h-[3px]" style={{ backgroundColor: TOWER_RED }} />
  </>
);

const TowerRow = ({
  pos,
  leader,
  on,
  mark,
  tla,
  gap,
  tyre,
  pit,
  onClick,
  label,
}: {
  pos: number;
  leader?: boolean;
  on?: boolean;
  mark: ReactNode;
  tla: string;
  gap: string;
  tyre?: keyof typeof TYRE;
  pit?: boolean;
  onClick: () => void;
  label: string;
}) => (
  <li className="relative">
    <button
      onClick={onClick}
      aria-label={label}
      aria-current={on}
      className={`flex h-[31px] w-full items-center text-left transition-colors ${on ? "bg-white/[0.13]" : "hover:bg-white/[0.06]"}`}
    >
      <span
        className="flex h-full w-[30px] shrink-0 items-center justify-center text-[15px] font-semibold tabular-nums"
        style={leader ? { backgroundColor: TOWER_RED } : undefined}
      >
        {pos}
      </span>
      <span className="flex w-[54px] shrink-0 justify-center">{mark}</span>
      <span className="w-[46px] shrink-0 text-[16px] font-bold tracking-[0.01em]">{tla}</span>
      <span className="flex-1 text-right text-[14px] font-normal tabular-nums">{gap}</span>
      <span className="w-[22px] shrink-0 text-center text-[13px] font-bold" style={{ color: tyre ? TYRE[tyre] : undefined }}>
        {tyre}
      </span>
    </button>
    {pit && (
      <span className="pointer-events-none absolute -right-[22px] top-1/2 flex h-[19px] w-[17px] -translate-y-1/2 items-center justify-center rounded-[3px] bg-white text-[12px] font-black text-[#181B26]">
        P
      </span>
    )}
  </li>
);

export const Tower = ({
  active,
  onPick,
  clock,
}: {
  active: number;
  onPick: (i: number) => void;
  clock: string;
}) => (
  <div className="w-[244px] pb-1.5 text-white shadow-[0_10px_30px_rgba(0,0,0,0.35)]" style={{ background: TOWER_BG }}>
    <TowerHeader title="Q3" clock={clock} />
    <ol className="pt-1">
      {jobs.map((j, i) => {
        const m = months(j.start, j.end);
        const current = /present/i.test(j.end);
        return (
          <TowerRow
            key={`${j.organisation}-${j.start}`}
            pos={i + 1}
            leader={i === 0}
            on={i === active}
            mark={<Mark org={j.organisation} />}
            tla={code(j.organisation)}
            gap={current ? "On Track" : tenure(m)}
            tyre={compound(m)}
            onClick={() => onPick(i)}
            label={`${orgName(j.organisation)}, ${j.title}, ${jobYears(j.start, j.end)}`}
          />
        );
      })}
    </ol>
  </div>
);

// ——— lap timer, sectors and the gap to Alonso ——————————————————————————

export const TimingBox = ({ lap, t, delta }: { lap: LapFile; t: number; delta: number }) => {
  const ver = lap.drivers.VER;
  const alo = lap.drivers.ALO;
  const done = t >= ver.lapTime;
  let acc = 0;
  const sectors = ver.sectors.map((s, i) => {
    acc += s;
    return { i, time: s, end: acc, best: s <= alo.sectors[i] };
  });
  const range = 0.4;
  const frac = Math.max(-1, Math.min(1, delta / range));
  return (
    <div className={`w-[264px] overflow-hidden ${panel}`}>
      <div className="flex items-stretch">
        <span className="flex w-9 items-center justify-center text-[15px] font-black" style={{ backgroundColor: "#3671C6" }}>
          {ver.number}
        </span>
        <div className="flex flex-1 items-center justify-between px-2.5 py-1.5">
          <span className="text-[13px] font-bold uppercase tracking-wide">M. Verstappen</span>
          <span className="text-[11px] font-semibold uppercase text-white/50">2023 pole</span>
        </div>
      </div>
      <div className="flex items-baseline justify-between px-3 pt-1.5">
        <span className="text-[30px] font-bold leading-none tabular-nums">{formatLapTime(Math.min(t, ver.lapTime))}</span>
        {done && (
          <span className="rounded-sm px-1.5 py-0.5 text-[11px] font-black uppercase" style={{ backgroundColor: PURPLE }}>
            Pole
          </span>
        )}
      </div>
      <div className="mt-2 grid grid-cols-3 gap-1 px-3">
        {sectors.map((s) => {
          const complete = t >= s.end;
          return (
            <div key={s.i} className="overflow-hidden rounded-sm bg-white/[0.07]">
              <div
                className="h-1 transition-colors"
                style={{ backgroundColor: complete ? (s.best ? PURPLE : YELLOW) : "rgba(255,255,255,0.12)" }}
              />
              <div className="flex items-baseline justify-between px-1.5 py-1">
                <span className="text-[10px] font-bold text-white/50">S{s.i + 1}</span>
                <span className="text-[12px] font-semibold tabular-nums">{complete ? s.time.toFixed(3) : "–"}</span>
              </div>
            </div>
          );
        })}
      </div>
      {/* the qualifying delta bar */}
      <div className="px-3 pb-3 pt-2.5">
        <div className="flex items-center justify-between text-[11px] font-bold uppercase">
          <span className="text-white/50">Gap to Alonso</span>
          <span className="tabular-nums" style={{ color: delta <= 0 ? GREEN : "#FF4D4D" }}>
            {delta <= 0 ? "−" : "+"}
            {Math.abs(delta).toFixed(3)}
          </span>
        </div>
        <div className="relative mt-1.5 h-2 overflow-hidden rounded-full bg-white/10">
          <span className="absolute inset-y-0 left-1/2 w-px bg-white/40" />
          <span
            className="absolute inset-y-0 transition-[width,left] duration-100"
            style={
              frac < 0
                ? { left: `${50 + frac * 50}%`, width: `${-frac * 50}%`, backgroundColor: GREEN }
                : { left: "50%", width: `${frac * 50}%`, backgroundColor: "#FF4D4D" }
            }
          />
        </div>
      </div>
    </div>
  );
};

// ——— car data ————————————————————————————————————————————————————————

export const CarData = ({ s }: { s: CarSample }) => (
  <div className={`flex items-center gap-4 rounded-md px-4 py-2.5 ${panel}`}>
    <div className="w-[78px] text-right">
      <div className="text-[34px] font-bold leading-none tabular-nums">{s.speed}</div>
      <div className="text-[10px] font-bold uppercase tracking-wider text-white/50">km/h</div>
    </div>
    <div className="flex h-11 w-11 flex-col items-center justify-center rounded-full border-2 border-white/25">
      <span className="text-[20px] font-black leading-none">{s.gear || "N"}</span>
      <span className="text-[8px] font-bold uppercase text-white/50">Gear</span>
    </div>
    <div className="w-[150px] space-y-1.5">
      <Bar label="Throttle" value={s.throttle} color={GREEN} />
      <Bar label="Brake" value={s.brake} color="#FF3B30" />
      <Bar label="RPM" value={Math.round((s.rpm / 12500) * 100)} color="#E5E7EB" />
    </div>
    <span
      className={`rounded-sm px-1.5 py-1 text-[11px] font-black uppercase tracking-wide ${
        s.drs ? "text-[#15151E]" : "text-white/30 ring-1 ring-white/15"
      }`}
      style={s.drs ? { backgroundColor: GREEN } : undefined}
    >
      DRS
    </span>
  </div>
);

const Bar = ({ label, value, color }: { label: string; value: number; color: string }) => (
  <div className="flex items-center gap-2">
    <span className="w-[46px] text-[9px] font-bold uppercase tracking-wider text-white/50">{label}</span>
    <span className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
      <span className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${Math.max(0, Math.min(100, value))}%`, backgroundColor: color }} />
    </span>
  </div>
);

// ——— mini track map ————————————————————————————————————————————————————

export const TrackMap = ({
  path,
  car,
  corners,
  active,
  onPick,
}: {
  path: string;
  car: { x: number; y: number } | null;
  corners: { x: number; y: number }[];
  active: number;
  onPick: (i: number) => void;
}) => (
  <div className={`w-[264px] rounded-md p-2 ${panel}`}>
    <svg viewBox="0 0 100 100" className="h-auto w-full" aria-label="Track map">
      <path d={path} fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth={3.2} strokeLinejoin="round" />
      <path d={path} fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth={1.1} strokeLinejoin="round" />
      {corners.map((c, i) => (
        <g key={i} onClick={() => onPick(i)} className="cursor-pointer">
          <circle cx={c.x} cy={c.y} r={3.4} fill={i === active ? "#FFFFFF" : brand(jobs[i]?.organisation ?? "").color} />
          <text x={c.x} y={c.y + 1.15} textAnchor="middle" fontSize={3.4} fontWeight={800} fill={i === active ? "#15151E" : "#FFFFFF"}>
            {CHAPTERS[i].turn}
          </text>
        </g>
      ))}
      {car && <circle cx={car.x} cy={car.y} r={2.2} fill="#3671C6" stroke="#FFFFFF" strokeWidth={0.8} />}
    </svg>
  </div>
);

// ——— the insight card for the job at this corner ——————————————————————————

const CAREER_START = 2020.6;

export const Insight = ({ chapter }: { chapter: number }) => {
  const j = jobs[chapter];
  const c = CHAPTERS[chapter];
  if (!j || !c) return null;
  const b = brand(j.organisation);
  const now = new Date().getFullYear() + new Date().getMonth() / 12;
  const a = (yearValue(j.start) - CAREER_START) / (now - CAREER_START);
  const z = (yearValue(j.end) - CAREER_START) / (now - CAREER_START);
  const logo = logoSrc(j.organisation);
  return (
    <motion.div
      key={chapter}
      initial={{ x: -24, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -24, opacity: 0 }}
      transition={{ duration: 0.28, ease: [0.2, 0.7, 0.2, 1] }}
      className={`w-full overflow-hidden rounded-md md:w-[380px] ${panel}`}
    >
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-1.5">
        <span className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.12em]">
          <span className="h-3 w-1 rounded-sm" style={{ backgroundColor: YELLOW }} />
          Career insight
        </span>
        <span className="text-[11px] font-bold uppercase tracking-wide text-white/55">
          Turn {c.turn} · {c.corner}
        </span>
      </div>
      <div className="flex gap-3 px-3 pt-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded bg-white p-1.5">
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} alt="" className="max-h-full max-w-full object-contain" />
          ) : (
            <span className="text-[12px] font-black text-black">{orgName(j.organisation)}</span>
          )}
        </span>
        <div className="min-w-0">
          <p className="text-[22px] font-black uppercase italic leading-[1.05] tracking-tight">{j.title}</p>
          <p className="mt-0.5 text-[13px] font-semibold uppercase tracking-wide text-white/60">
            {orgName(j.organisation)} · {jobYears(j.start, j.end)}
          </p>
        </div>
      </div>
      {/* where this stint sits in the career, like a stint chart */}
      <div className="px-3 pt-3">
        <div className="relative h-2 rounded-full bg-white/10">
          <span
            className="absolute inset-y-0 rounded-full"
            style={{ left: `${a * 100}%`, width: `${Math.max(2, (z - a) * 100)}%`, backgroundColor: b.color }}
          />
        </div>
        <div className="mt-1 flex justify-between text-[10px] font-bold tabular-nums text-white/40">
          <span>2020</span>
          <span>Now</span>
        </div>
      </div>
      <ul className="space-y-1.5 px-3 pt-2">
        {j.points.map((p) => (
          <li key={p} className="flex gap-2 text-[14px] leading-snug text-white/85">
            <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rotate-45" style={{ backgroundColor: b.color }} />
            {p}
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap items-center gap-1.5 px-3 pb-3 pt-3">
        {j.stacks.flatMap((s) => s.skills).map((s) => (
          <span key={s} className="rounded-sm bg-white/[0.08] px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white/75">
            {s}
          </span>
        ))}
        <a
          href={j.organisationLink}
          target="_blank"
          rel="noreferrer"
          className="ml-auto text-[12px] font-bold uppercase tracking-wide text-white/70 hover:text-white"
        >
          Visit ↗
        </a>
      </div>
    </motion.div>
  );
};

// ——— pre-session: the name strap, after the broadcast lower third ————————

/**
 * The grid: one broadcast name strap along the bottom, where the transport
 * bar sits once the lap starts, with the ways in beside it.
 */
export const Intro = ({ onStart, onPits }: { onStart: () => void; onPits: () => void }) => (
  <motion.div
    initial={{ y: 12, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    className="mx-auto flex w-full max-w-[920px] flex-col overflow-hidden rounded-md text-white shadow-[0_10px_30px_rgba(0,0,0,0.35)] md:flex-row"
    style={{ background: TOWER_BG }}
  >
    <div className="flex min-w-0 flex-1 items-center gap-3 px-4 py-2.5">
      <span aria-hidden className="h-10 w-[5px] shrink-0 rounded-sm" style={{ backgroundColor: TOWER_RED }} />
      <div className="min-w-0">
        <h1 className="flex items-baseline gap-2 leading-none">
          <span className="text-[20px] font-normal">{hero.firstName}</span>
          <span className="text-[27px] font-black uppercase">{hero.lastName}</span>
        </h1>
        <p className="mt-1 truncate text-[13px] font-semibold text-white/65">
          {hero.role}, {hero.team}
          <span className="hidden sm:inline"> · previously {hero.previously.join(", ")}</span>
        </p>
      </div>
    </div>
    <div className="flex shrink-0 whitespace-nowrap border-t border-white/10 text-[13px] font-bold uppercase md:border-l md:border-t-0">
      <button
        onClick={onStart}
        className="flex flex-[1.4] items-center justify-center gap-2 px-3 py-3 transition hover:brightness-110 md:flex-none md:px-5"
        style={{ backgroundColor: TOWER_RED }}
      >
        <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="currentColor" aria-hidden>
          <path d="M5 3.5v13a1 1 0 0 0 1.5.86l11-6.5a1 1 0 0 0 0-1.72l-11-6.5A1 1 0 0 0 5 3.5Z" />
        </svg>
        Start the lap
      </button>
      <button
        onClick={onPits}
        aria-label="Pit lane: side projects"
        className="flex flex-1 items-center justify-center gap-2 px-3 py-3 hover:bg-white/[0.06] md:flex-none md:px-4"
      >
        <span aria-hidden className="flex h-[19px] w-[17px] items-center justify-center rounded-[3px] bg-white text-[12px] font-black text-[#181B26]">
          P
        </span>
        Pit lane
      </button>
      <a
        href={hero.resumeLink}
        target="_blank"
        rel="noreferrer"
        className="flex flex-1 items-center justify-center border-l border-white/10 px-3 py-3 hover:bg-white/[0.06] md:flex-none md:px-4"
      >
        Résumé ↗
      </a>
      <a
        href={GITHUB}
        target="_blank"
        rel="noreferrer"
        className="hidden items-center justify-center border-l border-white/10 px-4 py-3 hover:bg-white/[0.06] sm:flex"
      >
        GitHub ↗
      </a>
    </div>
  </motion.div>
);

// ——— the pit lane ——————————————————————————————————————————————————————

const PROJECT_CODES: Record<string, string> = {
  PeerPrep: "PPR",
  Wadio: "WAD",
  OpenJio: "OJO",
  "YouTube Channel": "YTB",
};

export const PitTower = ({ active, onPick, onBack }: { active: number | null; onPick: (i: number) => void; onBack: () => void }) => (
  <div className="w-[244px] pb-1.5 text-white shadow-[0_10px_30px_rgba(0,0,0,0.35)]" style={{ background: TOWER_BG }}>
    <TowerHeader title="Pit lane" clock="Garages" />
    <ol className="pt-1">
      {projects.map((p, i) => (
        <TowerRow
          key={p.title}
          pos={i + 1}
          leader={i === 0}
          on={i === active}
          mark={
            <span className="flex h-[18px] w-[18px] items-center justify-center rounded-[3px]" style={{ backgroundColor: p.color }}>
              <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="#fff" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
                <path d={PROJECT_ICONS[p.icon]} />
              </svg>
            </span>
          }
          tla={PROJECT_CODES[p.title] ?? p.title.slice(0, 3).toUpperCase()}
          gap={p.title.length > 9 ? p.title.split(" ")[0] : p.title}
          pit={i === active}
          onClick={() => onPick(i)}
          label={p.title}
        />
      ))}
      <TowerRow pos={projects.length + 1} mark={<span className="text-[13px]">‹</span>} tla="OUT" gap="Back to lap" onClick={onBack} label="Back to the lap" />
    </ol>
  </div>
);

// the garage's own back-wall screen carries the screenshot and stack, so
// the broadcast card stays a slim caption with the links
export const ProjectInsight = ({
  p,
  index,
  onPick,
}: {
  p: Project;
  index: number;
  onPick: (i: number) => void;
}) => (
  <motion.div
    key={p.title}
    initial={{ x: -24, opacity: 0 }}
    animate={{ x: 0, opacity: 1 }}
    exit={{ x: -24, opacity: 0 }}
    className={`w-full overflow-hidden md:w-[400px] ${panel}`}
  >
    <div className="flex items-center justify-between border-b border-white/10 px-3 py-1.5">
      <span className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.12em]">
        <span className="h-3 w-1 rounded-sm" style={{ backgroundColor: YELLOW }} />
        Garage {index + 1} of {projects.length}
      </span>
      <span className="text-[11px] font-bold uppercase tracking-wide text-white/55">Pit lane</span>
    </div>
    <div className="flex items-center gap-3 px-3 pt-3">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded" style={{ backgroundColor: p.color }}>
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="#fff" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
          <path d={PROJECT_ICONS[p.icon]} />
        </svg>
      </span>
      <div className="min-w-0">
        <p className="text-[24px] font-black uppercase italic leading-none tracking-tight">{p.title}</p>
        <p className="mt-1 text-[13px] font-semibold uppercase tracking-wide text-white/60">{p.tagline}</p>
      </div>
    </div>
    <p className="px-3 pt-3 text-[14px] leading-relaxed text-white/85">{p.description}</p>
    <div className="mt-3 flex border-t border-white/10 text-[12px] font-black uppercase tracking-wide">
      <button
        onClick={() => onPick(index - 1)}
        disabled={index === 0}
        aria-label="Previous garage"
        className="w-11 shrink-0 py-3 hover:bg-white/[0.06] disabled:opacity-30"
      >
        ‹
      </button>
      {p.primaryLink && (
        <a href={p.primaryLink} target="_blank" rel="noreferrer" className="flex-1 border-l border-white/10 py-3 text-center hover:brightness-110" style={{ backgroundColor: RED }}>
          {p.primaryMessage}
        </a>
      )}
      {p.secondaryLink && (
        <a href={p.secondaryLink} target="_blank" rel="noreferrer" className="flex-1 border-l border-white/10 py-3 text-center hover:bg-white/[0.06]">
          {p.secondaryMessage}
        </a>
      )}
      <button
        onClick={() => onPick(index + 1)}
        disabled={index === projects.length - 1}
        aria-label="Next garage"
        className="ml-auto w-11 shrink-0 border-l border-white/10 py-3 hover:bg-white/[0.06] disabled:opacity-30"
      >
        ›
      </button>
    </div>
  </motion.div>
);

// ——— the transport bar ———————————————————————————————————————————————————

export const Transport = ({
  t,
  total,
  playing,
  rate,
  marks,
  onPlay,
  onRate,
  onSeek,
  children,
}: {
  t: number;
  total: number;
  playing: boolean;
  rate: number;
  marks: { at: number; label: string; color: string }[];
  onPlay: () => void;
  onRate: () => void;
  onSeek: (t: number) => void;
  children?: ReactNode;
}) => {
  const bar = useRef<HTMLDivElement>(null);
  const seek = (clientX: number) => {
    const r = bar.current?.getBoundingClientRect();
    if (!r) return;
    onSeek(Math.max(0, Math.min(1, (clientX - r.left) / r.width)) * total);
  };
  return (
    <div className={`flex items-center gap-3 rounded-md px-2 py-1.5 ${panel}`}>
      <button
        onClick={onPlay}
        aria-label={playing ? "Pause" : "Play"}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded hover:bg-white/10"
      >
        {playing ? (
          <svg viewBox="0 0 20 20" className="h-5 w-5" fill="currentColor"><rect x="4" y="3" width="4" height="14" rx="1" /><rect x="12" y="3" width="4" height="14" rx="1" /></svg>
        ) : (
          <svg viewBox="0 0 20 20" className="h-5 w-5" fill="currentColor"><path d="M5 3.5v13a1 1 0 0 0 1.5.86l11-6.5a1 1 0 0 0 0-1.72l-11-6.5A1 1 0 0 0 5 3.5Z" /></svg>
        )}
      </button>
      <button onClick={onRate} className="w-10 shrink-0 rounded py-1 text-[12px] font-black tabular-nums hover:bg-white/10" aria-label="Playback speed">
        {rate}×
      </button>
      <div
        ref={bar}
        className="relative h-8 min-w-0 flex-1 cursor-pointer touch-none"
        onPointerDown={(e) => {
          (e.target as HTMLElement).setPointerCapture(e.pointerId);
          seek(e.clientX);
        }}
        onPointerMove={(e) => {
          if (e.buttons) seek(e.clientX);
        }}
        role="slider"
        aria-label="Lap position"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={Math.round(t * 10) / 10}
        tabIndex={0}
      >
        <span className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-white/15" />
        <span className="absolute left-0 top-1/2 h-1 -translate-y-1/2 rounded-full" style={{ width: `${(Math.min(t, total) / total) * 100}%`, backgroundColor: "#3671C6" }} />
        {marks.map((m) => (
          <span
            key={m.label}
            title={m.label}
            className="absolute top-1/2 h-3 w-[3px] -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{ left: `${(m.at / total) * 100}%`, backgroundColor: m.color }}
          />
        ))}
        <span
          className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[#3671C6]"
          style={{ left: `${(Math.min(t, total) / total) * 100}%` }}
        />
      </div>
      {children}
    </div>
  );
};

// ——— the live garage screen ————————————————————————————————————————————
// Real DOM, pinned by the scene onto the back-wall screen of the open garage
// with a perspective transform, so the text is crisp and the links work.

export const GARAGE_SCREEN = { w: 1480, h: Math.round((1480 * 2.85) / 7.4) };

export const GarageScreen = ({
  active,
  onPick,
  screenRef,
}: {
  active: number | null;
  onPick: (i: number) => void;
  screenRef: (el: HTMLDivElement | null) => void;
}) => (
  // All four screens stay mounted and painted, stacked in one spot (the
  // camera frames every garage the same way), so changing garage is just a
  // crossfade between layers the browser has already rasterised. Hidden
  // layers sit at opacity 0.001, not 0, so they keep their tiles.
  <div
    ref={screenRef}
    className="absolute left-0 top-0 origin-top-left"
    style={{ width: GARAGE_SCREEN.w, height: GARAGE_SCREEN.h, opacity: 0.001, willChange: "opacity" }}
  >
    {projects.map((p, index) => (
      <div
        key={p.title}
        aria-hidden={active !== index}
        className="absolute inset-0 overflow-hidden rounded-[10px] bg-[#0B0D12] text-white transition-opacity duration-200"
        style={{ opacity: active === index ? 1 : 0.001, pointerEvents: active === index ? "auto" : "none", willChange: "opacity" }}
      >
      <>
          <div className="h-[14px]" style={{ backgroundColor: p.color }} />
          <div className="flex h-[calc(100%-14px)] gap-12 px-10 py-8">
            <div className="relative flex w-[46%] shrink-0 items-center justify-center overflow-hidden rounded-[8px] bg-[#161920]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.image} alt={`${p.title} screenshot`} className="max-h-full max-w-full object-contain" />
            </div>
            <div className="flex min-w-0 flex-1 flex-col">
              <p className="text-[24px] font-bold uppercase tracking-[0.08em]" style={{ color: p.color }}>
                Garage {index + 1} of {projects.length} · Side project
              </p>
              <h3 className="mt-1 text-[80px] font-black uppercase italic leading-[0.95] tracking-tight">{p.title}</h3>
              <p className="mt-2 text-[30px] font-semibold leading-tight text-white/80">{p.tagline}</p>
              <p className="mt-3 line-clamp-4 text-[24px] leading-[1.4] text-white/70">{p.description}</p>
              <div className="mt-auto flex flex-wrap gap-2 pt-4">
                {p.skills.slice(0, 5).map((s) => (
                  <span key={s} className="rounded-[5px] bg-white/[0.09] px-3 py-1.5 text-[19px] font-bold uppercase tracking-wide text-white/80">
                    {s}
                  </span>
                ))}
                {p.skills.length > 5 && (
                  <span
                    title={p.skills.slice(5).join(", ")}
                    className="rounded-[5px] px-3 py-1.5 text-[19px] font-bold uppercase tracking-wide text-white/50 ring-1 ring-white/15"
                  >
                    +{p.skills.length - 5} more
                  </span>
                )}
              </div>
              <div className="mt-4 flex items-center gap-3 text-[22px] font-bold uppercase tracking-wide">
                {p.primaryLink && (
                  <a href={p.primaryLink} target="_blank" rel="noreferrer" className="rounded-[6px] px-6 py-3 hover:brightness-110" style={{ backgroundColor: RED }}>
                    {p.primaryMessage} ↗
                  </a>
                )}
                {p.secondaryLink && (
                  <a href={p.secondaryLink} target="_blank" rel="noreferrer" className="rounded-[6px] bg-white/[0.1] px-6 py-3 hover:bg-white/[0.18]">
                    {p.secondaryMessage} ↗
                  </a>
                )}
                <span className="ml-auto flex gap-2">
                  <button
                    onClick={() => onPick(index - 1)}
                    disabled={index === 0}
                    aria-label="Previous garage"
                    className="h-[58px] w-[58px] rounded-[6px] bg-white/[0.1] text-[30px] hover:bg-white/[0.18] disabled:opacity-25"
                  >
                    ‹
                  </button>
                  <button
                    onClick={() => onPick(index + 1)}
                    disabled={index === projects.length - 1}
                    aria-label="Next garage"
                    className="h-[58px] w-[58px] rounded-[6px] bg-white/[0.1] text-[30px] hover:bg-white/[0.18] disabled:opacity-25"
                  >
                    ›
                  </button>
                </span>
              </div>
            </div>
          </div>
          {/* a faint glare so it reads as a screen in the room */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{ background: "linear-gradient(115deg, rgba(255,255,255,0.07) 0%, transparent 35%)" }}
          />
        </>
      </div>
    ))}
  </div>
);
