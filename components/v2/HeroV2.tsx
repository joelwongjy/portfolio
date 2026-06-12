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
      <div
        aria-hidden
        className="absolute left-1/2 top-1/3 h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-25 blur-[120px] transition-colors duration-700 sm:h-[36rem] sm:w-[36rem]"
        style={{ backgroundColor: "var(--livery)" }}
      />
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
      <motion.div
        variants={rise}
        custom={0.5}
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
