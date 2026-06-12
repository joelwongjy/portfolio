import { motion } from "framer-motion";

import { hero } from "@/data/hero";

import { useLivery } from "./LiveryContext";

const rise = {
  hidden: { opacity: 0, y: 24 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay, ease: [0.21, 0.6, 0.35, 1] },
  }),
};

export const HeroV2 = ({ started }: { started: boolean }) => {
  const { team } = useLivery();

  return (
    <section
      id="top"
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 text-center"
    >
      {/* technical grid backdrop */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.045) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage:
            "radial-gradient(ellipse 90% 65% at 50% 42%, black 25%, transparent 78%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 90% 65% at 50% 42%, black 25%, transparent 78%)",
        }}
      />
      {/* livery glow */}
      <div
        aria-hidden
        className="absolute left-1/2 top-1/3 h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-20 blur-[120px] transition-colors duration-700 sm:h-[36rem] sm:w-[36rem]"
        style={{ backgroundColor: "var(--livery)" }}
      />

      {/* race control strip */}
      <motion.div
        variants={rise}
        custom={0}
        initial="hidden"
        animate={started ? "visible" : "hidden"}
        className="absolute inset-x-0 top-20 flex items-center justify-between px-5 font-mono text-[10px] uppercase tracking-[0.25em] text-white/40 sm:top-24 sm:px-10"
      >
        <span>Rnd 26 · Marina Bay</span>
        <span className="flex items-center gap-2">
          <motion.span
            className="block h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: "var(--livery)" }}
            animate={{ opacity: [1, 0.2, 1] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          />
          Live
        </span>
      </motion.div>

      <motion.p
        variants={rise}
        custom={0.05}
        initial="hidden"
        animate={started ? "visible" : "hidden"}
        className="relative mb-5 text-xs font-semibold uppercase tracking-[0.35em]"
        style={{ color: "var(--livery)" }}
      >
        P1 · {team.name} spec
      </motion.p>
      <motion.h1
        variants={rise}
        custom={0.15}
        initial="hidden"
        animate={started ? "visible" : "hidden"}
        className="relative text-6xl font-extrabold leading-none tracking-tighter text-white sm:text-8xl"
      >
        {hero.firstName}
        <br />
        {hero.lastName}
      </motion.h1>
      <motion.p
        variants={rise}
        custom={0.3}
        initial="hidden"
        animate={started ? "visible" : "hidden"}
        className="relative mt-6 max-w-md text-lg text-white/60"
      >
        {hero.body}. {hero.title}.
      </motion.p>
      <motion.p
        variants={rise}
        custom={0.4}
        initial="hidden"
        animate={started ? "visible" : "hidden"}
        className="relative mt-8 font-mono text-[11px] uppercase tracking-[0.25em] text-white/40"
      >
        6 seasons · 7 teams · Singapore based
      </motion.p>

      <motion.div
        variants={rise}
        custom={0.55}
        initial="hidden"
        animate={started ? "visible" : "hidden"}
        className="absolute bottom-10 flex flex-col items-center gap-2 text-white/40"
      >
        <span className="text-[11px] font-medium uppercase tracking-[0.3em]">
          Formation lap
        </span>
        <motion.svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
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
    </section>
  );
};
