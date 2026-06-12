import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

export interface Compound {
  name: string;
  letter: string;
  color: string;
  time: string;
}

const D = 2.8; // seconds, whole stop

// A wheel seen face-on: tyre, compound sidewall band, aero cover, rim rings.
const Wheel = ({ ring }: { ring: string }) => (
  <>
    <circle r={46} fill="#141417" />
    <circle r={46} fill="none" stroke="#000000" strokeWidth={1.5} opacity={0.7} />
    <circle r={39.5} fill="none" stroke={ring} strokeWidth={4} />
    <circle r={27} fill="#222228" />
    <circle r={27} fill="none" stroke="#0C0C0E" strokeWidth={1} />
    <circle r={20} fill="none" stroke="#2F2F36" strokeWidth={1.3} />
    <circle r={12} fill="none" stroke="#2F2F36" strokeWidth={1.3} />
  </>
);

const Nut = () => (
  <g>
    <circle r={7.5} fill="var(--livery)" />
    <polygon
      points="5,0 2.5,4.3 -2.5,4.3 -5,0 -2.5,-4.3 2.5,-4.3"
      fill="rgba(0,0,0,0.35)"
    />
    <circle r={2} fill="#0B0B0D" />
  </g>
);

// Chunky pneumatic wheel gun with hose, drawn in its engaged position and
// slid in/out via keyframes.
const Gun = () => (
  <g>
    <path
      d="M 76 6 C 120 14 150 46 230 50"
      stroke="#26262C"
      strokeWidth={5}
      fill="none"
      strokeLinecap="round"
    />
    <rect x={8} y={-7} width={20} height={14} rx={2.5} fill="#303037" />
    <rect x={26} y={-12} width={52} height={24} rx={7} fill="#3B3B43" />
    <rect x={26} y={-12} width={52} height={5} rx={2.5} fill="var(--livery)" opacity={0.7} />
    <rect x={42} y={12} width={15} height={22} rx={5} fill="#33333A" />
  </g>
);

interface WheelGunCamProps {
  compound: Compound;
  active: boolean;
  wingStop?: boolean;
}

