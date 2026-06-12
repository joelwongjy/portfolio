import * as THREE from "three";

// Circuit de Monaco, traced from the real plan. X runs east, Z north,
// Y is elevation — the climb from Ste Dévote through Beau Rivage up to
// Casino Square, back down through Mirabeau and the Fairmont hairpin to
// sea level, through the tunnel and around the harbour. One world unit
// is roughly 4 metres.
interface P {
  x: number;
  z: number;
  y?: number;
}

const PLAN: P[] = [
  { x: 0, z: -8 }, // start/finish
  { x: 1, z: 8 },
  { x: 3, z: 22 }, // Ste Dévote entry
  { x: 7, z: 29 }, // T1 apex (right)
  { x: 14, z: 34, y: 1 },
  { x: 24, z: 42, y: 3.2 }, // Beau Rivage climb
  { x: 34, z: 50, y: 5.6 },
  { x: 44, z: 55, y: 7.6 },
  { x: 54, z: 60, y: 9.2 }, // Massenet left sweep
  { x: 62, z: 60, y: 10.2 },
  { x: 68, z: 55, y: 10.6 }, // Casino Square (right)
  { x: 70, z: 47, y: 10.2 },
  { x: 66, z: 40, y: 8.8 }, // downhill
  { x: 64, z: 33, y: 7.6 }, // Mirabeau (right)
  { x: 57, z: 31.5, y: 6.6 },
  { x: 51, z: 29.5, y: 5.8 }, // toward the hairpin
  { x: 45.5, z: 26, y: 5.4 }, // Fairmont hairpin (tight left)
  { x: 43.5, z: 22.5, y: 5.2 },
  { x: 47, z: 20, y: 4.8 },
  { x: 52, z: 19.5, y: 4.2 }, // out of the hairpin, south of the approach
  { x: 57, z: 18.5, y: 3.4 },
  { x: 61, z: 16, y: 2.6 }, // Portier (right-right)
  { x: 64, z: 14, y: 2.2 },
  { x: 72, z: 10, y: 1.9 }, // tunnel entry
  { x: 81, z: 5, y: 1.6 }, // — under the hotel —
  { x: 87, z: -3, y: 1.2 },
  { x: 89, z: -12, y: 0.7 }, // tunnel exit
  { x: 88, z: -20, y: 0.3 },
  { x: 84.5, z: -26, y: 0 }, // Nouvelle Chicane (left)
  { x: 80, z: -27.5, y: 0 },
  { x: 74, z: -30, y: 0 }, // Tabac (left)
  { x: 68, z: -34, y: 0 },
  { x: 61, z: -35, y: 0 }, // Piscine: left-right
  { x: 55, z: -38.5, y: 0 },
  { x: 49, z: -43, y: 0 }, // right-left out of the pool
  { x: 43, z: -42, y: 0 },
  { x: 38, z: -38, y: 0 }, // La Rascasse (tight right)
  { x: 34, z: -33, y: 0 },
  { x: 28, z: -30, y: 0.2 }, // Antony Noghès (right)
  { x: 18, z: -27, y: 0.2 },
  { x: 8, z: -22, y: 0.1 },
  { x: 2, z: -16, y: 0 },
];

// the seven career corners, in lap order
const ANCHOR_PLAN_IDX = [3, 10, 13, 17, 21, 28, 33];

// tunnel runs between these plan points
const TUNNEL_RANGE: [number, number] = [23, 26];

export interface TrackData {
  curve: THREE.CatmullRomCurve3;
  length: number;
  cornerFractions: number[];
  cornerPositions: THREE.Vector3[];
  samples: THREE.Vector3[];
  tangents: THREE.Vector3[];
  tunnelFractions: [number, number];
}

const nearestFraction = (samples: THREE.Vector3[], target: THREE.Vector3) => {
  let best = 0;
  let bestD = Infinity;
  samples.forEach((s, i) => {
    const d = s.distanceToSquared(target);
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  });
  return best / (samples.length - 1);
};

export const buildTrack = (): TrackData => {
  const v = PLAN.map((p) => new THREE.Vector3(p.x, p.y ?? 0, p.z));
  const curve = new THREE.CatmullRomCurve3(v, true, "centripetal", 0.5);

  const N = 1600;
  const samples: THREE.Vector3[] = [];
  const tangents: THREE.Vector3[] = [];
  for (let i = 0; i <= N; i++) {
    samples.push(curve.getPointAt(i / N));
    tangents.push(curve.getTangentAt(i / N));
  }

  return {
    curve,
    length: curve.getLength(),
    cornerFractions: ANCHOR_PLAN_IDX.map((i) => nearestFraction(samples, v[i])),
    cornerPositions: ANCHOR_PLAN_IDX.map((i) => v[i].clone()),
    samples,
    tangents,
    tunnelFractions: [
      nearestFraction(samples, v[TUNNEL_RANGE[0]]),
      nearestFraction(samples, v[TUNNEL_RANGE[1]]),
    ],
  };
};

