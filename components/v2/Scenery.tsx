// Apple-Maps-style 2.5D scenery: flat roofs extruded down-right, muted
// night-city palette, the odd lit window.

const ROOF = "#26262D";
const SIDE = "#15151A";
const SHADOW = "#0B0B0E";
const EDGE = "rgba(255,255,255,0.09)";
const WINDOW = "#FFD98A";

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

export const MarinaBaySands = ({ x, y }: { x: number; y: number }) => (
  <g>
    <Box3D x={x} y={y} w={10} h={24} />
    <Box3D x={x + 13} y={y} w={10} h={24} />
    <Box3D x={x + 26} y={y} w={10} h={24} />
    {/* skypark deck */}
    <rect x={x - 3} y={y - 7} width={44} height={7} rx={3.5} fill="#2F2F37" stroke={EDGE} strokeWidth={0.8} />
    <circle cx={x + 4} cy={y - 3.5} r={1.2} fill={WINDOW} opacity={0.8} />
    <circle cx={x + 33} cy={y - 3.5} r={1.2} fill={WINDOW} opacity={0.6} />
    <rect x={x + 2} y={y + 6} width={2} height={3} fill={WINDOW} opacity={0.5} />
    <rect x={x + 16} y={y + 12} width={2} height={3} fill={WINDOW} opacity={0.4} />
    <rect x={x + 30} y={y + 9} width={2} height={3} fill={WINDOW} opacity={0.5} />
  </g>
);

export const Casino = ({ x, y }: { x: number; y: number }) => (
  <g>
    <Box3D x={x} y={y + 6} w={34} h={18} />
    <Box3D x={x + 8} y={y} w={18} h={8} roof="#2C2C34" />
    <circle cx={x + 17} cy={y + 4} r={3.2} fill="#34343D" stroke={EDGE} strokeWidth={0.8} />
    <rect x={x + 4} y={y + 11} width={2.5} height={4} fill={WINDOW} opacity={0.7} />
    <rect x={x + 15.5} y={y + 11} width={2.5} height={4} fill={WINDOW} opacity={0.6} />
    <rect x={x + 27} y={y + 11} width={2.5} height={4} fill={WINDOW} opacity={0.7} />
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
    ].map((t, i) => (
      <g key={i}>
        <circle cx={x + t.dx + 1.5} cy={y + t.dy + 2} r={t.r} fill="#08130A" />
        <circle cx={x + t.dx} cy={y + t.dy} r={t.r} fill="#1C3A20" />
        <circle cx={x + t.dx - t.r * 0.3} cy={y + t.dy - t.r * 0.3} r={t.r * 0.45} fill="#27512C" />
      </g>
    ))}
  </g>
);

export const Grandstand = ({ x, y }: { x: number; y: number }) => (
  <g>
    <Box3D x={x} y={y} w={40} h={12} roof="#202026" />
    {[0, 1, 2, 3, 4].map((i) => (
      <rect
        key={i}
        x={x + 2 + i * 7.6}
        y={y + 1.5}
        width={4}
        height={9}
        fill={i % 2 === 0 ? "var(--livery)" : "#3A3A42"}
        opacity={0.75}
      />
    ))}
  </g>
);

export const FerrisWheel = ({ x, y }: { x: number; y: number }) => (
  <g>
    <line x1={x} y1={y + 2} x2={x - 7} y2={y + 17} stroke="#2C2C33" strokeWidth={2.5} />
    <line x1={x} y1={y + 2} x2={x + 7} y2={y + 17} stroke="#2C2C33" strokeWidth={2.5} />
    <circle cx={x} cy={y} r={14} fill="none" stroke="#3A3A42" strokeWidth={2} />
    {[0, 45, 90, 135].map((deg) => (
      <line
        key={deg}
        x1={x - 14 * Math.cos((deg * Math.PI) / 180)}
        y1={y - 14 * Math.sin((deg * Math.PI) / 180)}
        x2={x + 14 * Math.cos((deg * Math.PI) / 180)}
        y2={y + 14 * Math.sin((deg * Math.PI) / 180)}
        stroke="#2C2C33"
        strokeWidth={1.2}
      />
    ))}
    <circle cx={x} cy={y} r={2.5} fill="var(--livery)" />
    {[30, 90, 150, 210, 270, 330].map((deg) => (
      <circle
        key={deg}
        cx={x + 14 * Math.cos((deg * Math.PI) / 180)}
        cy={y + 14 * Math.sin((deg * Math.PI) / 180)}
        r={1.6}
        fill={WINDOW}
        opacity={0.7}
      />
    ))}
  </g>
);

export const TwinTowers = ({ x, y }: { x: number; y: number }) => (
  <g>
    <Box3D x={x} y={y} w={12} h={20} />
    <Box3D x={x + 18} y={y + 8} w={14} h={16} roof="#22222A" />
    <rect x={x + 3} y={y + 4} width={2.5} height={3.5} fill={WINDOW} opacity={0.6} />
    <rect x={x + 7} y={y + 12} width={2.5} height={3.5} fill={WINDOW} opacity={0.45} />
    <rect x={x + 22} y={y + 13} width={2.5} height={3.5} fill={WINDOW} opacity={0.6} />
  </g>
);

// cute little crew member, top-down
export const CrewDot = () => (
  <g>
    <ellipse rx={5} ry={3.6} fill="var(--livery)" opacity={0.95} />
    <circle r={2.3} fill="#E8E8EC" />
  </g>
);
