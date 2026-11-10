import { City, HALF_ROAD, Track } from "./city";

// The pit lane's centreline, shared by the pit complex and the circuit.
//
// OSM's "Voie des stands" splits from the circuit almost at right angles,
// which left a square-ended strip floating beside the track. Here each end
// is replaced by a smooth Hermite merge: the lane peels off the road's right
// edge as a tapering wedge after La Rascasse, and rejoins the same way on
// the run to Sainte Dévote. Where the lane crosses the circuit's barrier
// line, the barriers, fences and boards on that side are left open.

export const PIT_HALF = 4.5; // half the pit lane width
const BARRIER_LAT = HALF_ROAD + 1.1 + 0.5; // keep in step with BARRIER in track.ts
const STEP = 2;

export interface LanePoint {
  x: number;
  y: number;
  z: number;
  /** half-width here: tapers to 0 at the very ends */
  half: number;
}

export interface PitCentreline {
  pts: LanePoint[];
  length: number;
  /** lane distance (m) where the lane is fully clear of the circuit, at each end */
  entryClear: number;
  exitClear: number;
}

export interface PitGap {
  /** +1 right of the racing direction, −1 left */
  side: 1 | -1;
  /** inclusive track sample range */
  from: number;
  to: number;
}

const cache = new WeakMap<City, PitCentreline>();
const gapCache = new WeakMap<Track, PitGap[]>();

const smooth = (t: number) => t * t * (3 - 2 * t);

const nearest = (t: Track, x: number, z: number) => {
  let best = Infinity;
  let bi = 0;
  for (let i = 0; i < t.n; i++) {
    const d = (t.pos[i * 3] - x) ** 2 + (t.pos[i * 3 + 2] - z) ** 2;
    if (d < best) {
      best = d;
      bi = i;
    }
  }
  return { i: bi, d: Math.sqrt(best) };
};

const tpose = (t: Track, i: number) => {
  const k = ((i % t.n) + t.n) % t.n;
  return {
    x: t.pos[k * 3],
    y: t.pos[k * 3 + 1],
    z: t.pos[k * 3 + 2],
    tx: t.tan[k * 2],
    tz: t.tan[k * 2 + 1],
  };
};

// cubic Hermite between two points with tangents (already scaled)
const hermite = (
  a: { x: number; z: number },
  ta: { x: number; z: number },
  b: { x: number; z: number },
  tb: { x: number; z: number },
  s: number
) => {
  const s2 = s * s;
  const s3 = s2 * s;
  const h00 = 2 * s3 - 3 * s2 + 1;
  const h10 = s3 - 2 * s2 + s;
  const h01 = -2 * s3 + 3 * s2;
  const h11 = s3 - s2;
  return {
    x: h00 * a.x + h10 * ta.x + h01 * b.x + h11 * tb.x,
    z: h00 * a.z + h10 * ta.z + h01 * b.z + h11 * tb.z,
  };
};

const resample = (pts: { x: number; y: number; z: number }[]) => {
  const out = [pts[0]];
  let acc = 0;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    let d = Math.hypot(b.x - a.x, b.z - a.z);
    let start = a;
    while (acc + d >= STEP) {
      const f = (STEP - acc) / d;
      const p = {
        x: start.x + (b.x - start.x) * f,
        y: start.y + (b.y - start.y) * f,
        z: start.z + (b.z - start.z) * f,
      };
      out.push(p);
      d -= STEP - acc;
      start = p;
      acc = 0;
    }
    acc += d;
  }
  return out;
};

