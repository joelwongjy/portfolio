import { motion } from "framer-motion";
import Link from "next/link";

import { hero } from "@/data/hero";

const checker = {
  background:
    "repeating-conic-gradient(rgba(255,255,255,0.7) 0% 25%, transparent 0% 50%) 0 0 / 10px 10px",
};

export const Podium = () => (
  <section className="relative flex min-h-[60vh] flex-col items-center justify-center overflow-hidden px-6 py-24 text-center">
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, ease: [0.21, 0.6, 0.35, 1] }}
      className="flex flex-col items-center"
    >
      <div className="h-2.5 w-36 rounded-full opacity-40" style={checker} />
      <p
        className="mt-10 text-xs font-semibold uppercase tracking-[0.35em]"
        style={{ color: "var(--livery)" }}
      >
        Chequered flag
      </p>
      <h2 className="mt-4 text-4xl font-extrabold tracking-tight text-white sm:text-6xl">
        Lights to flag.
      </h2>
      <p className="mt-5 max-w-sm text-white/50">
        That&apos;s the race so far. Fancy a debrief? The full résumé has all
        the telemetry.
      </p>
      <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
        <a
          href={hero.resumeLink}
          target="_blank"
          rel="noreferrer"
          className="rounded-full px-6 py-3 text-sm font-bold text-black transition-transform hover:scale-105"
          style={{
            backgroundColor: "var(--livery)",
            boxShadow: "0 0 24px var(--livery-glow)",
          }}
        >
          View résumé
        </a>
        <Link
          href="/"
          className="rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-white/70 transition-colors hover:border-white/30 hover:text-white"
        >
          Box, box — classic site
        </Link>
      </div>
    </motion.div>
  </section>
);
