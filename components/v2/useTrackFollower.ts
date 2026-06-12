import { useMotionTemplate, useMotionValue } from "framer-motion";
import { RefObject, useEffect, useState } from "react";

export interface TrackGeometry {
  d: string;
  kerbs?: string;
  height: number;
  corners: { x: number; y: number }[];
}

export interface FollowInfo {
  centerY: number;
  targetY: number;
  at: number;
  passed: number;
  trackLength: number;
  trackHeight: number;
}

// Drives a car along an SVG path so it always sits where the path crosses
// the vertical middle of the viewport. Paths may double back on themselves
// (hairpins, pit boxes), so arc length is interpolated between sampled
// anchor positions rather than derived from y directly — the car drives the
// full complex between one anchor and the next.
export const useTrackFollower = (
  pathRef: RefObject<SVGPathElement>,
  listRef: RefObject<HTMLOListElement>,
  track: TrackGeometry | undefined,
  onUpdate?: (info: FollowInfo) => void
) => {
  const [trackLength, setTrackLength] = useState(0);
  const [anchorLengths, setAnchorLengths] = useState<number[]>([]);
  const [passed, setPassed] = useState(0);

  const carX = useMotionValue(0);
  const carY = useMotionValue(0);
  const carAngle = useMotionValue(90);
  const carTransform = useMotionTemplate`translate(${carX}px, ${carY}px) rotate(${carAngle}deg) scale(0.92)`;
  const dashOffset = useMotionValue(0);

  // Sample the rendered path once to find each anchor's arc length.
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
  }, [pathRef, track, dashOffset]);

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
      onUpdate?.({
        centerY,
        targetY,
        at,
        passed: passedCount,
        trackLength,
        trackHeight: track.height,
      });
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [
    pathRef,
    listRef,
    track,
    trackLength,
    anchorLengths,
    onUpdate,
    carX,
    carY,
    carAngle,
    dashOffset,
  ]);

  return { trackLength, passed, carTransform, dashOffset };
};
