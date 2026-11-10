// Loads and decodes public/monaco/scene.json (built by
// scripts/monaco/build.mjs) into typed arrays the scene builders share.
// World units are metres: x east, z south, y up.

export interface RawCity {
  attribution: string;
  bounds: { x0: number; x1: number; z0: number; z1: number };
  track: { step: number; length: number; p: number[]; y: number[]; tunnel: [number, number] };
  terrain: Grid & { data: string };
  outer: Grid & { data: string };
  sea: number[][];
  land: number[][];
  buildings: { p: number[]; b: number; t: number; k: number; d?: 1; c?: string }[];
  roads: { c: number; w: number; p: number[] }[];
  areas: { k: number; p: number[] }[];
  piers: { w: number; p: number[] }[];
  trees: [number, number, number][];
  yachts: [number, number, number, number][];
  /** pit lane centreline, x,z,y in decimetres, from pit entry to pit exit */
  pit?: number[];
}

interface Grid {
  x0: number;
  z0: number;
  step: number;
  w: number;
  h: number;
}

export interface HeightGrid extends Grid {
  data: Float32Array;
}

export interface Track {
  n: number;
  length: number;
  step: number;
  /** centreline x,y,z per sample */
  pos: Float32Array;
  /** horizontal unit tangent per sample (x,z) */
  tan: Float32Array;
  /** signed curvature (1/m), +ve turning right */
  curv: Float32Array;
  tunnel: [number, number];
}

export interface City {
  raw: RawCity;
  bounds: RawCity["bounds"];
  track: Track;
  terrain: HeightGrid;
  outer: HeightGrid;
  groundAt: (x: number, z: number) => number;
  isSea: (x: number, z: number) => boolean;
  /** horizontal distance to the centreline and the nearest sample */
  nearTrack: (x: number, z: number) => { d: number; i: number };
}

// half the drawn road width: wider than the real street (as map apps draw
// roads), so the racing line has room to swing; keep in step with HALF in
// scripts/monaco/build.mjs
export const HALF_ROAD = 6;

const decode = (b64: string, scale: number) => {
  const bin = atob(b64);
  const u8 = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
  const i16 = new Int16Array(u8.buffer);
  const out = new Float32Array(i16.length);
  for (let i = 0; i < i16.length; i++) out[i] = i16[i] / scale;
  return out;
};

const sampler = (g: HeightGrid) => (x: number, z: number) => {
  const gx = (x - g.x0) / g.step;
  const gz = (z - g.z0) / g.step;
  const i = Math.max(0, Math.min(g.w - 2, Math.floor(gx)));
  const j = Math.max(0, Math.min(g.h - 2, Math.floor(gz)));
  const fx = Math.max(0, Math.min(1, gx - i));
  const fz = Math.max(0, Math.min(1, gz - j));
  const d = g.data;
  return (
    d[j * g.w + i] * (1 - fx) * (1 - fz) +
    d[j * g.w + i + 1] * fx * (1 - fz) +
    d[(j + 1) * g.w + i] * (1 - fx) * fz +
    d[(j + 1) * g.w + i + 1] * fx * fz
  );
};

const buildTrack = (t: RawCity["track"]): Track => {
  const n = t.p.length / 2;
  const pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    pos[i * 3] = t.p[i * 2] / 10;
    pos[i * 3 + 1] = t.y[i] / 10;
    pos[i * 3 + 2] = t.p[i * 2 + 1] / 10;
  }
  const tan = new Float32Array(n * 2);
  for (let i = 0; i < n; i++) {
    const a = ((i - 1 + n) % n) * 3;
    const b = ((i + 1) % n) * 3;
    const dx = pos[b] - pos[a];
    const dz = pos[b + 2] - pos[a + 2];
    const l = Math.hypot(dx, dz) || 1;
    tan[i * 2] = dx / l;
    tan[i * 2 + 1] = dz / l;
  }
  // curvature from the heading change over ±6 samples (±12 m)
  const raw = new Float32Array(n);
  const K = 6;
  for (let i = 0; i < n; i++) {
    const a = ((i - K + n) % n) * 2;
    const b = ((i + K) % n) * 2;
    const cross = tan[a] * tan[b + 1] - tan[a + 1] * tan[b];
    const dot = tan[a] * tan[b] + tan[a + 1] * tan[b + 1];
    // x east, z south: a positive cross is a clockwise (right-hand) turn
    raw[i] = Math.atan2(cross, dot) / (2 * K * t.step);
  }
  const curv = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    let s = 0;
    for (let k = -4; k <= 4; k++) s += raw[(i + k + n) % n];
    curv[i] = s / 9;
  }
  return { n, length: t.length, step: t.step, pos, tan, curv, tunnel: t.tunnel };
};