// A ribbon that follows the curve between two fractions; lift !== 0 builds a
// vertical wall instead of a flat strip.
export const ribbonGeometry = (
  track: TrackData,
  width: number,
  yOffset: number,
  t0 = 0,
  t1 = 1,
  lateral = 0,
  wallHeight = 0
): THREE.BufferGeometry => {
  const { samples, tangents } = track;
  const n = samples.length;
  const i0 = Math.floor(t0 * (n - 1));
  const i1 = Math.ceil(t1 * (n - 1));
  const count = i1 - i0 + 1;
  const pos = new Float32Array(count * 2 * 3);
  const up = new THREE.Vector3(0, 1, 0);
  const side = new THREE.Vector3();
  for (let i = 0; i < count; i++) {
    const s = i0 + i;
    side.crossVectors(up, tangents[s]).setY(0).normalize();
    const p = samples[s];
    const cx = p.x + side.x * lateral;
    const cz = p.z + side.z * lateral;
    if (wallHeight > 0) {
      pos[i * 6] = cx;
      pos[i * 6 + 1] = p.y + yOffset;
      pos[i * 6 + 2] = cz;
      pos[i * 6 + 3] = cx;
      pos[i * 6 + 4] = p.y + yOffset + wallHeight;
      pos[i * 6 + 5] = cz;
    } else {
      pos[i * 6] = cx + side.x * width * 0.5;
      pos[i * 6 + 1] = p.y + yOffset;
      pos[i * 6 + 2] = cz + side.z * width * 0.5;
      pos[i * 6 + 3] = cx - side.x * width * 0.5;
      pos[i * 6 + 4] = p.y + yOffset;
      pos[i * 6 + 5] = cz - side.z * width * 0.5;
    }
  }
  const idx: number[] = [];
  for (let i = 0; i < count - 1; i++) {
    const a = i * 2;
    idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
};

// Solid embankment connecting the road edge down to the ground, so the
// elevated sections read as a causeway cut into the hill, not a floating
// ribbon.
export const skirtGeometry = (
  track: TrackData,
  lateral: number
): THREE.BufferGeometry => {
  const { samples, tangents } = track;
  const n = samples.length;
  const pos = new Float32Array(n * 2 * 3);
  const up = new THREE.Vector3(0, 1, 0);
  const side = new THREE.Vector3();
  for (let i = 0; i < n; i++) {
    side.crossVectors(up, tangents[i]).setY(0).normalize();
    const p = samples[i];
    const cx = p.x + side.x * lateral;
    const cz = p.z + side.z * lateral;
    pos[i * 6] = cx;
    pos[i * 6 + 1] = p.y + 0.015;
    pos[i * 6 + 2] = cz;
    pos[i * 6 + 3] = cx;
    pos[i * 6 + 4] = -0.12;
    pos[i * 6 + 5] = cz;
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
    if (angle < 0.1 || acc < 1.4) continue;
    acc = 0;
    count++;
    side.crossVectors(up, tangents[i]).setY(0).normalize();
    const rotY = Math.atan2(tangents[i].x, tangents[i].z);
    for (const s of [1, -1]) {
      slabs.push({
        position: new THREE.Vector3(
          samples[i].x + side.x * s * 3.05,
          samples[i].y + 0.03,
          samples[i].z + side.z * s * 3.05
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
  tone: number;
  base: number;
}

const rand = (i: number, salt: number) => {
  const s = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return s - Math.floor(s);
};

// Monte Carlo apartment blocks: dense on the hill side (north-west of the
// circuit), nothing in the harbour.
export const cityBlocks = (track: TrackData): CityBlock[] => {
  const blocks: CityBlock[] = [];
  let i = 0;
  for (let gx = -28; gx < 100; gx += 9) {
    for (let gz = -50; gz < 80; gz += 9) {
      i++;
      if (rand(i, 1) < 0.3) continue;
      const x = gx + rand(i, 2) * 6;
      const z = gz + rand(i, 3) * 6;
      // the harbour basin stays clear
      if (x > 36 && x < 86 && z > -26 && z < 12) continue;
      let clear = true;
      let nearestD = Infinity;
      let nearestY = 0;
      for (let s = 0; s < track.samples.length; s += 10) {
        const p = track.samples[s];
        const d = (p.x - x) ** 2 + (p.z - z) ** 2;
        if (d < nearestD) {
          nearestD = d;
          nearestY = p.y;
        }
        if (d < 13 * 13) {
          clear = false;
          break;
        }
      }
      if (!clear) continue;
      // terrace into the hillside: blocks near the climb sit on the slope
      const proximity = Math.max(0, 1 - Math.sqrt(nearestD) / 45);
      blocks.push({
        x,
        z,
        w: 4.5 + rand(i, 4) * 5,
        d: 4.5 + rand(i, 5) * 5,
        h: 3 + rand(i, 6) * 10,
        tone: Math.floor(rand(i, 7) * 5),
        base: Math.max(0, nearestY * proximity - 1),
      });
    }
  }
  return blocks;
};

export interface Yacht {
  x: number;
  z: number;
  l: number;
  rot: number;
}

export const yachts = (): Yacht[] =>
  Array.from({ length: 12 }).map((_, i) => ({
    x: 46 + rand(i + 1, 11) * 32,
    z: -20 + rand(i + 1, 12) * 26,
    l: 2.5 + rand(i + 1, 13) * 4,
    rot: rand(i + 1, 14) * Math.PI,
  }));
