import { motion } from "framer-motion";

import { hero } from "@/data/hero";

const checker = {
  background:
    "repeating-conic-gradient(rgba(255,255,255,0.7) 0% 25%, transparent 0% 50%) 0 0 / 10px 10px",
};

export const Podium = () => (
  <section className="relative flex min-h-[60vh] flex-col items-center justify-center overflow-hidden px-6 py-28 text-center">
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, ease: [0.21, 0.6, 0.35, 1] }}
      className="flex flex-col items-center"
    >
      <div className="h-2.5 w-36 rounded-full opacity-40" style={checker} />
      <h2 className="mt-10 text-4xl font-extrabold tracking-tight text-white sm:text-6xl">
        Let&apos;s work together.
      </h2>
      <p className="mt-5 max-w-sm text-white/55">
        Frontend engineer open to new opportunities and good problems.
      </p>
      <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
        <a
          href={hero.resumeLink}
          target="_blank"
          rel="noreferrer"
          className="rounded-full px-7 py-3 text-sm font-bold text-white transition-transform hover:scale-[1.03] active:scale-[0.98]"
          style={{ backgroundColor: "var(--livery)" }}
        >
          View résumé
        </a>
        <a
          href="https://github.com/joelwongjy"
          target="_blank"
          rel="noreferrer"
          className="rounded-full border border-white/15 px-7 py-3 text-sm font-semibold text-white/75 transition-colors hover:border-white/35 hover:text-white active:scale-[0.98]"
        >
          GitHub
        </a>
      </div>
    </motion.div>
  </section>
);
