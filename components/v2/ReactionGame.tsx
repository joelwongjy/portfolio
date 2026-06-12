import { motion } from "framer-motion";
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
      className="relative mx-auto flex w-full max-w-md cursor-pointer select-none flex-col items-center outline-none"
    >
      <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.3em] text-white/40">
        <span className="h-px w-10 bg-white/15" />
        <span>Reaction test{best !== null ? ` · PB ${best} ms` : ""}</span>
        <span className="h-px w-10 bg-white/15" />
      </div>

      <div className="mt-6 flex gap-2.5 sm:gap-3">
        {[1, 2, 3, 4, 5].map((column) => (
          <div
            key={column}
            className="flex flex-col gap-2 rounded-full bg-zinc-900/90 p-2"
          >
            {[0, 1].map((row) => (
              <span
                key={row}
                className="block h-7 w-7 rounded-full transition-colors duration-100 sm:h-9 sm:w-9"
                style={
                  lit >= column
                    ? {
                        backgroundColor: "#FF1801",
                        boxShadow: "0 0 18px 4px rgba(255, 24, 1, 0.55)",
                      }
                    : { backgroundColor: "#222226" }
                }
              />
            ))}
          </div>
        ))}
      </div>

      <div className="mt-6 flex min-h-[84px] flex-col items-center">
        {phase === "idle" && (
          <>
            <p className="text-base font-medium text-white/75">
              Tap when the lights go out
            </p>
            <motion.p
              className="mt-1.5 text-xs uppercase tracking-[0.25em] text-white/40"
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              Tap to arm · space works too
            </motion.p>
          </>
        )}
        {phase === "arming" && (
          <p className="pt-2 text-base text-white/60">Wait for it…</p>
        )}
        {phase === "go" && (
          <p
            className="text-3xl font-extrabold uppercase tracking-wide"
            style={{ color: "var(--livery)" }}
          >
            Go go go!
          </p>
        )}
        {phase === "result" && (
          <>
            <p className="text-5xl font-extrabold leading-none tracking-tight text-white">
              {ms}
              <span className="text-lg font-semibold text-white/50"> ms</span>
            </p>
            <p className="mt-2 text-sm text-white/55">
              {verdict(ms, team.name)}
            </p>
            <p className="mt-1 text-xs uppercase tracking-[0.25em] text-white/35">
              Tap to go again
            </p>
          </>
        )}
        {phase === "jump" && (
          <>
            <p className="text-3xl font-extrabold uppercase text-red-500">
              Jump start!
            </p>
            <p className="mt-2 text-sm text-white/55">
              Drive-through penalty. Tap to retry.
            </p>
          </>
        )}
      </div>
    </div>
  );
};
