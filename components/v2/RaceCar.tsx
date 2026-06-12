// Top-down F1 car, drawn pointing +x and centred on the origin so it can be
// rotated to the track tangent. Painted with the livery CSS variable.
// `damagedWing` skews and greys the front wing until the pit crew fits a
// fresh one.
export const RaceCar = ({ damagedWing = false }: { damagedWing?: boolean }) => (
  <g style={{ filter: "drop-shadow(0 1.5px 2.5px rgba(0,0,0,0.6))" }}>
    {/* rear wing */}
    <rect x={-19} y={-8} width={3.6} height={16} rx={1.2} fill="#1C1C1F" />
    <rect x={-19} y={-8} width={1.4} height={16} rx={0.7} fill="var(--livery)" opacity={0.9} />
    {/* wheels */}
    <rect x={-15} y={-11} width={8} height={5.5} rx={2} fill="#141416" />
    <rect x={-15} y={5.5} width={8} height={5.5} rx={2} fill="#141416" />
    <rect x={6} y={-10.5} width={7} height={5.5} rx={2} fill="#141416" />
    <rect x={6} y={5} width={7} height={5.5} rx={2} fill="#141416" />
    <rect x={-13.4} y={-9.4} width={4.8} height={2.3} rx={1.1} fill="#2E2E33" />
    <rect x={-13.4} y={7.1} width={4.8} height={2.3} rx={1.1} fill="#2E2E33" />
    <rect x={7.3} y={-8.9} width={4.4} height={2.3} rx={1.1} fill="#2E2E33" />
    <rect x={7.3} y={6.6} width={4.4} height={2.3} rx={1.1} fill="#2E2E33" />
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
