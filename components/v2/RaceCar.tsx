interface RaceCarProps {
  // skews and greys the front wing until the pit crew fits a fresh one
  damagedWing?: boolean;
  // tyre sidewall colour (Pirelli compound); undefined leaves plain rubber
  compound?: string;
  // up on the jacks: wheels spread away from the floor mid-stop
  jacked?: boolean;
}

const WHEELS = [
  { x: -15, y: -11, w: 8, side: -1 },
  { x: -15, y: 5.5, w: 8, side: 1 },
  { x: 6, y: -10.5, w: 7, side: -1 },
  { x: 6, y: 5, w: 7, side: 1 },
];

// Top-down F1 car, drawn pointing +x and centred on the origin so it can be
// rotated to the track tangent. Painted with the livery CSS variable.
export const RaceCar = ({
  damagedWing = false,
  compound,
  jacked = false,
}: RaceCarProps) => (
  <g style={{ filter: "drop-shadow(0 1.5px 2.5px rgba(0,0,0,0.6))" }}>
    {/* rear wing */}
    <rect x={-19} y={-8} width={3.6} height={16} rx={1.2} fill="#1C1C1F" />
    <rect x={-19} y={-8} width={1.4} height={16} rx={0.7} fill="var(--livery)" opacity={0.9} />
    {/* wheels */}
    {WHEELS.map((wheel, i) => (
      <g
        key={i}
        transform={jacked ? `translate(0 ${wheel.side * 1.8})` : undefined}
      >
        <rect
          x={wheel.x}
          y={wheel.y}
          width={wheel.w}
          height={5.5}
          rx={2}
          fill="#141416"
          stroke={compound}
          strokeWidth={compound ? 1.5 : 0}
        />
        <rect
          x={wheel.x + 1.5}
          y={wheel.y + 1.6}
          width={wheel.w - 3}
          height={2.3}
          rx={1.1}
          fill="#2E2E33"
        />
      </g>
    ))}
    {/* floor */}
    <rect x={-16} y={-7} width={24} height={14} rx={4} fill="#101014" />
    {/* monocoque + sidepods */}
    <path
      d="M 19 0
         Q 17.5 -2.4 12 -2.8 L 5 -3.2 Q 3.5 -6.5 -1 -6.8 L -8 -6.4
         Q -12 -5.8 -15 -2.8 L -16.5 -2.4 L -16.5 2.4 L -15 2.8
         Q -12 5.8 -8 6.4 L -1 6.8 Q 3.5 6.5 5 3.2 L 12 2.8
         Q 17.5 2.4 19 0 Z"
      fill="var(--livery)"
    />
    {/* spine highlight */}
    <rect x={-14} y={-0.9} width={30} height={1.8} rx={0.9} fill="#FFFFFF" opacity={0.22} />
    {/* front wing */}
    <g
      transform={damagedWing ? "rotate(-14 16.5 0)" : undefined}
      opacity={damagedWing ? 0.65 : 1}
    >
      <rect x={14.5} y={-9.5} width={4} height={19} rx={1.4} fill="#1C1C1F" />
      <rect
        x={16.8}
        y={-9.5}
        width={1.7}
        height={19}
        rx={0.85}
        fill={damagedWing ? "#55555C" : "var(--livery)"}
        opacity={0.9}
      />
    </g>
    {/* cockpit, halo, helmet */}
    <rect x={-2.5} y={-2.1} width={7} height={4.2} rx={2} fill="#0C0C0E" />
    <circle cx={3} cy={0} r={2.7} fill="none" stroke="#3D3D44" strokeWidth={1.1} />
    <circle cx={0.6} cy={0} r={1.5} fill="#E8E8EC" />
  </g>
);
