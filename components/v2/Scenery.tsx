// Apple-Maps-at-night scenery: slate-blue extruded buildings, warm lit
// window grids, teal Yas Marina accents at the tunnel.

const ROOF = "#363A54";
const SIDE = "#252840";
const SHADOW = "#12131F";
const EDGE = "rgba(255,255,255,0.12)";
const WINDOW = "#FFD98A";
export const YAS_TEAL = "#27C4D6";

export const Box3D = ({
  x,
  y,
  w,
  h,
  d = 5,
  roof = ROOF,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  d?: number;
  roof?: string;
}) => (
  <g>
    <polygon
      points={`${x},${y + h} ${x + d},${y + h + d} ${x + w + d},${y + h + d} ${
        x + w
      },${y + h}`}
      fill={SHADOW}
    />
    <polygon
      points={`${x + w},${y} ${x + w + d},${y + d} ${x + w + d},${y + h + d} ${
        x + w
      },${y + h}`}
      fill={SIDE}
    />
    <rect x={x} y={y} width={w} height={h} fill={roof} stroke={EDGE} strokeWidth={0.8} />
  </g>
);

// a deterministic grid of mostly-lit windows
export const Windows = ({
  x,
  y,
  cols,
  rows,
  pitchX = 4,
  pitchY = 4.6,
}: {
  x: number;
  y: number;
  cols: number;
  rows: number;
  pitchX?: number;
  pitchY?: number;
}) => (
  <g fill={WINDOW}>
    {Array.from({ length: cols * rows }).map((_, i) => {
      const c = i % cols;
      const r = Math.floor(i / cols);
      const tone = (c * 7 + r * 5 + 3) % 9;
      if (tone < 2) return null;
      return (
        <rect
          key={i}
          x={x + c * pitchX}
          y={y + r * pitchY}
          width={1.8}
          height={2.3}
          rx={0.4}
          opacity={tone > 6 ? 0.85 : 0.4}
        />
      );
    })}
  </g>
);

// three purple-lit towers with the surfboard skypark
export const MarinaBaySands = ({ x, y }: { x: number; y: number }) => (
  <g>
    {[0, 13, 26].map((dx) => (
      <g key={dx}>
        <Box3D x={x + dx} y={y} w={10} h={26} roof="#454166" />
        <Windows x={x + dx + 1.6} y={y + 2.5} cols={2} rows={5} pitchX={4.2} />
      </g>
    ))}
    {/* skypark deck with the prow overhang */}
    <path
      d={`M ${x - 8} ${y - 3.5}
          Q ${x - 8} ${y - 8} ${x - 2} ${y - 8}
          L ${x + 38} ${y - 8} Q ${x + 43} ${y - 8} ${x + 43} ${y - 3.5}
          Q ${x + 43} ${y + 1} ${x + 38} ${y + 1}
          L ${x - 2} ${y + 1} Q ${x - 8} ${y + 1} ${x - 8} ${y - 3.5} Z`}
      fill="#3E3A5E"
      stroke={EDGE}
      strokeWidth={0.8}
    />
    {[0, 1, 2, 3, 4, 5, 6].map((i) => (
      <circle
        key={i}
        cx={x - 4 + i * 7.5}
        cy={y - 3.5}
        r={0.9}
        fill={WINDOW}
        opacity={i % 2 === 0 ? 0.8 : 0.45}
      />
    ))}
  </g>
);

// Casino de Monte-Carlo: symmetric palace, dome, gold glazing
export const Casino = ({ x, y }: { x: number; y: number }) => (
  <g>
    <Box3D x={x - 2} y={y + 8} w={10} h={14} roof="#31354D" />
    <Box3D x={x + 28} y={y + 8} w={10} h={14} roof="#31354D" />
    <Box3D x={x + 6} y={y + 4} w={24} h={18} />
    <circle cx={x + 18} cy={y + 9} r={4} fill="#454166" stroke={EDGE} strokeWidth={0.8} />
    <circle cx={x + 18} cy={y + 9} r={1.2} fill={WINDOW} opacity={0.9} />
    <Windows x={x + 9} y={y + 15} cols={5} rows={1} pitchX={4} />
    {/* forecourt */}
    <path
      d={`M ${x + 8} ${y + 24} h 20 M ${x + 10} ${y + 27} h 16`}
      stroke="rgba(255,255,255,0.14)"
      strokeWidth={1}
    />
  </g>
);