// The pit stop from the gunner's crouch: gun in, nut off, worn wheel pulled
// toward camera, brakes glowing, fresh compound on, gun away, car dropped.
export const WheelGunCam = ({ compound, active, wingStop }: WheelGunCamProps) => {
  const [play, setPlay] = useState(0);
  const wasActive = useRef(false);

  useEffect(() => {
    if (active && !wasActive.current) setPlay((p) => p + 1);
    wasActive.current = active;
  }, [active]);

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Replay pit stop"
      onClick={() => setPlay((p) => p + 1)}
      className="relative mb-5 cursor-pointer overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.05] to-transparent"
    >
      <svg viewBox="0 0 320 190" className="block w-full" aria-hidden>
        {/* garage */}
        <rect x={0} y={150} width={320} height={40} fill="#0A0A0C" />
        <line x1={0} y1={150} x2={320} y2={150} stroke="rgba(255,255,255,0.14)" />
        <ellipse cx={110} cy={151} rx={54} ry={5} fill="#000000" opacity={0.55} />

        {/* the car: body drops at the end of the stop */}
        <motion.g
          key={play > 0 ? `car-${play}` : "car-static"}
          animate={
            play > 0 ? { y: [0, 0, 3, 0] } : { y: 0 }
          }
          transition={{ duration: D, times: [0, 0.92, 0.96, 1] }}
        >
          {/* bodywork above the wheel */}
          <rect x={4} y={24} width={236} height={64} rx={18} fill="#101014" />
          <rect x={4} y={76} width={236} height={6} fill="var(--livery)" opacity={0.75} />
          <rect x={150} y={36} width={70} height={20} rx={9} fill="#17171B" />
          {/* suspension + upright, visible when the wheel is off */}
          <line x1={70} y1={82} x2={106} y2={98} stroke="#1F1F24" strokeWidth={5} />
          <line x1={70} y1={92} x2={106} y2={106} stroke="#1F1F24" strokeWidth={5} />
          <g transform="translate(110 103)">
            {/* brake disc + caliper behind the wheel */}
            <circle r={21} fill="#232328" />
            <circle r={16} fill="none" stroke="#33333A" strokeWidth={2} strokeDasharray="2.5 3.5" />
            <rect x={12} y={-13} width={9} height={26} rx={3.5} fill="#3A2A20" />
            {play > 0 && (
              <motion.circle
                key={`glow-${play}`}
                r={20}
                fill="#FF6A00"
                style={{ filter: "blur(7px)" }}
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0, 0.85, 0.85, 0] }}
                transition={{ duration: D, times: [0, 0.44, 0.5, 0.64, 0.76] }}
              />
            )}

            {play === 0 ? (
              <>
                {/* waiting on worn rubber */}
                <Wheel ring="#52525B" />
                <Nut />
              </>
            ) : (
              <g key={`stop-${play}`}>
                {/* worn wheel pulled off toward camera */}
                <motion.g
                  initial={{ x: 0, scale: 1, opacity: 1 }}
                  animate={{
                    x: [0, 0, 58],
                    scale: [1, 1, 1.25],
                    opacity: [1, 1, 0],
                  }}
                  transition={{ duration: D, times: [0, 0.42, 0.58], ease: "easeIn" }}
                >
                  <Wheel ring="#52525B" />
                </motion.g>
                {/* its nut, spun off first */}
                <motion.g
                  initial={{ rotate: 0, opacity: 1 }}
                  animate={{ rotate: [0, 0, -720, -720], opacity: [1, 1, 1, 0] }}
                  transition={{ duration: D, times: [0, 0.16, 0.36, 0.4] }}
                >
                  <Nut />
                </motion.g>
                {/* fresh compound in from the left */}
                <motion.g
                  initial={{ x: -140, scale: 0.94, opacity: 0 }}
                  animate={{
                    x: [-140, -140, 0],
                    scale: [0.94, 0.94, 1],
                    opacity: [0, 1, 1],
                  }}
                  transition={{ duration: D, times: [0, 0.56, 0.72], ease: "easeOut" }}
                >
                  <Wheel ring={compound.color} />
                </motion.g>
                {/* new nut spun on */}
                <motion.g
                  initial={{ rotate: -720, opacity: 0 }}
                  animate={{ rotate: [-720, -720, 0], opacity: [0, 1, 1] }}
                  transition={{ duration: D, times: [0, 0.74, 0.92] }}
                >
                  <Nut />
                </motion.g>
                {/* sparks while the gun hammers */}
                <motion.g
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 1, 0, 0, 1, 0] }}
                  transition={{ duration: D, times: [0.16, 0.26, 0.38, 0.72, 0.84, 0.94] }}
                  stroke="#FFD12E"
                  strokeWidth={1.6}
                  strokeLinecap="round"
                >
                  <line x1={9} y1={-12} x2={14} y2={-19} />
                  <line x1={12} y1={6} x2={19} y2={11} />
                  <line x1={-4} y1={-14} x2={-7} y2={-21} />
                </motion.g>
                {/* the gun, from your side of the car */}
                <motion.g
                  initial={{ x: 150, rotate: 0 }}
                  animate={{
                    x: [150, 0, 0, 14, 14, 0, 0, 150],
                    rotate: [0, 0, -1.6, 0, 0, 1.6, 0, 0],
                  }}
                  transition={{
                    duration: D,
                    times: [0, 0.14, 0.3, 0.44, 0.66, 0.74, 0.9, 1],
                    ease: "easeInOut",
                  }}
                >
                  <Gun />
                </motion.g>
              </g>
            )}
          </g>
        </motion.g>
      </svg>

      {/* HUD */}
      <div className="pointer-events-none absolute left-3 top-2.5 font-mono text-[10px] uppercase tracking-widest text-white/50">
        Wheel gun cam ·{" "}
        <span style={{ color: compound.color }}>{compound.name}</span>
        {wingStop && <span className="text-white/55"> + wing</span>}
      </div>
      <div className="pointer-events-none absolute bottom-2 right-3 flex items-end gap-2">
        {play > 0 && (
          <motion.p
            key={`time-${play}`}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: D * 0.9, duration: 0.25 }}
            className="text-2xl font-extrabold leading-none text-white"
          >
            {compound.time}
            <span className="text-sm font-semibold text-white/50">s</span>
          </motion.p>
        )}
      </div>
      <motion.span
        key={`light-${play}`}
        className="absolute right-3 top-3 block h-2 w-2 rounded-full"
        initial={false}
        animate={
          play > 0
            ? { backgroundColor: ["#E10600", "#E10600", "#22C55E"] }
            : { backgroundColor: "#52525B" }
        }
        transition={{ duration: D, times: [0, 0.93, 0.97] }}
      />
      <span className="pointer-events-none absolute bottom-2 left-3 font-mono text-[9px] uppercase tracking-widest text-white/30">
        tap to replay
      </span>
    </div>
  );
};
