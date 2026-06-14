import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef } from "react";

import { organisationToLogo } from "@/constants/logos";
import { experience } from "@/data/experience";

import { useLivery } from "./LiveryContext";
import { RaceState, useRace } from "./RaceContext";
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

// One lap of Monaco as a scroll-driven flyover. Each bridge over the track is
// a career chapter; the car's current corner is published to the Dynamic
// Island, and tapping a bridge opens that chapter's dossier there.
export const Circuit3D = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const progressRef = useRef(0);
  const { team } = useLivery();
  const { setRace, setOpenJob } = useRace();
  const lastRace = useRef<RaceState>({
    active: false,
    corner: 0,
    progress: 0,
    jobIndex: -1,
  });

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

    const next: RaceState = {
      active: rect.top < 0 && rect.bottom > window.innerHeight,
      corner: Math.max(idx + 1, 1),
      progress: Math.round(p * 100) / 100,
      jobIndex: idx,
    };
    const prev = lastRace.current;
    if (
      next.active !== prev.active ||
      next.corner !== prev.corner ||
      next.progress !== prev.progress ||
      next.jobIndex !== prev.jobIndex
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
          onSelect={(i) => setOpenJob(i)}
        />
      </div>
    </section>
  );
};
