import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

const LIGHT_INTERVAL = 480;
const HOLD_AFTER_LIT = 1100;

export const LightsOut = ({ onDone }: { onDone: () => void }) => {
  const reducedMotion = useReducedMotion();
  const [lit, setLit] = useState(0);
  const [out, setOut] = useState(false);

  useEffect(() => {
    if (reducedMotion) {
      onDone();
      return;
    }
    const timers = [1, 2, 3, 4, 5].map((i) =>
      window.setTimeout(() => setLit(i), i * LIGHT_INTERVAL)
    );
    timers.push(
      window.setTimeout(() => setOut(true), 5 * LIGHT_INTERVAL + HOLD_AFTER_LIT)
    );
    return () => timers.forEach(window.clearTimeout);
  }, [reducedMotion, onDone]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  if (reducedMotion) return null;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black"
      animate={{ opacity: out ? 0 : 1 }}
      transition={{ duration: 0.5, delay: out ? 0.3 : 0 }}
      onAnimationComplete={() => out && onDone()}
      onClick={() => setOut(true)}
    >
      <div className="flex gap-3 sm:gap-4">
        {[1, 2, 3, 4, 5].map((column) => (
          <div
            key={column}
            className="flex flex-col items-center gap-3 rounded-full bg-zinc-900 px-2.5 py-3 sm:px-3 sm:py-4"
          >
            {[0, 1].map((row) => (
              <div
                key={row}
                className="h-8 w-8 rounded-full transition-shadow sm:h-11 sm:w-11"
                style={
                  lit >= column && !out
                    ? {
                        backgroundColor: "#FF1801",
                        boxShadow: "0 0 24px 6px rgba(255, 24, 1, 0.55)",
                      }
                    : { backgroundColor: "#27272A" }
                }
              />
            ))}
          </div>
        ))}
      </div>
      <p className="mt-10 h-4 text-xs font-medium uppercase tracking-[0.3em] text-white/40">
        {out ? "And away we go" : lit === 5 ? "It's lights out…" : ""}
      </p>
      <p className="absolute bottom-8 text-[11px] text-white/25">tap to skip</p>
    </motion.div>
  );
};
