import { motion } from "framer-motion";

import { teams, useLivery } from "./LiveryContext";

export const IslandNav = () => {
  const { team, setTeam } = useLivery();

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-40 flex justify-center px-4">
      <motion.nav
        initial={{ y: -64, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 24 }}
        className="pointer-events-auto flex items-center gap-4 rounded-full border border-white/10 bg-black/60 py-2 pl-5 pr-3 shadow-2xl backdrop-blur-xl"
      >
        <a
          href="#top"
          className="text-sm font-extrabold tracking-tight"
          style={{ color: "var(--livery)" }}
        >
          JW
        </a>
        <a
          href="#circuit"
          className="text-xs font-medium text-white/70 transition-colors hover:text-white"
        >
          Career
        </a>
        <span className="h-4 w-px bg-white/15" />
        <div
          className="flex items-center gap-1"
          role="radiogroup"
          aria-label="Team livery"
        >
          {teams.map((t) => (
            <button
              key={t.id}
              role="radio"
              aria-checked={team.id === t.id}
              aria-label={t.name}
              title={t.name}
              onClick={() => setTeam(t)}
              className="rounded-full p-1.5"
            >
              <motion.span
                className="block h-3.5 w-3.5 rounded-full"
                animate={{ scale: team.id === t.id ? 1.3 : 1 }}
                style={{
                  backgroundColor: t.color,
                  boxShadow:
                    team.id === t.id ? `0 0 10px 2px ${t.glow}` : "none",
                }}
              />
            </button>
          ))}
        </div>
      </motion.nav>
    </div>
  );
};
