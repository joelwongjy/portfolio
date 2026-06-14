import { motion } from "framer-motion";

import { hero } from "@/data/hero";

import { useLivery } from "./LiveryContext";
import { ReactionGame } from "./ReactionGame";

const rise = {
  hidden: { opacity: 0, y: 22 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay, ease: [0.21, 0.6, 0.35, 1] },
  }),
};

export const HeroV2 = () => {
  const { team } = useLivery();

  return (
    <section
      id="top"
      className="relative flex min-h-[100svh] flex-col justify-center overflow-hidden px-6 pb-24 pt-28 sm:px-10"
    >
      {/* livery glow */}
      <div
        aria-hidden
        className="absolute -right-32 -top-24 h-[40rem] w-[40rem] rounded-full opacity-25 blur-[140px]"
        style={{ backgroundColor: "var(--livery)" }}
      />
      {/* diagonal speed sheen — crafted, not a generic grid */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          backgroundImage:
            "repeating-linear-gradient(118deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 1px, transparent 1px, transparent 26px)",
          maskImage:
            "linear-gradient(105deg, black 0%, transparent 62%)",
          WebkitMaskImage:
            "linear-gradient(105deg, black 0%, transparent 62%)",
        }}
      />
      {/* oversized race number watermark (Verstappen #1) */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-6 top-1/2 -translate-y-1/2 select-none font-extrabold leading-none tracking-tighter sm:right-4"
        style={{
          fontSize: "clamp(16rem, 40vw, 34rem)",
          color: "transparent",
          WebkitTextStroke: "1.5px rgba(255,255,255,0.06)",
        }}
      >
        1
      </div>

      {/* left livery stripe */}
      <div
        aria-hidden
        className="absolute left-0 top-0 hidden h-full w-1.5 sm:block"
        style={{
          background:
            "linear-gradient(180deg, var(--livery) 0%, var(--livery) 58%, #E1000A 58%, #E1000A 74%, #FFC906 74%, #FFC906 100%)",
        }}
      />

      <div className="relative mx-auto w-full max-w-5xl">
        {/* kicker */}
        <motion.div
          variants={rise}
          custom={0.05}
          initial="hidden"
          animate="visible"
          className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.32em] text-white/45"
        >
          <span
            className="block h-2 w-2 rounded-full"
            style={{
              backgroundColor: "var(--livery)",
              boxShadow: "0 0 10px var(--livery-glow)",
            }}
          />
          {hero.role}
          <span className="text-white/25">·</span>
          <span className="text-white/70">{hero.team}</span>
        </motion.div>

        {/* name + race number */}
        <div className="mt-6 flex items-end gap-5 sm:gap-8">
          <motion.span
            variants={rise}
            custom={0.12}
            initial="hidden"
            animate="visible"
            className="hidden shrink-0 font-extrabold leading-[0.8] tracking-tighter text-white/90 sm:block"
            style={{
              fontSize: "clamp(5rem, 11vw, 10rem)",
              WebkitTextStroke: "2px var(--livery)",
              color: "transparent",
            }}
          >
            {hero.number}
          </motion.span>
          <motion.h1
            variants={rise}
            custom={0.18}
            initial="hidden"
            animate="visible"
            className="font-extrabold uppercase leading-[0.82] tracking-tighter text-white"
            style={{ fontSize: "clamp(3.25rem, 13vw, 9rem)" }}
          >
            {hero.firstName}
            <br />
            {hero.lastName}
          </motion.h1>
        </div>

        {/* livery rule */}
        <motion.div
          variants={rise}
          custom={0.26}
          initial="hidden"
          animate="visible"
          className="mt-7 h-1 w-28 rounded-full"
          style={{
            backgroundColor: "var(--livery)",
            boxShadow: "0 0 18px var(--livery-glow)",
          }}
        />

        {/* meta + CTAs */}
        <motion.div
          variants={rise}
          custom={0.32}
          initial="hidden"
          animate="visible"
          className="mt-6 flex flex-col gap-6"
        >
          <p className="max-w-md text-base text-white/55 sm:text-lg">
            Building fast, considered interfaces at {hero.team}. Previously{" "}
            {hero.previously.join(" · ")}.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <a
              href={hero.resumeLink}
              target="_blank"
              rel="noreferrer"
              className="rounded-full px-6 py-3 text-sm font-bold text-black transition-transform hover:scale-[1.03]"
              style={{
                backgroundColor: "var(--livery)",
                boxShadow: "0 0 24px var(--livery-glow)",
              }}
            >
              View résumé
            </a>
            <a
              href="#circuit"
              className="rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-white/75 transition-colors hover:border-white/35 hover:text-white"
            >
              Start the lap
            </a>
          </div>
        </motion.div>

        {/* lights-out reaction test */}
        <motion.div
          variants={rise}
          custom={0.42}
          initial="hidden"
          animate="visible"
          className="mt-14"
        >
          <ReactionGame />
        </motion.div>
      </div>

      {/* scroll cue */}
      <motion.div
        variants={rise}
        custom={0.5}
        initial="hidden"
        animate="visible"
        className="absolute inset-x-0 bottom-7 flex justify-center text-white/35"
      >
        <motion.svg
          width="18"
          height="18"
          viewBox="0 0 16 16"
          fill="none"
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          aria-hidden
        >
          <path
            d="M3 6l5 5 5-5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </motion.svg>
      </motion.div>

      {/* keep livery name referenced for theming consistency */}
      <span className="sr-only">{team.name} livery</span>
    </section>
  );
};
