import { motion, useMotionTemplate, useMotionValue } from "framer-motion";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

import { organisationToLogo } from "@/constants/logos";
import { Skills } from "@/constants/technologies";
import { experience } from "@/data/experience";
import { getSvgrFromSkill } from "@/utils/skillUtils";

import { RaceCar } from "./RaceCar";

const RAIL_WIDTH = 80;
const LEFT_X = 18;
const RIGHT_X = 62;
const CORNER_RADIUS = 14;
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

// A single line that runs vertically through each corner, jogging sideways
// midway between consecutive corners so it reads as a circuit, not a timeline.
const buildTrack = (corners: Corner[], height: number) => {
  let d = `M ${corners[0].x} 0`;
  for (let i = 0; i < corners.length - 1; i++) {
    const a = corners[i];
    const b = corners[i + 1];
    if (a.x === b.x) continue;
    const mid = (a.y + b.y) / 2;
    const dir = b.x > a.x ? 1 : -1;
    d += ` L ${a.x} ${mid - CORNER_RADIUS}`;
    d += ` Q ${a.x} ${mid} ${a.x + dir * CORNER_RADIUS} ${mid}`;
    d += ` L ${b.x - dir * CORNER_RADIUS} ${mid}`;
    d += ` Q ${b.x} ${mid} ${b.x} ${mid + CORNER_RADIUS}`;
  }
  d += ` L ${corners[corners.length - 1].x} ${height}`;
  return d;
};

const TechChip = ({ skill }: { skill: Skills }) => {
  const Svgr = getSvgrFromSkill(skill);
  return (
    <span className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 py-1 pl-1.5 pr-2.5 text-[11px] text-white/70">
      <span className="flex h-4 w-4 items-center justify-center [&_svg]:h-full [&_svg]:w-full">
        <Svgr />
      </span>
      {skill}
    </span>
  );
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

  const [track, setTrack] = useState<Track>();
  const [trackLength, setTrackLength] = useState(0);
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

  useEffect(() => {
    const path = pathRef.current;
    if (!path || !track) return;
    const total = path.getTotalLength();
    setTrackLength(total);
    dashOffset.set(total);
  }, [track, dashOffset]);

  // The car sits wherever the track crosses the vertical middle of the
  // viewport, so it always drives alongside whatever you're reading. The
  // track's y is monotonic, so the arc length at a given y can be found by
  // binary search.
  useEffect(() => {
    const path = pathRef.current;
    const list = listRef.current;
    if (!path || !list || !track || !trackLength) return;

    const lengthAtY = (y: number) => {
      let lo = 0;
      let hi = trackLength;
      for (let i = 0; i < 22; i++) {
        const mid = (lo + hi) / 2;
        if (path.getPointAtLength(mid).y < y) lo = mid;
        else hi = mid;
      }
      return lo;
    };

    const update = () => {
      const rect = list.getBoundingClientRect();
      const centerY = window.innerHeight / 2 - rect.top;
      const targetY = Math.min(Math.max(centerY, 0), track.height);
      const at =
        targetY <= 0
          ? 0
          : targetY >= track.height
          ? trackLength
          : lengthAtY(targetY);
      const point = path.getPointAtLength(at);
      const ahead = path.getPointAtLength(Math.min(at + 1, trackLength));
      const behind = path.getPointAtLength(Math.max(at - 1, 0));
      carX.set(point.x);
      carY.set(point.y);
      carAngle.set(
        (Math.atan2(ahead.y - behind.y, ahead.x - behind.x) * 180) / Math.PI
      );
      dashOffset.set(trackLength - at);
      setPassed(track.corners.filter((c) => c.y <= targetY).length);
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [track, trackLength, carX, carY, carAngle, dashOffset]);

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
          {items.length} corners. Scroll to follow the racing line.
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
            />
            {/* racing line driven so far */}
            {trackLength > 0 && (
              <motion.path
                d={track.d}
                stroke="var(--livery)"
                strokeWidth={6}
                strokeLinecap="round"
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

        <ol ref={listRef} className="relative space-y-12 pl-24">
          {items.map((item, i) => (
            <motion.li
              key={`${item.organisation}-${item.start}`}
              ref={(el) => {
                itemRefs.current[i] = el;
              }}
              initial={{ opacity: 0, x: 24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, ease: [0.21, 0.6, 0.35, 1] }}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-widest text-white/40">
                    T{i + 1} · {item.start} — {item.end}
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
          ))}
        </ol>
      </div>
    </section>
  );
};
