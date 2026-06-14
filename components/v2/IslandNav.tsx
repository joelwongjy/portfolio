import { AnimatePresence, motion } from "framer-motion";

import { hero } from "@/data/hero";
import { experience } from "@/data/experience";

import { OrganisationLogo } from "./Circuit";
import { jobYears } from "./jobYears";
import { useRace } from "./RaceContext";
import { TechChip } from "./TechChip";

const items = experience.experiences.filter((e) => e.isShown !== false);

const spring = { type: "spring", stiffness: 380, damping: 34 } as const;
const fade = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.14 },
};

// The Dynamic Island: an identity pill at rest, the chapter the car is
// currently passing while on the circuit, and — when tapped — that chapter's
// full dossier expanded in place, morphing like Apple's island rather than
// popping a separate sheet.
export const IslandNav = () => {
  const { race, openJob, setOpenJob } = useRace();

  const expanded = openJob !== null;
  const live = race.active && race.jobIndex >= 0;
  const jobIndex = race.jobIndex;
  const job = jobIndex >= 0 ? items[jobIndex] : null;

  const detail = openJob !== null ? items[openJob] : null;

  const mode = expanded ? "expanded" : live ? "live" : "idle";

  return (
    <>
      {expanded && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setOpenJob(null)}
          aria-hidden
        />
      )}

      <div className="pointer-events-none fixed inset-x-0 top-4 z-40 flex justify-center px-4">
        <motion.div
          layout
          transition={spring}
          style={{ borderRadius: expanded ? 26 : 9999 }}
          className="pointer-events-auto overflow-hidden border border-white/10 bg-black/80 shadow-2xl backdrop-blur-2xl"
        >
          <AnimatePresence mode="popLayout" initial={false}>
            {mode === "idle" && (
              <motion.button
                key="idle"
                {...fade}
                onClick={() =>
                  window.scrollTo({ top: 0, behavior: "smooth" })
                }
                className="flex items-center gap-2.5 py-2 pl-3.5 pr-4"
                aria-label="Joel Wong — back to top"
              >
                <span
                  className="block h-2 w-2 rounded-full"
                  style={{
                    backgroundColor: "var(--livery)",
                    boxShadow: "0 0 8px var(--livery-glow)",
                  }}
                />
                <span className="text-[13px] font-extrabold tracking-tight text-white">
                  Joel Wong
                </span>
                <span className="h-3.5 w-px bg-white/15" />
                <span className="text-[11px] font-medium text-white/45">
                  {hero.role}
                </span>
              </motion.button>
            )}

            {mode === "live" && job && (
              <motion.button
                key="live"
                {...fade}
                onClick={() => setOpenJob(jobIndex)}
                className="flex items-center gap-3 py-1.5 pl-2.5 pr-3.5 text-left"
                aria-label={`${job.title} — tap for details`}
              >
                <span className="flex h-7 shrink-0 items-center">
                  <OrganisationLogo organisation={job.organisation} />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[13px] font-bold leading-tight text-white">
                    {job.title}
                  </span>
                  <span className="block truncate font-mono text-[9px] uppercase tracking-[0.18em] text-white/45">
                    <span className="capitalize">{job.organisation}</span> ·{" "}
                    {jobYears(job.start, job.end)}
                  </span>
                </span>
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 16 16"
                  fill="none"
                  className="ml-0.5 shrink-0"
                  style={{ color: "var(--livery)" }}
                  aria-hidden
                >
                  <path
                    d="M6 4l4 4-4 4"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </motion.button>
            )}

            {mode === "expanded" && detail && (
              <motion.div
                key="expanded"
                {...fade}
                className="w-[21rem] max-w-[calc(100vw-2rem)] p-5"
              >
                <div className="flex items-start gap-3">
                  <span className="flex h-9 shrink-0 items-center">
                    <OrganisationLogo organisation={detail.organisation} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p
                      className="font-mono text-[10px] uppercase tracking-[0.2em]"
                      style={{ color: "var(--livery)" }}
                    >
                      {detail.start} — {detail.end}
                    </p>
                  </div>
                  <button
                    onClick={() => setOpenJob(null)}
                    aria-label="Close"
                    className="-mr-1 -mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-white/70 transition-colors hover:bg-white/20"
                  >
                    ✕
                  </button>
                </div>

                <h3 className="mt-4 text-xl font-extrabold tracking-tight text-white">
                  {detail.title}
                </h3>
                <a
                  href={detail.organisationLink}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-0.5 inline-block text-[13px] font-semibold capitalize text-white/55 transition-colors hover:text-white"
                >
                  {detail.organisation} ↗
                </a>

                <div className="mt-3 max-h-[46vh] overflow-y-auto pr-1">
                  <p className="text-[13px] text-white/55">
                    {detail.description}
                  </p>
                  <ul className="mt-3 space-y-2">
                    {detail.points.map((point) => (
                      <li
                        key={point}
                        className="flex gap-2.5 text-[13px] leading-relaxed text-white/80"
                      >
                        <span
                          className="mt-1.5 block h-1 w-1 shrink-0 rounded-full"
                          style={{ backgroundColor: "var(--livery)" }}
                        />
                        {point}
                      </li>
                    ))}
                  </ul>
                  {detail.stacks.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {detail.stacks
                        .flatMap((stack) => stack.skills)
                        .map((skill) => (
                          <TechChip key={skill} skill={skill} />
                        ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </>
  );
};
