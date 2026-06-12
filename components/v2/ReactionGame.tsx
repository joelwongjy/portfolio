import { useCallback, useEffect, useRef, useState } from "react";

import { useLivery } from "./LiveryContext";

const LIGHT_INTERVAL = 420;
const PB_KEY = "reaction-pb";

type Phase = "idle" | "arming" | "go" | "result" | "jump";

const verdict = (ms: number, team: string) => {
  if (ms < 180) return `Alien reflexes. ${team} should call you.`;
  if (ms < 240) return "Front-row launch.";
  if (ms < 320) return "Solid midfield getaway.";
  if (ms < 450) return "Anti-stall kicked in.";
  return "Did you stall it?";
};

export const ReactionGame = () => {
  const { team } = useLivery();
  const [phase, setPhase] = useState<Phase>("idle");
  const [lit, setLit] = useState(0);
  const [ms, setMs] = useState(0);
  const [best, setBest] = useState<number | null>(null);
  const timers = useRef<number[]>([]);
  const goTime = useRef(0);

  useEffect(() => {
    const saved = Number(localStorage.getItem(PB_KEY));
    if (saved > 0) setBest(saved);
    const pending = timers.current;
    return () => pending.forEach(window.clearTimeout);
  }, []);

  const start = useCallback(() => {
    timers.current.forEach(window.clearTimeout);
    timers.current = [];
    setPhase("arming");
    setLit(0);
    for (let i = 1; i <= 5; i++) {
      timers.current.push(
        window.setTimeout(() => setLit(i), i * LIGHT_INTERVAL)
      );
    }
    // F1 starts hold all five lights for a random beat before lights out
    const hold = 5 * LIGHT_INTERVAL + 500 + Math.random() * 1200;
    timers.current.push(
      window.setTimeout(() => {
        setLit(0);
        goTime.current = performance.now();
        setPhase("go");
      }, hold)
    );
  }, []);

  const tap = useCallback(() => {
    if (phase === "idle" || phase === "result" || phase === "jump") {
      start();
      return;
    }
    if (phase === "arming") {
      timers.current.forEach(window.clearTimeout);
      setLit(0);
      setPhase("jump");
      return;
    }
    if (phase === "go") {
      const dt = Math.round(performance.now() - goTime.current);
      setMs(dt);
      setPhase("result");
      setBest((prev) => {
        const next = prev === null || dt < prev ? dt : prev;
        localStorage.setItem(PB_KEY, String(next));
        return next;
      });
    }
  }, [phase, start]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== "Space" || e.repeat) return;
      e.preventDefault();
      tap();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [tap]);

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Reaction test — tap when the lights go out"
      onPointerDown={tap}
      className="relative w-full max-w-[340px] cursor-pointer select-none rounded-3xl border border-white/10 bg-white/[0.04] px-6 pb-5 pt-4 backdrop-blur-sm transition-colors hover:border-white/25"
    >
      <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.25em] text-white/40">
        <span>Reaction test</span>
        <span>{best !== null ? `PB ${best} ms` : "No PB yet"}</span>
      </div>
      <div className="mt-4 flex justify-center gap-2">
        {[1, 2, 3, 4, 5].map((column) => (
          <div
            key={column}
            className="flex flex-col gap-1.5 rounded-full bg-black/60 p-1.5"
          >
            {[0, 1].map((row) => (
              <span
                key={row}
                className="block h-3.5 w-3.5 rounded-full transition-colors duration-100"
                style={
                  lit >= column
                    ? {
                        backgroundColor: "#FF1801",
                        boxShadow: "0 0 10px 2px rgba(255, 24, 1, 0.5)",
                      }
                    : { backgroundColor: "#222226" }
                }
              />
            ))}
          </div>
        ))}
      </div>
      <div className="mt-4 min-h-[48px] text-center">
        {phase === "idle" && (
          <p className="text-sm leading-snug text-white/60">
            Tap when the lights go out.
            <br />
            <span className="text-white/35">Tap to arm. Space works too.</span>
          </p>
        )}
        {phase === "arming" && (
          <p className="pt-2 text-sm text-white/60">Wait for it…</p>
        )}
        {phase === "go" && (
          <p
            className="pt-1 text-lg font-extrabold uppercase tracking-wide"
            style={{ color: "var(--livery)" }}
          >
            Go go go!
          </p>
        )}
        {phase === "result" && (
          <>
            <p className="text-2xl font-extrabold leading-none text-white">
              {ms}
              <span className="text-sm font-semibold text-white/50"> ms</span>
            </p>
            <p className="mt-1.5 text-xs text-white/50">
              {verdict(ms, team.name)} · tap to go again
            </p>
          </>
        )}
        {phase === "jump" && (
          <>
            <p className="pt-1 text-lg font-extrabold text-red-500">
              Jump start!
            </p>
            <p className="mt-1 text-xs text-white/50">
              Drive-through penalty. Tap to retry.
            </p>
          </>
        )}
      </div>
    </div>
  );
};