export const Trees = ({ x, y }: { x: number; y: number }) => (
  <g>
    {[
      { dx: 0, dy: 0, r: 7 },
      { dx: 12, dy: 8, r: 6 },
      { dx: 4, dy: 17, r: 5.5 },
      { dx: 16, dy: -6, r: 5 },
      { dx: 22, dy: 4, r: 6.5 },
      { dx: 26, dy: 14, r: 5 },
    ].map((t, i) => (
      <g key={i}>
        <circle cx={x + t.dx + 1.5} cy={y + t.dy + 2} r={t.r} fill="#0A1410" />
        <circle cx={x + t.dx} cy={y + t.dy} r={t.r} fill="#16301C" />
        <circle
          cx={x + t.dx - t.r * 0.3}
          cy={y + t.dy - t.r * 0.3}
          r={t.r * 0.45}
          fill="#1F4427"
        />
      </g>
    ))}
  </g>
);

const CROWD = ["#E8C15A", "#7FB2E5", "#E57F7F", "#9FE5A0", "#C9A2E0"];

export const Grandstand = ({ x, y }: { x: number; y: number }) => (
  <g>
    <Box3D x={x} y={y} w={40} h={13} roof="#2C2F47" />
    {[0, 1, 2, 3, 4].map((i) => (
      <rect
        key={i}
        x={x + 2 + i * 7.6}
        y={y + 1.5}
        width={4}
        height={6}
        rx={1}
        fill={i % 2 === 0 ? "var(--livery)" : "#454A6B"}
        opacity={0.8}
      />
    ))}
    {/* the crowd along the open side */}
    {Array.from({ length: 14 }).map((_, i) => (
      <circle
        key={i}
        cx={x + 3 + i * 2.7}
        cy={y + 10.5}
        r={0.9}
        fill={CROWD[i % CROWD.length]}
        opacity={0.85}
      />
    ))}
  </g>
);

// thin-spoked observation wheel with lit pods and a terraced base
export const FerrisWheel = ({ x, y }: { x: number; y: number }) => (
  <g>
    <ellipse cx={x} cy={y + 19} rx={11} ry={4.5} fill="#2C2F47" stroke={EDGE} strokeWidth={0.8} />
    <ellipse cx={x} cy={y + 16.5} rx={8} ry={3.5} fill={ROOF} stroke={EDGE} strokeWidth={0.8} />
    {[-6, -2, 2, 6].map((dx) => (
      <circle key={dx} cx={x + dx} cy={y + 18.5} r={0.8} fill={WINDOW} opacity={0.7} />
    ))}
    <line x1={x} y1={y} x2={x - 6} y2={y + 16} stroke="#3E4565" strokeWidth={2} />
    <line x1={x} y1={y} x2={x + 6} y2={y + 16} stroke="#3E4565" strokeWidth={2} />
    <circle cx={x} cy={y} r={14.5} fill="none" stroke="#8FA3C8" strokeWidth={1.1} opacity={0.9} />
    <circle cx={x} cy={y} r={12.3} fill="none" stroke="#8FA3C8" strokeWidth={0.6} opacity={0.6} />
    {Array.from({ length: 12 }).map((_, i) => {
      const a = (i * 30 * Math.PI) / 180;
      return (
        <line
          key={i}
          x1={x}
          y1={y}
          x2={x + 14.5 * Math.cos(a)}
          y2={y + 14.5 * Math.sin(a)}
          stroke="#5C6A8F"
          strokeWidth={0.5}
          opacity={0.8}
        />
      );
    })}
    {Array.from({ length: 12 }).map((_, i) => {
      const a = ((i * 30 + 15) * Math.PI) / 180;
      return (
        <circle
          key={i}
          cx={x + 14.5 * Math.cos(a)}
          cy={y + 14.5 * Math.sin(a)}
          r={1.3}
          fill={WINDOW}
          opacity={0.8}
        />
      );
    })}
    <circle cx={x} cy={y} r={1.8} fill="var(--livery)" />
  </g>
);

// a slice of night skyline
export const TwinTowers = ({ x, y }: { x: number; y: number }) => (
  <g>
    <Box3D x={x} y={y + 2} w={12} h={20} />
    <Windows x={x + 1.8} y={y + 4.5} cols={2} rows={4} pitchX={4.4} />
    <Box3D x={x + 17} y={y + 10} w={14} h={14} roof="#2E314A" />
    <Windows x={x + 19} y={y + 12.5} cols={3} rows={2} pitchX={4} />
    <Box3D x={x + 8} y={y - 6} w={7} h={9} roof="#41456A" />
    <circle cx={x + 11.5} cy={y - 8} r={0.9} fill="#E25555" opacity={0.9} />
  </g>
);

