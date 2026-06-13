import { AnimatePresence, motion } from "framer-motion";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { organisationToLogo } from "@/constants/logos";
import { experience } from "@/data/experience";

import { CORNER_META, OrganisationLogo } from "./Circuit";
import { useLivery } from "./LiveryContext";
import { RaceState, useRace } from "./RaceContext";
import { TechChip } from "./TechChip";
import { buildTrack } from "./three/trackData";

const CircuitScene = dynamic(() => import("./three/CircuitScene"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center font-mono text-[10px] uppercase tracking-[0.3em] text-white/30">
      Loading Monte Carlo…
    </div>
  ),
});

const items = experience.experiences.filter((e) => e.isShown !== false);
const banners = items.map((i) => {
  const logo = organisationToLogo[i.organisation];
  return {
    name: i.organisation,
    logo: typeof logo === "string" ? logo : logo?.src,
  };
});

// One lap of Monaco as a scroll-driven flyover. Career entries hang over
// the track as advertising bridges — tap one (or the pill) for details.
export const Circuit3D = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const progressRef = useRef(0);
  const [active, setActive] = useState(-1);
  const [open, setOpen] = useState<number | null>(null);
  const { team } = useLivery();
  const { setRace } = useRace();
  const lastRace = useRef<RaceState>({ active: false, corner: 0, progress: 0 });

  const fractions = useMemo(() => buildTrack().cornerFractions, []);

  const update = useCallback(() => {
    const el = sectionRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const span = rect.height - window.innerHeight;
    const p = span > 0 ? Math.min(Math.max(-rect.top / span, 0), 1) : 0;
    progressRef.current = p;

    let idx = -1;
    fractions.forEach((f, i) => {
      if (p + 0.012 >= f) idx = i;
    });
    setActive(idx);

    const next: RaceState = {
      active: rect.top < 0 && rect.bottom > window.innerHeight,
      corner: Math.max(idx + 1, 1),
      progress: Math.round(p * 100) / 100,
    };
    const prev = lastRace.current;
    if (
      next.active !== prev.active ||
      next.corner !== prev.corner ||
      next.progress !== prev.progress
    ) {
      lastRace.current = next;
      setRace(next);
    }
  }, [fractions, setRace]);

  useEffect(() => {
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [update]);

  const openItem = open !== null ? items[open] : null;
  const openMeta = open !== null ? CORNER_META[open % CORNER_META.length] : null;
  const pillItem = active >= 0 ? items[Math.min(active, items.length - 1)] : null;
  const pillMeta = CORNER_META[Math.max(active, 0) % CORNER_META.length];

  return (
    <section
      id="circuit"
      ref={sectionRef}
      className="relative"
      style={{ height: `${(items.length + 1) * 100}vh` }}
    >
      <div
        className="sticky top-0 h-screen w-full overflow-hidden"
        style={{ height: "100dvh" }}
      >
        <CircuitScene
          progressRef={progressRef}
          livery={team.color}
          glow={team.glow}
          banners={banners}
          onSelect={(i) => setOpen(i)}
        />

        <AnimatePresence mode="wait">
          {active === -1 && open === null && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.5 }}
              className="pointer-events-none absolute inset-x-0 bottom-16 px-6 text-center"
            >
              <p
                className="text-xs font-semibold uppercase tracking-[0.35em]"
                style={{ color: "var(--livery)" }}
              >
                Circuit de Monaco
              </p>
              <h2 className="mt-3 text-4xl font-extrabold tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)] sm:text-5xl">
                Career, lap by lap
              </h2>
              <p className="mx-auto mt-3 max-w-sm text-sm text-white drop-shadow-[0_1px_8px_rgba(0,0,0,0.9)]">
                One lap of Monte Carlo. Each bridge over the track is a
                chapter — tap one to read it.
              </p>
            </motion.div>
          )}

          {open === null && pillItem && active >= 0 && (
            <motion.button
              key={`pill-${active}`}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.35 }}
              onClick={() => setOpen(active)}
              className="absolute left-1/2 flex -translate-x-1/2 items-center gap-3 rounded-full border border-white/15 bg-black/80 py-2.5 pl-5 pr-4 backdrop-blur-xl"
              style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 20px)" }}
            >
              <span
                className="font-mono text-[10px] uppercase tracking-widest"
                style={{ color: "var(--livery)" }}
              >
                T{active + 1} {pillMeta.corner}
              </span>
              <span className="text-sm font-bold capitalize text-white">
                {pillItem.organisation}
              </span>
              <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white/70">
                Details
              </span>
            </motion.button>
          )}

          {openItem && openMeta && (
            <motion.div
              key={`card-${open}`}
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 22 }}
              transition={{ duration: 0.35, ease: [0.21, 0.6, 0.35, 1] }}
              className="absolute inset-x-3 max-h-[55dvh] overflow-y-auto rounded-2xl border border-white/10 bg-black/80 p-5 backdrop-blur-xl sm:inset-x-auto sm:right-8 sm:w-[430px]"
              style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 14px)" }}
            >
              <button
                onClick={() => setOpen(null)}
                aria-label="Close"
                className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-sm text-white/70 hover:bg-white/20"
              >
                ✕
              </button>
              <p className="font-mono text-[10px] uppercase tracking-widest text-white/40">
                T{open! + 1} · {openItem.start} — {openItem.end}
              </p>
              <p
                className="mt-1 font-mono text-[10px] uppercase tracking-widest opacity-90"
                style={{ color: "var(--livery)" }}
              >
                {openMeta.corner} · {openMeta.circuit}
              </p>
              <div className="mt-2 flex items-start justify-between gap-4">
                <h3 className="text-lg font-bold tracking-tight text-white">
                  {openItem.title}
                </h3>
                <a
                  href={openItem.organisationLink}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-0.5 shrink-0 pr-8 transition-opacity hover:opacity-80"
                >
                  <OrganisationLogo organisation={openItem.organisation} />
                </a>
              </div>
              <p className="mt-1.5 text-xs text-white/50">
                {openItem.description}
              </p>
              <ul className="mt-2.5 space-y-1.5">
                {openItem.points.map((point) => (
                  <li
                    key={point}
                    className="text-[13px] leading-relaxed text-white/75"
                  >
                    {point}
                  </li>
                ))}
              </ul>
              {openItem.stacks.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {openItem.stacks
                    .flatMap((stack) => stack.skills)
                    .map((skill) => (
                      <TechChip key={skill} skill={skill} />
                    ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};
