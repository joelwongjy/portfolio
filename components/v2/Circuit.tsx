import { motion, useMotionTemplate, useMotionValue } from "framer-motion";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

import { organisationToLogo } from "@/constants/logos";
import { experience } from "@/data/experience";

import { RaceCar } from "./RaceCar";
import { RaceState, useRace } from "./RaceContext";
import { TechChip } from "./TechChip";

const RAIL_WIDTH = 120;
const LEFT_X = 24;
const RIGHT_X = 96;
const MARKER_OFFSET = 28;

interface Corner {
  x: number;
  y: number;
}

interface Track {
  d: string;
  height: number;
  corners: Corner[];
}

// Each gap between two jobs is a corner complex traced from a real circuit:
// the waypoints encode the genuine turn sequence, directions and relative
// radii, rotated so the complex enters and exits vertically. The rounding
// pass below turns the waypoint chain into tangent arcs — a racing line
// never changes direction discontinuously.
type Motif = (xa: number, ya: number, xb: number, yb: number) => string;

interface Waypoint {
  x: number;
  y: number;
  r?: number;
}

// Replace every interior waypoint with a circular arc of its radius,
// trimming the adjoining straights to the tangent points.
const roundedPath = (pts: Waypoint[]) => {
  let d = "";
  for (let i = 1; i < pts.length - 1; i++) {
    const p0 = pts[i - 1];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const in1 = { x: p1.x - p0.x, y: p1.y - p0.y };
    const in2 = { x: p2.x - p1.x, y: p2.y - p1.y };
    const l1 = Math.hypot(in1.x, in1.y);
    const l2 = Math.hypot(in2.x, in2.y);
    const v1 = { x: in1.x / l1, y: in1.y / l1 };
    const v2 = { x: in2.x / l2, y: in2.y / l2 };
    const cross = v1.x * v2.y - v1.y * v2.x;
    const dot = Math.min(Math.max(v1.x * v2.x + v1.y * v2.y, -1), 1);
    const angle = Math.acos(dot);
    if (angle < 0.03) continue;
    const r = p1.r ?? 10;
    const trim = Math.min(
      r * Math.tan(angle / 2),
      l1 / 2 - 0.5,
      l2 / 2 - 0.5
    );
    const radius = trim / Math.tan(angle / 2);
    const a = { x: p1.x - v1.x * trim, y: p1.y - v1.y * trim };
    const b = { x: p1.x + v2.x * trim, y: p1.y + v2.y * trim };
    d += ` L ${a.x.toFixed(1)} ${a.y.toFixed(1)}`;
    d += ` A ${radius.toFixed(1)} ${radius.toFixed(1)} 0 0 ${
      cross > 0 ? 1 : 0
    } ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
  }
  const last = pts[pts.length - 1];
  d += ` L ${last.x} ${last.y}`;
  return d;
};

// Canonical waypoints are written for a left anchor (x 24) flowing to a
// right anchor (x 96) and mirrored when the gap runs the other way. The
// vertical coordinate is normalised: g(0) sits just below the upper card's
// marker, g(1) just above the lower card's.
const motifFrom =
  (canonical: (g: (t: number) => number) => Waypoint[]): Motif =>
  (xa, ya, xb, yb) => {
    const dir = Math.sign(xb - xa);
    const g = (t: number) => ya + 40 + t * (yb - ya - 80);
    const pts = [
      { x: 24, y: ya },
      ...canonical(g),
      { x: 96, y: yb },
    ].map((p) => ({ ...p, x: xa + dir * (p.x - 24) }));
    return roundedPath(pts);
  };

// Mirabeau right, then the Fairmont/Loews 180 — the tightest corner in
// F1 — doubling back before dropping to Portier and the tunnel.
const loews = motifFrom((g) => [
  { x: 48, y: g(0.14), r: 16 },
  { x: 48, y: g(0.52), r: 13 },
  { x: 74, y: g(0.52), r: 13 },
  { x: 74, y: g(0.24), r: 11 },
  { x: 96, y: g(0.24), r: 11 },
]);

// Eau Rouge–Raidillon: the left-right-left compression, then the long
// vertical run that is the Kemmel straight.
const eauRouge = motifFrom((g) => [
  { x: 14, y: g(0.1), r: 12 },
  { x: 52, y: g(0.24), r: 14 },
  { x: 96, y: g(0.44), r: 26 },
]);

// Monza's Rettifilio after the long start straight: hard on the brakes,
// tight right-left, then the Curva Grande sweep.
const rettifilio = motifFrom((g) => [
  { x: 58, y: g(0.5), r: 7 },
  { x: 42, y: g(0.62), r: 7 },
  { x: 96, y: g(0.78), r: 30 },
]);

// Suzuka's 130R: one enormous-radius left taken flat, into the Casio
// Triangle flick.
const r130 = motifFrom((g) => [
  { x: 6, y: g(0.38), r: 46 },
  { x: 36, y: g(0.66), r: 34 },
  { x: 78, y: g(0.78), r: 10 },
  { x: 74, y: g(0.88), r: 6 },
  { x: 96, y: g(0.95), r: 8 },
]);

// Maggotts–Becketts–Chapel: the tightening snake onto Hangar straight.
const becketts = motifFrom((g) => [
  { x: 44, y: g(0.12), r: 20 },
  { x: 12, y: g(0.32), r: 17 },
  { x: 54, y: g(0.52), r: 14 },
  { x: 96, y: g(0.68), r: 14 },
]);

// The old Singapore Sling: the notorious left-right-left kerb hop.
const sling = motifFrom((g) => [
  { x: 50, y: g(0.42), r: 6 },
  { x: 32, y: g(0.56), r: 6 },
  { x: 60, y: g(0.68), r: 7 },
  { x: 96, y: g(0.82), r: 16 },
]);

const MOTIFS: Motif[] = [loews, eauRouge, rettifilio, r130, becketts, sling];

// Card i sits at corner CORNER_META[i]; the motif leading into card i + 1 is
// the corner complex it is named after.
export const CORNER_META = [
  { corner: "Turn 1", circuit: "Marina Bay" },
  { corner: "Loews Hairpin", circuit: "Monaco" },
  { corner: "Eau Rouge", circuit: "Spa" },
  { corner: "Rettifilio", circuit: "Monza" },
  { corner: "130R", circuit: "Suzuka" },
  { corner: "Becketts", circuit: "Silverstone" },
  { corner: "The Sling", circuit: "Marina Bay" },
];

const buildTrack = (corners: Corner[], height: number) => {
  let d = `M ${corners[0].x} 0 L ${corners[0].x} ${corners[0].y}`;
  for (let i = 0; i < corners.length - 1; i++) {
    const a = corners[i];
    const b = corners[i + 1];
    d += " " + MOTIFS[i % MOTIFS.length](a.x, a.y, b.x, b.y);
  }
  d += ` L ${corners[corners.length - 1].x} ${height}`;
  return d;
};

const OrganisationLogo = ({ organisation }: { organisation: string }) => {
  const whiteLogo = organisationToLogo[`${organisation}White`];
  const logo = organisationToLogo[organisation];
  if (whiteLogo) {
    return (
      <Image
        src={whiteLogo}
        alt={organisation}
        className="h-7 w-auto max-w-[7rem] object-contain"
      />
    );
  }
  if (logo) {
    return (
      <span className="inline-flex rounded-lg bg-white/95 px-2 py-1.5 shadow-card">
        <Image
          src={logo}
          alt={organisation}
          className="h-5 w-auto max-w-[6rem] object-contain"
        />
      </span>
    );
  }
  return (
    <span
      className="text-sm font-bold uppercase tracking-wider"
      style={{ color: "var(--livery)" }}
    >
      {organisation}
    </span>
  );
};

export const Circuit = () => {
  const listRef = useRef<HTMLOListElement>(null);
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);
  const pathRef = useRef<SVGPathElement>(null);
  const { setRace } = useRace();
  const lastRace = useRef<RaceState>({ active: false, corner: 0, progress: 0 });

  const [track, setTrack] = useState<Track>();
  const [trackLength, setTrackLength] = useState(0);
  const [anchorLengths, setAnchorLengths] = useState<number[]>([]);
  const [passed, setPassed] = useState(0);

  const carX = useMotionValue(LEFT_X);
  const carY = useMotionValue(0);
  const carAngle = useMotionValue(90);
  const carTransform = useMotionTemplate`translate(${carX}px, ${carY}px) rotate(${carAngle}deg) scale(0.92)`;
  const dashOffset = useMotionValue(0);

  const items = experience.experiences.filter((e) => e.isShown !== false);

  const measure = useCallback(() => {
    const list = listRef.current;
    if (!list) return;
    const corners = itemRefs.current
      .filter((el): el is HTMLLIElement => el !== null)
      .map((el, i) => ({
        x: i % 2 === 0 ? LEFT_X : RIGHT_X,
        y: el.offsetTop + MARKER_OFFSET,
      }));
    if (corners.length === 0) return;
    const height = list.offsetHeight;
    setTrack({ d: buildTrack(corners, height), height, corners });
  }, []);

  useEffect(() => {
    measure();
    const observer = new ResizeObserver(measure);
    if (listRef.current) observer.observe(listRef.current);
    return () => observer.disconnect();
  }, [measure]);

  // Hairpins double back on themselves, so y is not monotonic along the
  // track and arc length can't be found from y directly. Instead, sample the
  // path once to find each anchor's arc length, then interpolate between
  // anchors while scrolling — the car drives the full corner complex
  // (including the loop) between one card and the next.
  useEffect(() => {
    const path = pathRef.current;
    if (!path || !track) return;
    const total = path.getTotalLength();
    const best = track.corners.map(() => ({ d: Infinity, l: 0 }));
    const steps = 1200;
    for (let s = 0; s <= steps; s++) {
      const l = (s / steps) * total;
      const p = path.getPointAtLength(l);
      track.corners.forEach((corner, i) => {
        const d = (p.x - corner.x) ** 2 + (p.y - corner.y) ** 2;
        if (d < best[i].d) best[i] = { d, l };
      });
    }
    setTrackLength(total);
    setAnchorLengths(best.map((b) => b.l));
    dashOffset.set(total);
  }, [track, dashOffset]);

  // The car drives alongside whatever crosses the vertical middle of the
  // viewport.
  useEffect(() => {
    const path = pathRef.current;
    const list = listRef.current;
    if (!path || !list || !track || !trackLength || !anchorLengths.length)
      return;

    const ys = track.corners.map((c) => c.y);
    const last = ys.length - 1;

    const lengthAt = (targetY: number) => {
      if (targetY <= ys[0]) {
        return (targetY / ys[0]) * anchorLengths[0];
      }
      if (targetY >= ys[last]) {
        const span = track.height - ys[last];
        const t = span > 0 ? (targetY - ys[last]) / span : 1;
        return anchorLengths[last] + t * (trackLength - anchorLengths[last]);
      }
      let i = 0;
      while (i < last && ys[i + 1] < targetY) i++;
      const t = (targetY - ys[i]) / (ys[i + 1] - ys[i]);
      return anchorLengths[i] + t * (anchorLengths[i + 1] - anchorLengths[i]);
    };

    const update = () => {
      const rect = list.getBoundingClientRect();
      const centerY = window.innerHeight / 2 - rect.top;
      const targetY = Math.min(Math.max(centerY, 0), track.height);
      const at = lengthAt(targetY);
      const point = path.getPointAtLength(at);
      const ahead = path.getPointAtLength(Math.min(at + 1, trackLength));
      const behind = path.getPointAtLength(Math.max(at - 1, 0));
      carX.set(point.x);
      carY.set(point.y);
      carAngle.set(
        (Math.atan2(ahead.y - behind.y, ahead.x - behind.x) * 180) / Math.PI
      );
      dashOffset.set(trackLength - at);
      const passedCount = track.corners.filter((c) => c.y <= targetY).length;
      setPassed(passedCount);
      // feed the Dynamic Island's live activity
      const next: RaceState = {
        active: centerY > 0 && centerY < track.height,
        corner: Math.max(passedCount, 1),
        progress: Math.round((at / trackLength) * 100) / 100,
      };
      const prev = lastRace.current;
      if (
        next.active !== prev.active ||
        next.corner !== prev.corner ||
        next.progress !== prev.progress
      ) {
        lastRace.current = next;
        setRace(next);
      }
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [
    track,
    trackLength,
    anchorLengths,
    carX,
    carY,
    carAngle,
    dashOffset,
    setRace,
  ]);

  return (
    <section id="circuit" className="mx-auto max-w-2xl px-4 pb-12 pt-24 sm:px-6">
      <header className="mb-16">
        <p
          className="text-xs font-semibold uppercase tracking-[0.35em]"
          style={{ color: "var(--livery)" }}
        >
          The Circuit
        </p>
        <h2 className="mt-3 text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
          Career, lap by lap
        </h2>
        <p className="mt-4 text-white/50">
          {items.length} corners borrowed from the great circuits. Scroll to
          follow the racing line.
        </p>
      </header>

      <div className="relative">
        {track && (
          <svg
            className="absolute left-0 top-0"
            width={RAIL_WIDTH}
            height={track.height}
            viewBox={`0 0 ${RAIL_WIDTH} ${track.height}`}
            fill="none"
            aria-hidden
          >
            {/* start line */}
            {[0, 1].map((row) =>
              [0, 1, 2, 3].map((col) => (
                <rect
                  key={`${row}-${col}`}
                  x={track.corners[0].x - 8 + col * 4}
                  y={2 + row * 4}
                  width={4}
                  height={4}
                  fill={
                    (row + col) % 2 === 0
                      ? "rgba(255,255,255,0.5)"
                      : "rgba(255,255,255,0.1)"
                  }
                />
              ))
            )}
            {/* tarmac */}
            <path
              ref={pathRef}
              d={track.d}
              stroke="rgba(255,255,255,0.12)"
              strokeWidth={6}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* racing line driven so far */}
            {trackLength > 0 && (
              <motion.path
                d={track.d}
                stroke="var(--livery)"
                strokeWidth={6}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={trackLength}
                style={{
                  strokeDashoffset: dashOffset,
                  filter: "drop-shadow(0 0 6px var(--livery-glow))",
                }}
              />
            )}
            {/* corner markers */}
            {track.corners.map((corner, i) => (
              <g key={i} className="font-mono">
                <circle
                  cx={corner.x}
                  cy={corner.y}
                  r={7}
                  fill="#050505"
                  stroke={
                    i < passed ? "var(--livery)" : "rgba(255,255,255,0.25)"
                  }
                  strokeWidth={2}
                />
                <text
                  x={corner.x + (i % 2 === 0 ? 14 : -14)}
                  y={corner.y + 3}
                  textAnchor={i % 2 === 0 ? "start" : "end"}
                  fontSize={9}
                  fill={i < passed ? "var(--livery)" : "rgba(255,255,255,0.3)"}
                >
                  T{i + 1}
                </text>
              </g>
            ))}
            <text
              x={track.corners[track.corners.length - 1].x}
              y={track.height - 6}
              textAnchor="middle"
              fontSize={14}
            >
              🏁
            </text>
            {/* car */}
            {trackLength > 0 && (
              <motion.g style={{ transform: carTransform }}>
                <RaceCar />
              </motion.g>
            )}
          </svg>
        )}

        <ol ref={listRef} className="relative space-y-16 pl-[132px]">
          {items.map((item, i) => {
            const meta = CORNER_META[i % CORNER_META.length];
            return (
              <motion.li
                key={`${item.organisation}-${item.start}`}
                ref={(el) => {
                  itemRefs.current[i] = el;
                }}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, ease: [0.21, 0.6, 0.35, 1] }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-mono text-[11px] uppercase tracking-widest text-white/40">
                      T{i + 1} · {item.start} — {item.end}
                    </p>
                    <p
                      className="mt-0.5 font-mono text-[10px] uppercase tracking-widest"
                      style={{ color: "var(--livery)" }}
                    >
                      {meta.corner} · {meta.circuit}
                    </p>
                    <h3 className="mt-2 text-xl font-bold text-white">
                      {item.title}
                    </h3>
                  </div>
                  <a
                    href={item.organisationLink}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 shrink-0 transition-opacity hover:opacity-80"
                  >
                    <OrganisationLogo organisation={item.organisation} />
                  </a>
                </div>
                <p className="mt-2 text-sm text-white/50">{item.description}</p>
                <ul className="mt-3 space-y-1.5">
                  {item.points.map((point) => (
                    <li
                      key={point}
                      className="text-sm leading-relaxed text-white/75"
                    >
                      {point}
                    </li>
                  ))}
                </ul>
                {item.stacks.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {item.stacks
                      .flatMap((stack) => stack.skills)
                      .map((skill) => (
                        <TechChip key={skill} skill={skill} />
                      ))}
                  </div>
                )}
              </motion.li>
            );
          })}
        </ol>
      </div>
    </section>
  );
};