const pointInRing = (x: number, z: number, r: number[]) => {
  let c = false;
  const n = r.length / 2;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = r[i * 2] / 10;
    const zi = r[i * 2 + 1] / 10;
    const xj = r[j * 2] / 10;
    const zj = r[j * 2 + 1] / 10;
    if (zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) c = !c;
  }
  return c;
};

const trackIndex = (t: Track) => {
  const CELL = 30;
  const cells = new Map<string, number[]>();
  for (let i = 0; i < t.n; i++) {
    const k = `${Math.floor(t.pos[i * 3] / CELL)},${Math.floor(t.pos[i * 3 + 2] / CELL)}`;
    const list = cells.get(k);
    if (list) list.push(i);
    else cells.set(k, [i]);
  }
  const res = { d: Infinity, i: -1 };
  return (x: number, z: number) => {
    const cx = Math.floor(x / CELL);
    const cz = Math.floor(z / CELL);
    res.d = Infinity;
    res.i = -1;
    for (let a = -1; a <= 1; a++) {
      for (let b = -1; b <= 1; b++) {
        const list = cells.get(`${cx + a},${cz + b}`);
        if (!list) continue;
        for (const i of list) {
          const d = Math.hypot(t.pos[i * 3] - x, t.pos[i * 3 + 2] - z);
          if (d < res.d) {
            res.d = d;
            res.i = i;
          }
        }
      }
    }
    return res;
  };
};

let pending: Promise<City> | null = null;

export const loadCity = () => {
  if (!pending) {
    pending = fetch("/monaco/scene.json")
      .then((r) => {
        if (!r.ok) throw new Error(`scene.json ${r.status}`);
        return r.json() as Promise<RawCity>;
      })
      .then((raw) => {
        const terrain: HeightGrid = { ...raw.terrain, data: decode(raw.terrain.data, 10) };
        const outer: HeightGrid = { ...raw.outer, data: decode(raw.outer.data, 1) };
        const groundAt = sampler(terrain);
        const isSea = (x: number, z: number) =>
          raw.sea.some((r) => pointInRing(x, z, r)) &&
          !raw.land.some((r) => pointInRing(x, z, r));
        const track = buildTrack(raw.track);
        return {
          raw,
          bounds: raw.bounds,
          track,
          nearTrack: trackIndex(track),
          terrain,
          outer,
          groundAt,
          isSea,
        };
      })
      .catch((e) => {
        pending = null;
        throw e;
      });
  }
  return pending;
};

// ——— lap helpers ————————————————————————————————————————————————

/** centreline point and heading at a lap distance (metres) */
export const trackPose = (
  track: Track,
  d: number,
  out: { x: number; y: number; z: number; tx: number; tz: number }
) => {
  const L = track.n * track.step;
  const s = (((d % L) + L) % L) / track.step;
  const i = Math.floor(s);
  const f = s - i;
  const a = i % track.n;
  const b = (i + 1) % track.n;
  const p = track.pos;
  out.x = p[a * 3] + (p[b * 3] - p[a * 3]) * f;
  out.y = p[a * 3 + 1] + (p[b * 3 + 1] - p[a * 3 + 1]) * f;
  out.z = p[a * 3 + 2] + (p[b * 3 + 2] - p[a * 3 + 2]) * f;
  const t = track.tan;
  const tx = t[a * 2] + (t[b * 2] - t[a * 2]) * f;
  const tz = t[a * 2 + 1] + (t[b * 2 + 1] - t[a * 2 + 1]) * f;
  const l = Math.hypot(tx, tz) || 1;
  out.tx = tx / l;
  out.tz = tz / l;
  return out;
};
