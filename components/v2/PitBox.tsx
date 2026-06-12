import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

import { RaceCar } from "./RaceCar";

export interface Compound {
  name: string;
  letter: string;
  color: string;
  time: string;
}

const D = 3.4; // seconds, arrival to launch

const CAR = { x: 160, y: 120 };
// scene positions of the four wheels of the 3x-scaled car
const WHEELS = [
  { x: -31.5, y: -24 },
  { x: -31.5, y: 24 },
  { x: 31.5, y: -24 },
  { x: 31.5, y: 24 },
];

// gunners and jack operators: where they wait, where they work
const CREW: { home: [number, number]; work?: [number, number] }[] = [
  { home: [120, 54], work: [128.5, 80] },
  { home: [200, 54], work: [191.5, 80] },
  { home: [146, 54], work: [128.5, 160] },
  { home: [174, 54], work: [191.5, 160] },
  { home: [92, 54], work: [89, 120] }, // rear jack
  { home: [228, 54], work: [231, 120] }, // front jack
  { home: [70, 54] }, // spares hold the wall
  { home: [250, 54] },
];

const Crew = () => (
  <g>
    <ellipse rx={5} ry={3.6} fill="var(--livery)" opacity={0.95} />
    <circle r={2.3} fill="#E8E8EC" />
  </g>
);

const CrewMember = ({
  home,
  work,
  play,
}: {
  home: [number, number];
  work?: [number, number];
  play: number;
}) => {
  if (play === 0 || !work) {
    return (
      <g transform={`translate(${home[0]} ${home[1]})`}>
        <Crew />
      </g>
    );
  }
  return (
    <motion.g
      key={play}
      initial={{ x: home[0], y: home[1] }}
      animate={{
        x: [home[0], home[0], work[0], work[0], home[0]],
        y: [home[1], home[1], work[1], work[1], home[1]],
      }}
      transition={{ duration: D, times: [0, 0.16, 0.26, 0.72, 0.84], ease: "easeInOut" }}
    >
      <Crew />
    </motion.g>
  );
};

// a wheel seen from above, ferried between car and garage
const LooseWheel = ({ ring }: { ring: string }) => (
  <rect x={-12} y={-8} width={24} height={16} rx={6} fill="#141416" stroke={ring} strokeWidth={3} />
);

interface PitBoxProps {
  box: number;
  compound: Compound;
  active: boolean;
  wingStop?: boolean;
}

