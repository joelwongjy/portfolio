import { AnimatePresence, motion } from "framer-motion";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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
      Loading circuit…
    </div>
  ),
});

const items = experience.experiences.filter((e) => e.isShown !== false);

// The lap as a scroll-driven flyover: a sticky 3D scene with one glass card
// surfacing per corner.
export const Circuit3D = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const progressRef = useRef(0);
  const [active, setActive] = useState(-1);
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

  const item = active >= 0 ? items[Math.min(active, items.length - 1)] : null;
  const meta = CORNER_META[Math.max(active, 0) % CORNER_META.length];

  return (
    <section
      id="circuit"
      ref={sectionRef}
      className="relative"
      style={{ height: `${(items.length + 1) * 100}vh` }}
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        <CircuitScene
          progressRef={progressRef}
          livery={team.color}
          glow={team.glow}
        />

        <AnimatePresence mode="wait">
          {active === -1 ? (
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
                The Circuit
              </p>
              <h2 className="mt-3 text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
                Career, lap by lap
              </h2>
              <p className="mx-auto mt-3 max-w-sm text-sm text-white/55">
                {items.length} corners borrowed from the great circuits. Keep
                scrolling to follow the racing line.
              </p>
            </motion.div>
          ) : (
            item && (
              <motion.div
                key={active}
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -18 }}
                transition={{ duration: 0.4, ease: [0.21, 0.6, 0.35, 1] }}
                className="absolute inset-x-3 bottom-4 max-h-[46vh] overflow-y-auto rounded-2xl border border-white/10 bg-black/60 p-5 backdrop-blur-xl sm:inset-x-auto sm:bottom-8 sm:right-8 sm:w-[430px]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-widest text-white/40">
                      T{active + 1} · {item.start} — {item.end}
                    </p>
                    <p
                      className="mt-1 font-mono text-[10px] uppercase tracking-widest opacity-90"
                      style={{ color: "var(--livery)" }}
                    >
                      {meta.corner} · {meta.circuit}
                    </p>
                    <h3 className="mt-2 text-lg font-bold tracking-tight text-white">
                      {item.title}
                    </h3>
                  </div>
                  <a
                    href={item.organisationLink}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 shrink-0 transition-opacity hover:opacity-80"
                  >
                    <OrganisationLogo organisation={item.organisation} />
                  </a>
                </div>
                <p className="mt-1.5 text-xs text-white/50">
                  {item.description}
                </p>
                <ul className="mt-2.5 space-y-1.5">
                  {item.points.map((point) => (
                    <li
                      key={point}
                      className="text-[13px] leading-relaxed text-white/75"
                    >
                      {point}
                    </li>
                  ))}
                </ul>
                {item.stacks.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {item.stacks
                      .flatMap((stack) => stack.skills)
                      .map((skill) => (
                        <TechChip key={skill} skill={skill} />
                      ))}
                  </div>
                )}
              </motion.div>
            )
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};
