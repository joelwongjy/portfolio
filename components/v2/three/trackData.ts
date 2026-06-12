import * as THREE from "three";

// The lap in world units. X is lateral, Z runs forward (the scroll
// direction), Y is elevation — the final stretch dips underground into the
// Yas-style pit tunnel. Corner complexes reuse the same real-circuit shapes
// as the 2D map: Loews, Eau Rouge, Rettifilio, 130R, Becketts, the Sling.
const GAP = 92;
const L = -16; // left anchor lateral
const R = 16; // right anchor lateral

interface P {
  x: number;
  z: number;
  y?: number;
}

// canonical motif waypoints, written left-anchor → right-anchor in a
// 0..1 normalised gap, lateral in 2D-map coords (24..96 → remapped)
const mapX = (x2d: number, dir: number, xa: number) =>
  xa + dir * ((x2d - 24) / 72) * (R - L);

type Gap = { x2d: number; t: number }[];

const loews: Gap = [
  { x2d: 48, t: 0.14 },
  { x2d: 48, t: 0.52 },
  { x2d: 74, t: 0.52 },
  { x2d: 74, t: 0.24 },
  { x2d: 96, t: 0.24 },
];
const eauRouge: Gap = [
  { x2d: 14, t: 0.1 },
  { x2d: 52, t: 0.24 },
  { x2d: 96, t: 0.44 },
];
const rettifilio: Gap = [
  { x2d: 58, t: 0.5 },
  { x2d: 42, t: 0.62 },
  { x2d: 96, t: 0.78 },
];
const r130: Gap = [
  { x2d: 6, t: 0.38 },
  { x2d: 36, t: 0.66 },
  { x2d: 78, t: 0.78 },
  { x2d: 74, t: 0.88 },
  { x2d: 96, t: 0.95 },
];
const becketts: Gap = [
  { x2d: 44, t: 0.12 },
  { x2d: 12, t: 0.32 },
  { x2d: 54, t: 0.52 },
  { x2d: 96, t: 0.68 },
];
const sling: Gap = [
  { x2d: 50, t: 0.42 },
  { x2d: 32, t: 0.56 },
  { x2d: 60, t: 0.68 },
  { x2d: 96, t: 0.82 },
];

const GAPS = [loews, eauRouge, rettifilio, r130, becketts, sling];

export interface TrackData {
  curve: THREE.CatmullRomCurve3;
  length: number;
  cornerFractions: number[];
  cornerPositions: THREE.Vector3[];
  samples: THREE.Vector3[];
  tangents: THREE.Vector3[];
}

export const buildTrack = (): TrackData => {
  const pts: P[] = [];
  const anchorIdx: number[] = [];

  // grid + run to T1
  pts.push({ x: L, z: -40 });
  pts.push({ x: L, z: -12 });
  let z = 0;
  pts.push({ x: L, z });
  anchorIdx.push(pts.length - 1);

  for (let g = 0; g < GAPS.length; g++) {
    const xa = g % 2 === 0 ? L : R;
    const dir = g % 2 === 0 ? 1 : -1;
    const z0 = z;
    for (const wp of GAPS[g]) {
      pts.push({ x: mapX(wp.x2d, dir, xa), z: z0 + wp.t * GAP });
    }
    z = z0 + GAP;
    pts.push({ x: g % 2 === 0 ? R : L, z });
    anchorIdx.push(pts.length - 1);
  }

  // run-off into the underground pit tunnel
  const lastX = GAPS.length % 2 === 0 ? L : R;
  pts.push({ x: lastX, z: z + 26 });
  pts.push({ x: lastX, z: z + 44, y: -0.4 });
  pts.push({ x: lastX, z: z + 58, y: -2.4 });
  pts.push({ x: lastX, z: z + 74, y: -4.2 });
  pts.push({ x: lastX, z: z + 92, y: -4.6 });

  const v = pts.map((p) => new THREE.Vector3(p.x, p.y ?? 0, p.z));
  const curve = new THREE.CatmullRomCurve3(v, false, "centripetal", 0.5);

  const N = 1400;
  const samples: THREE.Vector3[] = [];
  const tangents: THREE.Vector3[] = [];
  for (let i = 0; i <= N; i++) {
    samples.push(curve.getPointAt(i / N));
    tangents.push(curve.getTangentAt(i / N));
  }

  const cornerFractions = anchorIdx.map((idx) => {
    const target = v[idx];
    let best = 0;
    let bestD = Infinity;
    samples.forEach((s, i) => {
      const d = s.distanceToSquared(target);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    });
    return best / N;
  });

  return {
    curve,
    length: curve.getLength(),
    cornerFractions,
    cornerPositions: anchorIdx.map((i) => v[i].clone()),
    samples,
    tangents,
  };
};

