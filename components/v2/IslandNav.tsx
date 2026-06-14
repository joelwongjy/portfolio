import { AnimatePresence, motion } from "framer-motion";

import { experience } from "@/data/experience";

import { CORNER_META, OrganisationLogo } from "./Circuit";
import { useLivery } from "./LiveryContext";
import { useRace } from "./RaceContext";
import { TechChip } from "./TechChip";

const items = experience.experiences.filter((e) => e.isShown !== false);

const spring = { type: "spring", stiffness: 360, damping: 32 } as const;
const fade = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.16 },
};

// The Dynamic Island doubles as the live HUD: an identity pill at rest, the
// job the car is currently passing while on the circuit, and the full dossier
// for that job when tapped.
export const IslandNav = () => {
  const { team } = useLivery();
  const { race, openJob, setOpenJob } = useRace();

  const live = race.active && race.jobIndex >= 0;
  const jobIndex = race.jobIndex;
  const job = jobIndex >= 0 ? items[jobIndex] : null;
  const meta = jobIndex >= 0 ? CORNER_META[jobIndex % CORNER_META.length] : null;

  const detail = openJob !== null ? items[openJob] : null;
  const detailMeta =
    openJob !== null ? CORNER_META[openJob % CORNER_META.length] : null;

  const onIslandTap = () => {
    if (live) setOpenJob(jobIndex);
    else window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 top-4 z-40 flex justify-center px-4">
        <motion.button
          layout
          onClick={onIslandTap}
          transition={spring}
          aria-label={live && job ? `${job.title}, tap for details` : "Joel Wong"}
          className="pointer-events-auto flex items-center overflow-hidden rounded-full border border-white/10 bg-black/75 text-left shadow-2xl backdrop-blur-xl"
        >
          <AnimatePresence mode="popLayout" initial={false}>
            {live && job && meta ? (
              <motion.div
                key="job"
                {...fade}
                className="flex items-center gap-3 py-1.5 pl-2 pr-3.5"
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
                    {meta.corner}
                  </span>
                </span>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 16 16"
                  fill="none"
                  className="ml-0.5 shrink-0"
                  style={{ color: "var(--livery)" }}
                >
                  <path
                    d="M6 4l4 4-4 4"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </motion.div>
            ) : (
              <motion.div
                key="id"
                {...fade}
                className="flex items-center gap-2.5 py-2 pl-4 pr-4"
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
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/45">
                  {team.code} · {team.number}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      {/* full dossier for the tapped corner */}
      <AnimatePresence>
        {detail && detailMeta && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-3 backdrop-blur-sm sm:items-center"
            onClick={() => setOpenJob(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 28, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.98 }}
              transition={{ duration: 0.28, ease: [0.21, 0.6, 0.35, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-h-[80dvh] w-full max-w-md overflow-y-auto rounded-3xl border border-white/10 bg-[#0B0B0D]/95 p-6 shadow-2xl"
            >
              <button
                onClick={() => setOpenJob(null)}
                aria-label="Close"
                className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/70 transition-colors hover:bg-white/20"
              >
                ✕
              </button>

              <div className="flex items-center gap-3">
                <span className="flex h-9 shrink-0 items-center">
                  <OrganisationLogo organisation={detail.organisation} />
                </span>
                <div>
                  <p
                    className="font-mono text-[10px] uppercase tracking-[0.2em]"
                    style={{ color: "var(--livery)" }}
                  >
                    {detailMeta.corner}
                  </p>
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
                    {detail.start} — {detail.end}
                  </p>
                </div>
              </div>

              <h3 className="mt-5 text-2xl font-extrabold tracking-tight text-white">
                {detail.title}
              </h3>
              <a
                href={detail.organisationLink}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-block text-sm font-semibold capitalize text-white/55 transition-colors hover:text-white"
              >
                {detail.organisation} ↗
              </a>

              <p className="mt-3 text-sm text-white/55">{detail.description}</p>
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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
