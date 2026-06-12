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
const LANE_X = 60; // the fast lane down the middle of the rail
const SPUR_X = 116; // garage entrance — right up against the cam panel

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

// Down the lane, swing right to the garage door (the wheel-gun cam panel),
// hold alongside it, back out — for every stop.
const buildLane = (anchors: { x: number; y: number }[], height: number) => {
  const pts: Waypoint[] = [{ x: LANE_X, y: 0 }];
  anchors.forEach((a) => {
    pts.push(
      { x: LANE_X, y: a.y - 58, r: 16 },
      { x: SPUR_X, y: a.y - 24, r: 12 },
      { x: SPUR_X, y: a.y + 24, r: 12 },
      { x: LANE_X, y: a.y + 58, r: 16 }
    );
  });
  pts.push({ x: LANE_X, y: height });
  return `M ${LANE_X} 0` + roundedPath(pts);
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
        (c) => Math.abs(c.y - info.targetY) < 55
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

  // The car parks level with the centre of each card's cam panel.
  const measure = useCallback(() => {
    const list = listRef.current;
    if (!list) return;
    const anchors = itemRefs.current
      .filter((el): el is HTMLLIElement => el !== null)
      .map((el) => {
        const cam = el.querySelector<HTMLElement>("[data-cam]");
        const camTop = cam ? cam.offsetTop : 0;
        const camHeight = cam ? cam.offsetHeight : 120;
        return { x: SPUR_X, y: el.offsetTop + camTop + camHeight / 2 };
      });
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
                <div data-cam>
                  <WheelGunCam
                    box={i + 1}
                    compound={compound}
                    active={atStall === i}
                    wingStop={i === WING_STOP}
                  />
                </div>

                <p className="mt-4 font-mono text-[11px] uppercase tracking-widest text-white/40">
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
