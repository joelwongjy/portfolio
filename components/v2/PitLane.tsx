import { motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";

import { project } from "@/data/projects";

import { roundedPath, Waypoint } from "./Circuit";
import { RaceCar } from "./RaceCar";
import { TechChip } from "./TechChip";
import {
  FollowInfo,
  TrackGeometry,
  useTrackFollower,
} from "./useTrackFollower";
import { WheelGunCam } from "./WheelGunCam";

const RAIL_WIDTH = 120;
const LANE_X = 84; // the fast lane the car drives down
const BOX_X = 36; // where it swings in to stop
const MARKER_OFFSET = 24;

// Pirelli-style compounds fitted at each stop. Stop 2 also replaces the
// front wing the car arrives with damaged.
const COMPOUNDS = [
  { name: "Soft", letter: "S", color: "#E10600", time: "2.1" },
  { name: "Medium", letter: "M", color: "#FFD12E", time: "4.6" },
  { name: "Hard", letter: "H", color: "#F0F0F0", time: "2.9" },
  { name: "Inters", letter: "I", color: "#43B02A", time: "3.4" },
];
const WING_STOP = 1;

const projects = [
  ...project.favoriteProjects.projects,
  ...project.otherProjects.projects,
];

// In, stop at the box, out — for every stall. The long vertical run through
// the box keeps the car "stationary" in it for more of the scroll.
const buildLane = (anchors: { x: number; y: number }[], height: number) => {
  const pts: Waypoint[] = [{ x: LANE_X, y: 0 }];
  anchors.forEach((a) => {
    pts.push(
      { x: LANE_X, y: a.y - 58, r: 16 },
      { x: BOX_X, y: a.y - 26, r: 12 },
      { x: BOX_X, y: a.y + 26, r: 12 },
      { x: LANE_X, y: a.y + 58, r: 16 }
    );
  });
  pts.push({ x: LANE_X, y: height });
  return `M ${LANE_X} 0` + roundedPath(pts);
};

// Screen offsets of the four wheels of a car parked nose-down at a stall.
const WHEEL_SPOTS = [
  { dx: -8, dy: -10 },
  { dx: 8, dy: -10 },
  { dx: -8, dy: 10 },
  { dx: 8, dy: 10 },
];

const Tyre = ({
  compound,
  fitted,
}: {
  compound: (typeof COMPOUNDS)[number];
  fitted: boolean;
}) => (
  <motion.span
    animate={
      fitted ? { rotate: 360, scale: [1, 1.3, 1] } : { rotate: 0, scale: 1 }
    }
    transition={{ duration: 0.6, ease: "easeOut" }}
    className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-900 text-[8px] font-extrabold"
    style={{
      border: `3px solid ${fitted ? compound.color : "#3A3A40"}`,
      color: fitted ? compound.color : "#5A5A60",
    }}
  >
    {compound.letter}
  </motion.span>
);

export const PitLane = () => {
  const listRef = useRef<HTMLOListElement>(null);
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);
  const pathRef = useRef<SVGPathElement>(null);

  const [track, setTrack] = useState<TrackGeometry>();
  const [atStall, setAtStall] = useState(-1);
  const [justFitted, setJustFitted] = useState<number | null>(null);

  const onUpdate = useCallback(
    (info: FollowInfo) => {
      if (!track) return;
      const near = track.corners.findIndex(
        (c) => Math.abs(c.y - info.targetY) < 50
      );
      setAtStall(near);
    },
    [track]
  );

  const { trackLength, passed, carTransform, dashOffset } = useTrackFollower(
    pathRef,
    listRef,
    track,
    onUpdate
  );

  // One-shot tyre/wing change choreography when the car clears a stop.
  const prevPassed = useRef(0);
  useEffect(() => {
    if (passed > prevPassed.current) {
      setJustFitted(passed - 1);
      const timer = window.setTimeout(() => setJustFitted(null), 800);
      prevPassed.current = passed;
      return () => window.clearTimeout(timer);
    }
    prevPassed.current = passed;
  }, [passed]);

  // worn rubber on arrival, then whatever the last stop fitted
  const carCompound =
    passed > 0
      ? COMPOUNDS[Math.min(passed, COMPOUNDS.length) - 1].color
      : "#52525B";

  const measure = useCallback(() => {
    const list = listRef.current;
    if (!list) return;
    const anchors = itemRefs.current
      .filter((el): el is HTMLLIElement => el !== null)
      .map((el) => ({ x: BOX_X, y: el.offsetTop + MARKER_OFFSET }));
    if (anchors.length === 0) return;
    const height = list.offsetHeight;
    setTrack({ d: buildLane(anchors, height), height, corners: anchors });
  }, []);

  useEffect(() => {
    measure();
    const observer = new ResizeObserver(measure);
    if (listRef.current) observer.observe(listRef.current);
    return () => observer.disconnect();
  }, [measure]);

  return (
    <section id="pits" className="mx-auto max-w-2xl px-4 pb-12 pt-16 sm:px-6">
      <header className="mb-14">
        <p
          className="text-xs font-semibold uppercase tracking-[0.35em]"
          style={{ color: "var(--livery)" }}
        >
          Pit Lane
        </p>
        <h2 className="mt-3 text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
          Box, box.
        </h2>
        <p className="mt-4 text-white/50">
          {projects.length} stops after the flag — the projects. Fresh tyres
          at every box. Speed limit 60.
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
            {/* pit wall */}
            <line
              x1={106}
              y1={0}
              x2={106}
              y2={track.height}
              stroke="rgba(255,255,255,0.15)"
            />
            <text
              x={LANE_X}
              y={12}
              textAnchor="middle"
              fontSize={7}
              className="font-mono"
              fill="rgba(255,255,255,0.35)"
            >
              PIT ENTRY
            </text>
            {/* lane */}
            <path
              ref={pathRef}
              d={track.d}
              stroke="rgba(255,255,255,0.12)"
              strokeWidth={6}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
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
            <text
              x={LANE_X}
              y={track.height - 8}
              textAnchor="middle"
              fontSize={7}
              className="font-mono"
              fill="rgba(255,255,255,0.35)"
            >
              PIT EXIT
            </text>
            {/* pit crew working each wheel while the car is in the box */}
            {atStall >= 0 &&
              track.corners[atStall] &&
              WHEEL_SPOTS.map((spot, j) => (
                <motion.circle
                  key={`crew-${j}`}
                  cx={track.corners[atStall].x + spot.dx * 1.7}
                  cy={track.corners[atStall].y + spot.dy}
                  r={2}
                  fill="var(--livery)"
                  animate={{ opacity: [0.25, 1, 0.25] }}
                  transition={{
                    duration: 0.45,
                    repeat: Infinity,
                    delay: j * 0.1,
                  }}
                />
              ))}

            {/* old tyres off, new compound on */}
            {justFitted !== null && track.corners[justFitted] && (
              <g>
                {WHEEL_SPOTS.map((spot, j) => {
                  const wheelX = track.corners[justFitted].x + spot.dx;
                  const wheelY = track.corners[justFitted].y + spot.dy;
                  const out = spot.dx < 0 ? -28 : 28;
                  return (
                    <g key={`swap-${j}`}>
                      <motion.g
                        initial={{ x: wheelX, y: wheelY, opacity: 1, rotate: 0 }}
                        animate={{
                          x: wheelX + out,
                          y: wheelY + 12,
                          opacity: 0,
                          rotate: 90,
                        }}
                        transition={{ duration: 0.55, ease: "easeOut" }}
                      >
                        <rect x={-2.75} y={-4} width={5.5} height={8} rx={2} fill="#3F3F46" />
                      </motion.g>
                      <motion.g
                        initial={{ x: wheelX + out, y: wheelY - 14, opacity: 0 }}
                        animate={{ x: wheelX, y: wheelY, opacity: [0, 1, 0] }}
                        transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
                      >
                        <rect
                          x={-2.75}
                          y={-4}
                          width={5.5}
                          height={8}
                          rx={2}
                          fill="#141416"
                          stroke={COMPOUNDS[justFitted % COMPOUNDS.length].color}
                          strokeWidth={1.5}
                        />
                      </motion.g>
                    </g>
                  );
                })}
                {/* broken front wing tumbles away at the wing stop */}
                {justFitted === WING_STOP && (
                  <motion.g
                    initial={{
                      x: track.corners[justFitted].x,
                      y: track.corners[justFitted].y + 15,
                      opacity: 1,
                      rotate: -14,
                    }}
                    animate={{
                      x: track.corners[justFitted].x - 24,
                      y: track.corners[justFitted].y + 44,
                      opacity: 0,
                      rotate: -80,
                    }}
                    transition={{ duration: 0.65, ease: "easeOut" }}
                  >
                    <rect x={-6.5} y={-1.8} width={13} height={3.6} rx={1.4} fill="#55555C" />
                  </motion.g>
                )}
              </g>
            )}

            {trackLength > 0 && (
              <motion.g style={{ transform: carTransform }}>
                <RaceCar
                  damagedWing={passed <= WING_STOP}
                  compound={carCompound}
                  jacked={atStall >= 0}
                />
              </motion.g>
            )}
          </svg>
        )}

        <ol ref={listRef} className="relative space-y-16 pl-[132px] pt-16">
          {projects.map((item, i) => {
            const compound = COMPOUNDS[i % COMPOUNDS.length];
            const fitted = passed > i;
            return (
              <motion.li
                key={item.title}
                ref={(el) => {
                  itemRefs.current[i] = el;
                }}
                className="relative"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, ease: [0.21, 0.6, 0.35, 1] }}
              >
                {/* garage box around the stop point */}
                <div
                  aria-hidden
                  className={`absolute -left-[118px] -top-2 h-16 w-16 rounded-lg border transition-colors ${
                    fitted ? "border-white/30" : "border-white/10"
                  }`}
                >
                  <span className="absolute right-0.5 top-1/2 -translate-y-1/2">
                    <Tyre compound={compound} fitted={fitted} />
                  </span>
                  <span className="absolute -bottom-5 left-0 right-0 text-center font-mono text-[9px] text-white/40">
                    P{i + 1}
                  </span>
                </div>

                <p className="font-mono text-[11px] uppercase tracking-widest text-white/40">
                  Stop {i + 1} ·{" "}
                  <span style={{ color: "var(--livery)" }}>
                    {compound.time}s
                  </span>{" "}
                  · <span style={{ color: compound.color }}>{compound.name}</span>
                  {i === WING_STOP && (
                    <span className="text-white/55"> + front wing</span>
                  )}
                </p>
                <h3 className="mt-2 text-xl font-bold text-white">
                  {item.title}
                </h3>
                <div className="mt-3">
                  <WheelGunCam
                    compound={compound}
                    active={atStall === i}
                    wingStop={i === WING_STOP}
                  />
                </div>
                <p className="mt-2 text-sm leading-relaxed text-white/65">
                  {item.description}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {item.primaryLink && (
                    <a
                      href={item.primaryLink}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full px-3.5 py-1.5 text-xs font-bold text-black transition-transform hover:scale-105"
                      style={{ backgroundColor: "var(--livery)" }}
                    >
                      {item.primaryMessage}
                    </a>
                  )}
                  {item.secondaryLink && (
                    <a
                      href={item.secondaryLink}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full border border-white/15 px-3.5 py-1.5 text-xs font-semibold text-white/70 transition-colors hover:border-white/30 hover:text-white"
                    >
                      {item.secondaryMessage}
                    </a>
                  )}
                </div>
                {item.skills.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {item.skills.map((skill) => (
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
