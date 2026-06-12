import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { MouseEvent, useState } from "react";

import { CORNER_META } from "./Circuit";
import { teams, useLivery } from "./LiveryContext";
import { useRace } from "./RaceContext";

const stop = (e: MouseEvent) => e.stopPropagation();

const fade = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.18 },
};

export const IslandNav = () => {
  const { team, setTeam } = useLivery();
  const { race } = useRace();
  const [expanded, setExpanded] = useState(false);
  const [pb, setPb] = useState<number | null>(null);

  const toggle = () => {
    setExpanded((open) => {
      if (!open) {
        const saved = Number(localStorage.getItem("reaction-pb"));
        setPb(saved > 0 ? saved : null);
      }
      return !open;
    });
  };

  const mode = expanded ? "expanded" : race.active ? "live" : "compact";
  const corner = CORNER_META[(race.corner - 1) % CORNER_META.length];

  return (
    <>
      {expanded && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setExpanded(false)}
        />
      )}
      <div className="pointer-events-none fixed inset-x-0 top-4 z-40 flex justify-center px-4">
        <motion.nav
          layout
          onClick={toggle}
          transition={{ type: "spring", stiffness: 320, damping: 30 }}
          className={`pointer-events-auto cursor-pointer overflow-hidden border border-white/10 bg-black/75 shadow-2xl backdrop-blur-xl ${
            expanded ? "rounded-3xl" : "rounded-full"
          }`}
        >
          <AnimatePresence mode="popLayout" initial={false}>
            {mode === "compact" && (
              <motion.div
                key="compact"
                {...fade}
                className="flex items-center gap-4 py-2 pl-5 pr-3"
              >
                <span
                  className="text-sm font-extrabold tracking-tight"
                  style={{ color: "var(--livery)" }}
                >
                  JW
                </span>
                <span className="h-4 w-px bg-white/15" />
                <span className="flex items-center gap-1" onClick={stop}>
                  {teams.map((t) => (
                    <button
                      key={t.id}
                      aria-label={t.name}
                      title={t.name}
                      onClick={() => setTeam(t)}
                      className="rounded-full p-1.5"
                    >
                      <motion.span
                        className="block h-3.5 w-3.5 rounded-full"
                        animate={{ scale: team.id === t.id ? 1.3 : 1 }}
                        style={{
                          backgroundColor: t.color,
                          boxShadow:
                            team.id === t.id
                              ? `0 0 10px 2px ${t.glow}`
                              : "none",
                        }}
                      />
                    </button>
                  ))}
                </span>
              </motion.div>
            )}

            {mode === "live" && (
              <motion.div
                key="live"
                {...fade}
                className="flex items-center gap-3 px-4 py-2.5"
              >
                <motion.span
                  className="block h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ backgroundColor: "var(--livery)" }}
                  animate={{ opacity: [1, 0.25, 1] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                />
                <span className="whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.2em] text-white/80">
                  T{race.corner} · {corner.corner}
                </span>
                <span className="h-1 w-16 overflow-hidden rounded-full bg-white/15">
                  <span
                    className="block h-full rounded-full transition-[width] duration-200"
                    style={{
                      width: `${Math.round(race.progress * 100)}%`,
                      backgroundColor: "var(--livery)",
                    }}
                  />
                </span>
                <span className="font-mono text-[10px] text-white/45">
                  {Math.round(race.progress * 100)}%
                </span>
              </motion.div>
            )}

            {mode === "expanded" && (
              <motion.div key="expanded" {...fade} className="w-72 p-5">
                <div className="flex items-center justify-between">
                  <span
                    className="text-sm font-extrabold tracking-tight"
                    style={{ color: "var(--livery)" }}
                  >
                    JW · Race Control
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-white/40">
                    {pb !== null ? `PB ${pb} ms` : "No PB"}
                  </span>
                </div>

                <p className="mt-4 font-mono text-[9px] uppercase tracking-[0.25em] text-white/35">
                  Pick your livery
                </p>
                <div className="mt-2 grid grid-cols-2 gap-2" onClick={stop}>
                  {teams.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTeam(t)}
                      className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-xs font-semibold transition-colors ${
                        team.id === t.id
                          ? "border-white/30 bg-white/10 text-white"
                          : "border-white/10 text-white/60 hover:bg-white/5"
                      }`}
                    >
                      <span
                        className="h-3 w-3 rounded-full"
                        style={{
                          backgroundColor: t.color,
                          boxShadow: `0 0 8px ${t.glow}`,
                        }}
                      />
                      {t.name}
                    </button>
                  ))}
                </div>

                <p className="mt-4 font-mono text-[9px] uppercase tracking-[0.25em] text-white/35">
                  Sectors
                </p>
                <div
                  className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs font-medium text-white/70"
                  onClick={stop}
                >
                  <a href="#top" className="hover:text-white">
                    Grid
                  </a>
                  <a href="#circuit" className="hover:text-white">
                    The Circuit
                  </a>
                  <a href="#pits" className="hover:text-white">
                    Pit Lane
                  </a>
                  <Link href="/" className="text-white/45 hover:text-white">
                    Classic site ↗
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.nav>
      </div>
    </>
  );
};