// street-circuit furniture: concrete walls with catch fencing on top
export const StreetWalls = ({
  x,
  y,
  span = 44,
}: {
  x: number;
  y: number;
  span?: number;
}) => (
  <g>
    {[-12.5, 12.5].map((dx) => (
      <g key={dx}>
        <line
          x1={x + dx}
          y1={y - span}
          x2={x + dx}
          y2={y + span}
          stroke="rgba(205,210,225,0.32)"
          strokeWidth={2.2}
        />
        <line
          x1={x + dx}
          y1={y - span}
          x2={x + dx}
          y2={y + span}
          stroke="rgba(205,210,225,0.6)"
          strokeWidth={3.6}
          strokeDasharray="1.2 6.4"
        />
        <line
          x1={x + dx}
          y1={y - span}
          x2={x + dx}
          y2={y + span}
          stroke="rgba(150,160,185,0.35)"
          strokeWidth={0.7}
        />
      </g>
    ))}
  </g>
);

// Yas Marina-style underpass: teal LED lintel and gridshell canopy,
// retaining walls converging into the dark.
export const TunnelPortal = ({
  x,
  mouthY,
  dir,
  id,
}: {
  x: number;
  mouthY: number;
  dir: "in" | "out";
  id: string;
}) => {
  const s = dir === "in" ? 1 : -1; // ramp approaches from -s side
  return (
    <g>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          {dir === "in" ? (
            <>
              <stop offset="0%" stopColor="#050505" stopOpacity="0" />
              <stop offset="70%" stopColor="#050505" stopOpacity="1" />
            </>
          ) : (
            <>
              <stop offset="30%" stopColor="#050505" stopOpacity="1" />
              <stop offset="100%" stopColor="#050505" stopOpacity="0" />
            </>
          )}
        </linearGradient>
      </defs>
      {/* teal-painted run-off edges on the approach */}
      {[-8, 8].map((dx) => (
        <line
          key={dx}
          x1={x + dx}
          y1={mouthY - s * 58}
          x2={x + dx}
          y2={mouthY - s * 16}
          stroke={YAS_TEAL}
          strokeWidth={2}
          opacity={0.4}
        />
      ))}
      {/* retaining walls converging into the mouth */}
      {[-1, 1].map((side) => (
        <line
          key={side}
          x1={x + side * 10.5}
          y1={mouthY - s * 30}
          x2={x + side * 8}
          y2={mouthY}
          stroke="rgba(205,210,225,0.4)"
          strokeWidth={1.6}
        />
      ))}
      {/* the descent into darkness */}
      <rect
        x={x - 14}
        y={dir === "in" ? mouthY - 50 : mouthY}
        width={28}
        height={50}
        fill={`url(#${id})`}
      />
      <rect
        x={x - 9}
        y={dir === "in" ? mouthY - 8 : mouthY}
        width={18}
        height={8}
        rx={1.5}
        fill="#020203"
      />
      {/* chevrons on the ramp */}
      <path
        d={`M ${x - 4} ${mouthY - s * 36} l 4 ${s * 5} l 4 ${-s * 5}`}
        stroke="rgba(255,255,255,0.4)"
        strokeWidth={1.5}
        fill="none"
      />
      <path
        d={`M ${x - 4} ${mouthY - s * 24} l 4 ${s * 5} l 4 ${-s * 5}`}
        stroke="rgba(255,255,255,0.25)"
        strokeWidth={1.5}
        fill="none"
      />
      {/* lintel with the teal LED strip */}
      <rect
        x={x - 17}
        y={mouthY - s * 4 - 3}
        width={34}
        height={6}
        rx={3}
        fill="#2A2D3E"
        stroke={EDGE}
        strokeWidth={0.8}
      />
      <rect
        x={x - 15}
        y={mouthY - s * 4 - 1}
        width={30}
        height={2}
        rx={1}
        fill={YAS_TEAL}
        style={{ filter: `drop-shadow(0 0 4px ${YAS_TEAL})` }}
        opacity={0.95}
      />
      {/* gridshell canopy arcs spanning the approach */}
      <path
        d={`M ${x - 20} ${mouthY - s * 6} Q ${x} ${mouthY - s * 20} ${x + 20} ${
          mouthY - s * 6
        }`}
        stroke={YAS_TEAL}
        strokeWidth={1.2}
        fill="none"
        opacity={0.45}
      />
      <path
        d={`M ${x - 25} ${mouthY - s * 2} Q ${x} ${mouthY - s * 18} ${x + 25} ${
          mouthY - s * 2
        }`}
        stroke={YAS_TEAL}
        strokeWidth={0.8}
        fill="none"
        opacity={0.25}
      />
    </g>
  );
};

// cute little crew member, top-down
export const CrewDot = () => (
  <g>
    <ellipse rx={5} ry={3.6} fill="var(--livery)" opacity={0.95} />
    <circle r={2.3} fill="#E8E8EC" />
  </g>
);