// The pit box as the broadcast sees it: garage up top, crew waiting in
// formation, the car sweeps in, jacks up, wheels ferried to and from the
// garage, lights green, launch.
export const PitBox = ({ box, compound, active, wingStop }: PitBoxProps) => {
  const [play, setPlay] = useState(0);
  const [fitted, setFitted] = useState(false);
  const [jacked, setJacked] = useState(false);
  const wasActive = useRef(false);

  useEffect(() => {
    if (active && !wasActive.current) setPlay((p) => p + 1);
    wasActive.current = active;
  }, [active]);

  useEffect(() => {
    if (play === 0) return;
    setFitted(false);
    const timers = [
      window.setTimeout(() => setJacked(true), D * 1000 * 0.26),
      window.setTimeout(() => setFitted(true), D * 1000 * 0.56),
      window.setTimeout(() => setJacked(false), D * 1000 * 0.7),
    ];
    return () => timers.forEach(window.clearTimeout);
  }, [play]);

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Replay pit stop"
      onClick={() => setPlay((p) => p + 1)}
      className="relative cursor-pointer overflow-hidden rounded-2xl border border-white/10"
    >
      <svg viewBox="0 0 320 200" className="block w-full" aria-hidden>
        {/* apron + garage */}
        <rect x={0} y={0} width={320} height={200} fill="#0A0A0C" />
        <rect x={0} y={0} width={320} height={44} fill="#101013" />
        <rect x={24} y={8} width={272} height={36} rx={3} fill="#060607" />
        <rect x={0} y={0} width={320} height={5} fill="var(--livery)" opacity={0.85} />
        <text
          x={160}
          y={30}
          textAnchor="middle"
          fontSize={11}
          fontWeight={800}
          letterSpacing={5}
          fill="rgba(255,255,255,0.22)"
        >
          JW RACING
        </text>
        {/* spare tyres stacked in the garage */}
        <circle cx={42} cy={30} r={8} fill="#141417" stroke="#2C2C31" strokeWidth={2} />
        <circle cx={42} cy={18} r={8} fill="#141417" stroke={compound.color} strokeWidth={2} />
        <circle cx={278} cy={30} r={8} fill="#141417" stroke="#2C2C31" strokeWidth={2} />

        {/* painted pit box */}
        <path
          d="M 96 64 L 96 172 M 224 64 L 224 172 M 96 172 L 224 172"
          stroke="rgba(255,255,255,0.22)"
          strokeWidth={2.5}
        />
        {/* pit lane fast lane at the bottom */}
        <line
          x1={0}
          y1={190}
          x2={320}
          y2={190}
          stroke="rgba(255,255,255,0.14)"
          strokeWidth={2}
          strokeDasharray="10 8"
        />

        {/* the car: in from the lane, stop on the marks, launch out */}
        {play > 0 && (
          <motion.g
            key={`car-${play}`}
            initial={{ x: -170, y: CAR.y }}
            animate={{ x: [-170, CAR.x, CAR.x, CAR.x, 500], y: CAR.y }}
            transition={{
              duration: D,
              times: [0, 0.15, 0.3, 0.86, 1],
              ease: ["easeOut", "linear", "linear", "easeIn"],
            }}
          >
            <g transform="scale(3)">
              <RaceCar
                compound={fitted ? compound.color : "#52525B"}
                damagedWing={wingStop ? !fitted : false}
                jacked={jacked}
              />
            </g>
          </motion.g>
        )}

        {/* worn wheels carried to the garage, fresh ones brought out */}
        {play > 0 && (
          <g key={`wheels-${play}`}>
            {WHEELS.map((w, j) => {
              const wx = CAR.x + w.x;
              const wy = CAR.y + w.y;
              return (
                <g key={j}>
                  <motion.g
                    initial={{ x: wx, y: wy, opacity: 0 }}
                    animate={{
                      x: [wx, wx, wx, wx + 10, wx + 16],
                      y: [wy, wy, wy, wy - 42, wy - 58],
                      opacity: [0, 0, 1, 1, 0],
                    }}
                    transition={{ duration: D, times: [0, 0.3, 0.34, 0.46, 0.54] }}
                  >
                    <LooseWheel ring="#52525B" />
                  </motion.g>
                  <motion.g
                    initial={{ x: wx - 12, y: wy - 54, opacity: 0 }}
                    animate={{
                      x: [wx - 12, wx - 12, wx - 12, wx, wx],
                      y: [wy - 54, wy - 54, wy - 50, wy, wy],
                      opacity: [0, 0, 1, 1, 0],
                    }}
                    transition={{ duration: D, times: [0, 0.46, 0.5, 0.6, 0.68] }}
                  >
                    <LooseWheel ring={compound.color} />
                  </motion.g>
                  {/* wheel-gun sparks on and off */}
                  <motion.g
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 1, 0, 0, 1, 0] }}
                    transition={{ duration: D, times: [0.28, 0.33, 0.38, 0.58, 0.65, 0.72] }}
                    stroke="#FFD12E"
                    strokeWidth={1.6}
                    strokeLinecap="round"
                  >
                    <line x1={wx + 8} y1={wy - 8} x2={wx + 13} y2={wy - 14} />
                    <line x1={wx - 9} y1={wy + 7} x2={wx - 14} y2={wy + 12} />
                  </motion.g>
                </g>
              );
            })}
            {/* front wing swap at the wing stop */}
            {wingStop && (
              <>
                <motion.g
                  initial={{ x: CAR.x + 50, y: CAR.y, opacity: 0, rotate: -14 }}
                  animate={{
                    x: [CAR.x + 50, CAR.x + 50, CAR.x + 62, CAR.x + 74],
                    y: [CAR.y, CAR.y, CAR.y - 44, CAR.y - 60],
                    opacity: [0, 0, 1, 0],
                    rotate: [-14, -14, -30, -50],
                  }}
                  transition={{ duration: D, times: [0, 0.32, 0.46, 0.54] }}
                >
                  <rect x={-3.5} y={-26} width={7} height={52} rx={3} fill="#55555C" />
                </motion.g>
                <motion.g
                  initial={{ x: CAR.x + 38, y: CAR.y - 56, opacity: 0 }}
                  animate={{
                    x: [CAR.x + 38, CAR.x + 38, CAR.x + 44, CAR.x + 50],
                    y: [CAR.y - 56, CAR.y - 56, CAR.y - 30, CAR.y],
                    opacity: [0, 0, 1, 0],
                  }}
                  transition={{ duration: D, times: [0, 0.46, 0.54, 0.64] }}
                >
                  <rect x={-3.5} y={-26} width={7} height={52} rx={3} fill="var(--livery)" />
                </motion.g>
              </>
            )}
            {/* launch */}
            <motion.g
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0, 0.7, 0] }}
              transition={{ duration: D, times: [0, 0.88, 0.93, 1] }}
              stroke="rgba(255,255,255,0.5)"
              strokeWidth={2}
              strokeLinecap="round"
            >
              <line x1={56} y1={110} x2={118} y2={110} />
              <line x1={42} y1={120} x2={110} y2={120} />
              <line x1={60} y1={130} x2={122} y2={130} />
            </motion.g>
          </g>
        )}

        {/* the crew, in front of the garage */}
        {CREW.map((member, j) => (
          <CrewMember key={j} home={member.home} work={member.work} play={play} />
        ))}
      </svg>

      {/* HUD */}
      <div className="pointer-events-none absolute left-3 top-2.5 font-mono text-[10px] uppercase tracking-widest text-white/50">
        Box P{box} ·{" "}
        <span style={{ color: compound.color }}>{compound.name}</span>
        {wingStop && <span className="text-white/55"> + wing</span>}
      </div>
      <div className="pointer-events-none absolute bottom-2 right-3">
        {play > 0 && (
          <motion.p
            key={`time-${play}`}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: D * 0.88, duration: 0.25 }}
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
        transition={{ duration: D, times: [0, 0.82, 0.86] }}
      />
      <span className="pointer-events-none absolute bottom-2 left-3 font-mono text-[9px] uppercase tracking-widest text-white/30">
        tap to replay
      </span>
    </div>
  );
};