// A flat ribbon that follows the curve — used for grass, asphalt and the
// racing line.
export const ribbonGeometry = (
  track: TrackData,
  width: number,
  yOffset: number
): THREE.BufferGeometry => {
  const { samples, tangents } = track;
  const n = samples.length;
  const pos = new Float32Array(n * 2 * 3);
  const up = new THREE.Vector3(0, 1, 0);
  const side = new THREE.Vector3();
  for (let i = 0; i < n; i++) {
    side.crossVectors(up, tangents[i]).setY(0).normalize();
    const p = samples[i];
    pos[i * 6] = p.x + side.x * width * 0.5;
    pos[i * 6 + 1] = p.y + yOffset;
    pos[i * 6 + 2] = p.z + side.z * width * 0.5;
    pos[i * 6 + 3] = p.x - side.x * width * 0.5;
    pos[i * 6 + 4] = p.y + yOffset;
    pos[i * 6 + 5] = p.z - side.z * width * 0.5;
  }
  const idx: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    const a = i * 2;
    idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
};

export interface KerbSlab {
  position: THREE.Vector3;
  rotationY: number;
  red: boolean;
}

// Alternating red/white slabs along both edges wherever the road curves.
export const kerbSlabs = (track: TrackData): KerbSlab[] => {
  const { samples, tangents } = track;
  const slabs: KerbSlab[] = [];
  const up = new THREE.Vector3(0, 1, 0);
  const side = new THREE.Vector3();
  let acc = 0;
  let count = 0;
  for (let i = 4; i < samples.length - 4; i += 2) {
    const angle = tangents[i - 4].angleTo(tangents[i + 4]);
    acc += samples[i].distanceTo(samples[i - 2]);
    if (angle < 0.09 || acc < 1.6) continue;
    acc = 0;
    count++;
    side.crossVectors(up, tangents[i]).setY(0).normalize();
    const rotY = Math.atan2(tangents[i].x, tangents[i].z);
    for (const s of [1, -1]) {
      slabs.push({
        position: new THREE.Vector3(
          samples[i].x + side.x * s * 3.9,
          samples[i].y + 0.045,
          samples[i].z + side.z * s * 3.9
        ),
        rotationY: rotY,
        red: count % 2 === 0,
      });
    }
  }
  return slabs;
};

export interface CityBlock {
  x: number;
  z: number;
  w: number;
  d: number;
  h: number;
}

// Deterministic pseudo-random city filling the space around the lap.
export const cityBlocks = (track: TrackData): CityBlock[] => {
  const blocks: CityBlock[] = [];
  const rand = (i: number, salt: number) => {
    const s = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
    return s - Math.floor(s);
  };
  const zMin = -40;
  const zMax = track.samples[track.samples.length - 1].z;
  let i = 0;
  for (let z = zMin; z < zMax - 60; z += 11) {
    for (const lane of [-1, 1]) {
      i++;
      if (rand(i, 1) < 0.15) continue;
      const x = lane * (26 + rand(i, 2) * 30);
      const bz = z + rand(i, 3) * 10;
      // keep clear of the road
      let clear = true;
      for (let s = 0; s < track.samples.length; s += 12) {
        const p = track.samples[s];
        if ((p.x - x) ** 2 + (p.z - bz) ** 2 < 16 * 16) {
          clear = false;
          break;
        }
      }
      if (!clear) continue;
      blocks.push({
        x,
        z: bz,
        w: 5 + rand(i, 4) * 6,
        d: 5 + rand(i, 5) * 6,
        h: 3 + rand(i, 6) * rand(i, 7) * 26,
      });
    }
  }
  return blocks;
};

// shared emissive window texture, generated once on the client
export const windowTexture = (): THREE.CanvasTexture => {
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 64;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#0a0b14";
  ctx.fillRect(0, 0, 64, 64);
  for (let yy = 4; yy < 64; yy += 9) {
    for (let xx = 4; xx < 64; xx += 8) {
      const r = Math.sin(xx * 12.9898 + yy * 78.233) * 43758.5453;
      const v = r - Math.floor(r);
      if (v > 0.45) {
        ctx.fillStyle = v > 0.8 ? "#ffd98a" : "#8a7a4d";
        ctx.globalAlpha = v > 0.8 ? 0.95 : 0.6;
        ctx.fillRect(xx, yy, 4, 5);
      }
    }
  }
  ctx.globalAlpha = 1;
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
};
