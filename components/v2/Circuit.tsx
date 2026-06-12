import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useScroll,
} from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";

import { experience } from "@/data/experience";

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

export const Circuit = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const listRef = useRef<HTMLOListElement>(null);
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);
  const pathRef = useRef<SVGPathElement>(null);

  const [track, setTrack] = useState<Track>();
  const [trackLength, setTrackLength] = useState(0);
  const [cornerFractions, setCornerFractions] = useState<number[]>([]);
  const [passed, setPassed] = useState(0);

  const carX = useMotionValue(LEFT_X);
  const carY = useMotionValue(0);
  const carAngle = useMotionValue(90);
  const carTransform = useMotionTemplate`translate(${carX}px, ${carY}px) rotate(${carAngle}deg)`;
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
    // The track only ever moves downwards, so the y coordinate is monotonic
    // along the path and we can binary-search each corner's arc length.
    setCornerFractions(
      track.corners.map((corner) => {
        let lo = 0;
        let hi = total;
        for (let i = 0; i < 24; i++) {
          const mid = (lo + hi) / 2;
          if (path.getPointAtLength(mid).y < corner.y) lo = mid;
          else hi = mid;
        }
        return lo / total;
      })
    );
  }, [track, dashOffset]);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start 0.7", "end end"],
  });

  useEffect(() => {
    const path = pathRef.current;
    if (!path || !trackLength) return;
    const update = (progress: number) => {
      const clamped = Math.min(Math.max(progress, 0), 1);
      const at = clamped * trackLength;
      const point = path.getPointAtLength(at);
      const ahead = path.getPointAtLength(Math.min(at + 1, trackLength));
      const behind = path.getPointAtLength(Math.max(at - 1, 0));
      carX.set(point.x);
      carY.set(point.y);
      carAngle.set(
        (Math.atan2(ahead.y - behind.y, ahead.x - behind.x) * 180) / Math.PI
      );
      dashOffset.set(trackLength - at);
      setPassed(cornerFractions.filter((f) => f <= clamped).length);
    };
    update(scrollYProgress.get());
    return scrollYProgress.on("change", update);
  }, [
    trackLength,
    cornerFractions,
    scrollYProgress,
    carX,
    carY,
    carAngle,
    dashOffset,
  ]);

  return (
    <section
      ref={sectionRef}
      id="circuit"
      className="mx-auto max-w-2xl px-4 pb-28 pt-24 sm:px-6"
    >
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
                <circle r={11} fill="var(--livery)" opacity={0.25} />
                <circle r={5.5} fill="var(--livery)" />
                <path d="M 1 -2.5 L 5.5 0 L 1 2.5 Z" fill="#050505" />
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
              <p className="font-mono text-[11px] uppercase tracking-widest text-white/40">
                T{i + 1} · {item.start} — {item.end}
              </p>
              <h3 className="mt-2 text-xl font-bold text-white">
                {item.title}
              </h3>
              <a
                href={item.organisationLink}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-semibold capitalize"
                style={{ color: "var(--livery)" }}
              >
                {item.organisation}
              </a>
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
                      <span
                        key={skill}
                        className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[11px] text-white/60"
                      >
                        {skill}
                      </span>
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
