import { motion } from "framer-motion";

import { project } from "@/data/projects";

import { TechChip } from "./TechChip";

const STOP_TIMES = ["2.1", "2.4", "2.9", "3.6", "4.2", "4.8"];

const projects = [
  ...project.favoriteProjects.projects,
  ...project.otherProjects.projects,
];

export const PitLane = () => (
  <section id="pits" className="mx-auto max-w-2xl px-4 pb-12 pt-16 sm:px-6">
    <header className="mb-14">
      <p
        className="text-xs font-semibold uppercase tracking-[0.35em]"
        style={{ color: "var(--livery)" }}
      >
        Pit Lane
      </p>
      <h2 className="mt-3 text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
        Box, box.
      </h2>
      <p className="mt-4 text-white/50">
        {projects.length} stops after the flag — the projects. Speed limit 60.
      </p>
    </header>

    <div className="relative">
      {/* pit lane: solid walls, dashed speed-limit line */}
      <div aria-hidden className="absolute bottom-0 left-0 top-0 w-[120px]">
        <div className="absolute bottom-0 top-0 left-[23px] w-px bg-white/15" />
        <div className="absolute bottom-0 top-0 left-[59px] border-l-2 border-dashed border-white/10" />
        <div className="absolute bottom-0 top-0 left-[95px] w-px bg-white/15" />
      </div>

      <ol className="relative space-y-14 pl-[132px]">
        {projects.map((item, i) => (
          <motion.li
            key={item.title}
            className="relative"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, ease: [0.21, 0.6, 0.35, 1] }}
          >
            {/* pit box stall in the lane */}
            <span className="absolute -left-[104px] top-1 flex h-10 w-16 items-center justify-center rounded-md border border-white/15 bg-white/[0.03] font-mono text-[10px] text-white/50">
              P{i + 1}
            </span>

            <p className="font-mono text-[11px] uppercase tracking-widest text-white/40">
              Stop {i + 1} ·{" "}
              <span style={{ color: "var(--livery)" }}>
                {STOP_TIMES[i % STOP_TIMES.length]}s stationary
              </span>
            </p>
            <h3 className="mt-2 text-xl font-bold text-white">{item.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-white/65">
              {item.description}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {item.primaryLink && (
                <a
                  href={item.primaryLink}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full px-3.5 py-1.5 text-xs font-bold text-black transition-transform hover:scale-105"
                  style={{ backgroundColor: "var(--livery)" }}
                >
                  {item.primaryMessage}
                </a>
              )}
              {item.secondaryLink && (
                <a
                  href={item.secondaryLink}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-white/15 px-3.5 py-1.5 text-xs font-semibold text-white/70 transition-colors hover:border-white/30 hover:text-white"
                >
                  {item.secondaryMessage}
                </a>
              )}
            </div>
            {item.skills.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {item.skills.map((skill) => (
                  <TechChip key={skill} skill={skill} />
                ))}
              </div>
            )}
          </motion.li>
        ))}
      </ol>
    </div>
  </section>
);
