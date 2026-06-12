import { motion } from "framer-motion";

import { RaceCar } from "./RaceCar";

export interface Compound {
  name: string;
  letter: string;
  color: string;
  time: string;
}

const CAR = { x: 160, y: 70 };

// cute little crew: gunners crouched at each wheel, jack operators at
// nose and tail, lollipop up by the wall
const CREW = [
  { x: -23, y: -28 },
  { x: 23, y: -28 },
  { x: -23, y: 28 },
  { x: 23, y: 28 },
  { x: -54, y: 0 },
  { x: 54, y: 0 },
];

const SPARKS = [
  { x: -23, y: -18 },
  { x: 23, y: -18 },
  { x: -23, y: 18 },
  { x: 23, y: 18 },
];

const Crew = ({ working }: { working: boolean }) => (
  <motion.g
    animate={working ? { y: [0, -2, 0] } : { y: [0, -0.8, 0] }}
    transition={{
      duration: working ? 0.4 : 1.6,
      repeat: Infinity,
      ease: "easeInOut",
    }}
  >
    <ellipse rx={5.5} ry={4} fill="var(--livery)" opacity={0.95} />
    <circle r={2.5} fill="#E8E8EC" />
  </motion.g>
);

interface PitBoxProps {
  box: number;
  compound: Compound;
  fitted: boolean;
  active: boolean;
}

// A faithful little top-down pit box: garage wall up top, painted box
// markings, the car on its marks and a cute crew around it. Quietly idles
// until the lane car arrives, then everyone gets to work and the fresh
// compound goes on.
export const PitBox = ({ box, compound, fitted, active }: PitBoxProps) => (
  <div className="relative overflow-hidden rounded-2xl border border-white/10">
    <svg viewBox="0 0 320 124" className="block w-full" aria-hidden>
      <rect x={0} y={0} width={320} height={124} fill="#0A0A0C" />
      {/* garage wall */}
      <rect x={0} y={0} width={320} height={17} fill="#101013" />
      <rect x={0} y={0} width={320} height={3.5} fill="var(--livery)" opacity={0.85} />
      <text
        x={12}
        y={12.5}
        fontSize={7.5}
        fontWeight={700}
        letterSpacing={2}
        className="font-mono"
        fill="rgba(255,255,255,0.4)"
      >
        BOX P{box}
      </text>
      {/* next set waiting in the garage */}
      <circle cx={297} cy={8.5} r={6} fill="#141417" stroke={compound.color} strokeWidth={2} />

      {/* painted box markings */}
      <path
        d="M 78 32 L 78 112 M 242 32 L 242 112 M 78 112 L 242 112"
        stroke="rgba(255,255,255,0.2)"
        strokeWidth={2}
      />

      {/* the car on its marks */}
      <g transform={`translate(${CAR.x} ${CAR.y}) scale(2.2)`}>
        <RaceCar
          compound={fitted ? compound.color : "#52525B"}
          jacked={active}
        />
      </g>

      {/* wheel-gun sparks while the crew work */}
      {active &&
        SPARKS.map((s, j) => (
          <motion.g
            key={j}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{
              duration: 0.5,
              repeat: Infinity,
              delay: j * 0.12,
            }}
            stroke="#FFD12E"
            strokeWidth={1.6}
            strokeLinecap="round"
          >
            <line
              x1={CAR.x + s.x + 5}
              y1={CAR.y + s.y}
              x2={CAR.x + s.x + 10}
              y2={CAR.y + s.y - 6}
            />
            <line
              x1={CAR.x + s.x - 5}
              y1={CAR.y + s.y + 2}
              x2={CAR.x + s.x - 10}
              y2={CAR.y + s.y + 7}
            />
          </motion.g>
        ))}

      {/* the crew */}
      {CREW.map((member, j) => (
        <g key={j} transform={`translate(${CAR.x + member.x} ${CAR.y + member.y})`}>
          <Crew working={active} />
        </g>
      ))}
    </svg>
  </div>
);