export const pitCentreline = (city: City): PitCentreline => {
  const hit = cache.get(city);
  if (hit) return hit;
  const t = city.track;
  const p = city.raw.pit ?? [];
  const raw: { x: number; y: number; z: number }[] = [];
  for (let i = 0; i < p.length; i += 3) raw.push({ x: p[i] / 10, z: p[i + 1] / 10, y: p[i + 2] / 10 });
  if (raw.length < 20) {
    const empty = { pts: [], length: 0, entryClear: 0, exitClear: 0 };
    cache.set(city, empty);
    return empty;
  }

  // where the raw lane is properly clear of the circuit at each end
  const CLEAR = BARRIER_LAT + PIT_HALF + 3;
  let kj = 6;
  while (kj < raw.length / 2 && nearest(t, raw[kj].x, raw[kj].z).d < CLEAR) kj++;
  kj += 4;
  let kx = raw.length - 7;
  while (kx > raw.length / 2 && nearest(t, raw[kx].x, raw[kx].z).d < CLEAR) kx--;
  kx -= 4;

  const rawTan = (k: number) => {
    const a = raw[Math.max(0, k - 3)];
    const b = raw[Math.min(raw.length - 1, k + 3)];
    const l = Math.hypot(b.x - a.x, b.z - a.z) || 1;
    return { x: (b.x - a.x) / l, z: (b.z - a.z) / l };
  };

  // merge points on the circuit: the lane starts as a sliver at the road's
  // edge 50 m before OSM's split, and rejoins 50 m after its end
  const iSplit = nearest(t, raw[0].x, raw[0].z).i;
  const iJoin = nearest(t, raw[raw.length - 1].x, raw[raw.length - 1].z).i;
  const LEAD = 25; // samples (50 m)
  const edge = HALF_ROAD - 0.6;
  const startPose = tpose(t, iSplit - LEAD);
  const endPose = tpose(t, iJoin + LEAD);
  const atEdge = (q: ReturnType<typeof tpose>) => ({ x: q.x - q.tz * edge, z: q.z + q.tx * edge, y: q.y });
  const A = atEdge(startPose);
  const B = atEdge(endPose);

  const merge = (
    from: { x: number; y: number; z: number },
    fromTan: { x: number; z: number },
    to: { x: number; y: number; z: number },
    toTan: { x: number; z: number }
  ) => {
    const chord = Math.hypot(to.x - from.x, to.z - from.z);
    const m = chord * 0.9;
    const out: { x: number; y: number; z: number }[] = [];
    const N = Math.max(8, Math.ceil(chord / 0.5));
    for (let s = 0; s < N; s++) {
      const u = s / N;
      const q = hermite(from, { x: fromTan.x * m, z: fromTan.z * m }, to, { x: toTan.x * m, z: toTan.z * m }, u);
      out.push({ ...q, y: from.y + (to.y - from.y) * smooth(u) });
    }
    return out;
  };

  const entry = merge(A, { x: startPose.tx, z: startPose.tz }, raw[kj], rawTan(kj));
  const exit = merge(raw[kx], rawTan(kx), B, { x: endPose.tx, z: endPose.tz });
  const pts3 = resample([...entry, ...raw.slice(kj, kx + 1), ...exit, B]);

  // taper the width over the first and last 36 m, so the lane grows out of
  // the road edge like a real pit entry
  // never dip below the road surface or the ground beside it
  pts3.forEach((q) => {
    const nt = nearest(t, q.x, q.z);
    if (nt.d < BARRIER_LAT + 4) q.y = Math.max(q.y, t.pos[nt.i * 3 + 1]);
    q.y = Math.max(q.y, city.groundAt(q.x, q.z) + 0.05);
  });
  const ys = pts3.map((_, i) => {
    let a = 0;
    let c = 0;
    for (let k = -4; k <= 4; k++) {
      const j = i + k;
      if (j < 0 || j >= pts3.length) continue;
      a += pts3[j].y;
      c++;
    }
    return a / c;
  });
  pts3.forEach((q, i) => (q.y = Math.max(q.y, ys[i])));

  const TAPER = 36;
  const length = (pts3.length - 1) * STEP;
  const pts: LanePoint[] = pts3.map((q, i) => {
    const d = i * STEP;
    const e = Math.min(d, length - d);
    return { ...q, half: PIT_HALF * smooth(Math.min(1, e / TAPER)) };
  });

  // how far along the lane until it's clear of the circuit's corridor
  const clearAt = (from: number, dir: 1 | -1) => {
    for (let i = from; i >= 0 && i < pts.length; i += dir) {
      const q = pts[i];
      if (nearest(t, q.x, q.z).d - q.half > BARRIER_LAT + 0.3) return i * STEP;
    }
    return from * STEP;
  };
  const res = {
    pts,
    length,
    entryClear: clearAt(0, 1),
    exitClear: clearAt(pts.length - 1, -1),
  };
  cache.set(city, res);
  registerPitGaps(city);
  return res;
};

/** where the circuit's barrier lines are crossed by the pit lane */
export const registerPitGaps = (city: City) => {
  const t = city.track;
  if (gapCache.has(t)) return gapCache.get(t)!;
  const lane = cache.get(city) ?? pitCentreline(city);
  const gaps: PitGap[] = [];
  if (lane.pts.length) {
    const hits: Record<string, boolean[]> = { "1": [], "-1": [] };
    for (const side of [1, -1] as const) {
      for (let i = 0; i < t.n; i++) {
        const q = tpose(t, i);
        const bx = q.x - q.tz * side * BARRIER_LAT;
        const bz = q.z + q.tx * side * BARRIER_LAT;
        let hit = false;
        for (const l of lane.pts) {
          if (Math.abs(l.x - bx) > 12 || Math.abs(l.z - bz) > 12) continue;
          if (Math.hypot(l.x - bx, l.z - bz) < l.half + 0.9) {
            hit = true;
            break;
          }
        }
        hits[String(side)][i] = hit;
      }
      // dilate by two samples and collect runs
      const h = hits[String(side)];
      const on = (i: number) => {
        for (let k = -2; k <= 2; k++) if (h[(i + k + t.n) % t.n]) return true;
        return false;
      };
      let start = -1;
      for (let i = 0; i <= t.n; i++) {
        const v = i < t.n && on(i);
        if (v && start < 0) start = i;
        if (!v && start >= 0) {
          gaps.push({ side, from: start, to: i - 1 });
          start = -1;
        }
      }
    }
  }
  gapCache.set(t, gaps);
  return gaps;
};

/** the gaps for a track, once the pit lane has been built for its city */
export const pitGapsFor = (t: Track) => gapCache.get(t) ?? [];

export const inPitGap = (gaps: PitGap[], side: 1 | -1, i: number) =>
  gaps.some((g) => g.side === side && i >= g.from && i <= g.to);

/** split [0, n] into runs that avoid the gaps on one side */
export const runsAvoiding = (gaps: PitGap[], side: 1 | -1, from: number, to: number, n: number) => {
  const runs: [number, number][] = [];
  let start = -1;
  for (let i = from; i <= to; i++) {
    const blocked = inPitGap(gaps, side, ((i % n) + n) % n);
    if (!blocked && start < 0) start = i;
    if ((blocked || i === to) && start >= 0) {
      const end = blocked ? i - 1 : i;
      if (end - start >= 1) runs.push([start, end]);
      start = -1;
    }
  }
  return runs;
};
