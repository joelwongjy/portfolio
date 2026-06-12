import { motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";

import { project } from "@/data/projects";

import { roundedPath, Waypoint } from "./Circuit";
import { RaceCar } from "./RaceCar";
import { Box3D, CrewDot, TunnelPortal, Windows } from "./Scenery";
import { TechChip } from "./TechChip";
import {
  FollowInfo,
  TrackGeometry,
  useTrackFollower,
} from "./useTrackFollower";

const RAIL_WIDTH = 120;
const LANE_X = 84; // the straight pit lane in front of the building
const DOOR_X = 56; // apron where the car stops at its garage door
const BUILDING = { x: 4, w: 42, d: 6 };
const MARKER_OFFSET = 36;

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

// Straight down the lane, swing left to the garage door, hold, pull back out.
const buildLane = (anchors: { x: number; y: number }[], height: number) => {
  const pts: Waypoint[] = [{ x: LANE_X, y: 0 }];
  anchors.forEach((a) => {
    pts.push(
      { x: LANE_X, y: a.y - 56, r: 16 },
      { x: DOOR_X, y: a.y - 22, r: 10 },
      { x: DOOR_X, y: a.y + 22, r: 10 },
      { x: LANE_X, y: a.y + 56, r: 16 }
    );
  });
  pts.push({ x: LANE_X, y: height });
  return `M ${LANE_X} 0` + roundedPath(pts).d;
};

export const PitLane = () => {
  const listRef = useRef<HTMLOListElement>(null);
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);
  const pathRef = useRef<SVGPathElement>(null);

  const [track, setTrack] = useState<TrackGeometry>();
  const [atStall, setAtStall] = useState(-1);

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
      .map((el) => ({ x: DOOR_X, y: el.offsetTop + MARKER_OFFSET }));
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
          Out of the tunnel and into the garage — {projects.length} stops, one
          per project. Speed limit 60.
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
            {/* the pit building, Apple-Maps 3D style */}
            <Box3D
              x={BUILDING.x}
              y={12}
              w={BUILDING.w}
              h={track.height - 36}
              d={BUILDING.d}
            />
            {/* helipad up top */}
            <circle
              cx={BUILDING.x + BUILDING.w / 2}
              cy={40}
              r={10}
              fill="none"
              stroke="rgba(255,255,255,0.18)"
              strokeWidth={1.5}
            />
            <text
              x={BUILDING.x + BUILDING.w / 2}
              y={43.5}
              textAnchor="middle"
              fontSize={9}
              fontWeight={700}
              fill="rgba(255,255,255,0.4)"
            >
              H
            </text>
            {/* the giant painted roof mark, Vegas pit-building style */}
            <text
              x={BUILDING.x + BUILDING.w / 2 + 9}
              y={(track.corners[0].y + track.corners[track.corners.length - 1].y) / 2}
              textAnchor="middle"
              fontSize={30}
              fontWeight={800}
              fill="var(--livery)"
              opacity={0.9}
              transform={`rotate(90 ${BUILDING.x + BUILDING.w / 2 + 9} ${
                (track.corners[0].y +
                  track.corners[track.corners.length - 1].y) /
                2
              })`}
              style={{ letterSpacing: 6 }}
            >
              JW RACING
            </text>
            {/* glazed front along the lane + rooftop AC units */}
            {track.corners.map((c, i) => (
              <g key={`facade-${i}`}>
                <Windows
                  x={BUILDING.x + BUILDING.w - 6}
                  y={c.y - 56}
                  cols={1}
                  rows={6}
                  pitchY={5.4}
                />
                <rect
                  x={BUILDING.x + 6}
                  y={c.y - 64}
                  width={7}
                  height={7}
                  fill="#252840"
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth={0.8}
                />
              </g>
            ))}

            {/* lane: same asphalt as the circuit */}
            <path
              d={track.d}
              stroke="rgba(255,255,255,0.28)"
              strokeWidth={12.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              ref={pathRef}
              d={track.d}
              stroke="#1E1E23"
              strokeWidth={11}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* speed-limit centre line on the straight */}
            <line
              x1={LANE_X}
              y1={56}
              x2={LANE_X}
              y2={track.height - 16}
              stroke="rgba(255,255,255,0.12)"
              strokeWidth={1.5}
              strokeDasharray="8 8"
            />
            {trackLength > 0 && (
              <motion.path
                d={track.d}
                stroke="var(--livery)"
                strokeWidth={4}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={trackLength}
                style={{
                  strokeDashoffset: dashOffset,
                  filter: "drop-shadow(0 0 6px var(--livery-glow))",
                }}
              />
            )}

            {/* garage doors cut into the building face */}
            {track.corners.map((c, i) => (
              <g key={`door-${i}`}>
                {atStall === i && (
                  <motion.rect
                    x={BUILDING.x + BUILDING.w - 9}
                    y={c.y - 12}
                    width={10}
                    height={24}
                    rx={2}
                    fill="var(--livery)"
                    animate={{ opacity: [0.15, 0.5, 0.15] }}
                    transition={{ duration: 1.1, repeat: Infinity }}
                  />
                )}
                <rect
                  x={BUILDING.x + BUILDING.w - 7}
                  y={c.y - 11}
                  width={7}
                  height={22}
                  fill="#08080A"
                  stroke="rgba(255,255,255,0.18)"
                  strokeWidth={1}
                />
                <text
                  x={BUILDING.x + BUILDING.w - 12}
                  y={c.y + 2.5}
                  textAnchor="end"
                  fontSize={7}
                  className="font-mono"
                  fill={
                    passed > i ? "var(--livery)" : "rgba(255,255,255,0.35)"
                  }
                >
                  P{i + 1}
                </text>
                {/* the crew at the door when the car boxes */}
                {atStall === i &&
                  [
                    { x: DOOR_X - 9, y: c.y - 16 },
                    { x: DOOR_X + 9, y: c.y - 16 },
                    { x: DOOR_X - 9, y: c.y + 16 },
                    { x: DOOR_X + 9, y: c.y + 16 },
                  ].map((p, j) => (
                    <motion.g
                      key={j}
                      transform={`translate(${p.x} ${p.y})`}
                      animate={{ y: [0, -1.6, 0] }}
                      transition={{
                        duration: 0.4,
                        repeat: Infinity,
                        delay: j * 0.1,
                      }}
                    >
                      <CrewDot />
                    </motion.g>
                  ))}
              </g>
            ))}

            {/* car */}
            {trackLength > 0 && (
              <motion.g style={{ transform: carTransform }}>
                <RaceCar
                  damagedWing={passed <= WING_STOP}
                  compound={carCompound}
                  jacked={atStall >= 0}
                />
              </motion.g>
            )}

            {/* Yas Marina tunnel mouth — the car emerges from underground */}
            <TunnelPortal x={LANE_X} mouthY={2} dir="out" id="tunnelOut" />
            <text
              x={LANE_X}
              y={70}
              textAnchor="middle"
              fontSize={6.5}
              className="font-mono"
              fill="rgba(255,255,255,0.35)"
            >
              TUNNEL EXIT
            </text>
            <text
              x={LANE_X}
              y={track.height - 6}
              textAnchor="middle"
              fontSize={7}
              className="font-mono"
              fill="rgba(255,255,255,0.35)"
            >
              PIT EXIT
            </text>
          </svg>
        )}

        <ol ref={listRef} className="relative space-y-16 pl-[132px] pt-20">
          {projects.map((item, i) => {
            const compound = COMPOUNDS[i % COMPOUNDS.length];
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
