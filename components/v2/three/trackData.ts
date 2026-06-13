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
  { x: 47.5, z: 27, y: 5.4 }, // Fairmont hairpin: the slow 180
  { x: 41.5, z: 24.5, y: 5.2 },
  { x: 40.5, z: 19, y: 5 },
  { x: 45, z: 16, y: 4.6 },
  { x: 51, z: 16.5, y: 4.2 }, // down to Portier
  { x: 58, z: 18, y: 3.2 },
  { x: 61.5, z: 15.5, y: 2.4 }, // Portier (right-right)
  { x: 64.5, z: 13, y: 2.1 },
  { x: 70, z: 10.5, y: 1.9 }, // ——— tunnel entry ———
  { x: 77, z: 7.5, y: 1.7 },
  { x: 83, z: 3, y: 1.45 },
  { x: 87.5, z: -3, y: 1.15 },
  { x: 89.5, z: -10, y: 0.8 }, // ——— tunnel exit ———
  { x: 89, z: -16, y: 0.45 },
  { x: 87, z: -20, y: 0.2 }, // Nouvelle Chicane: right…
  { x: 82.5, z: -21.5, y: 0.05 }, // …flick left
  { x: 79, z: -25, y: 0 },
  { x: 74, z: -27.5, y: 0 }, // Tabac (left sweep)
  { x: 69, z: -28.8, y: 0 }, // onto the harbour front
  { x: 63.5, z: -29.4, y: 0 }, // Swimming Pool entry: hold by the water (left)…
  { x: 58.5, z: -32.2, y: 0 }, // …then flick away (right) — Virage Louis Chiron
  { x: 52.5, z: -34.6, y: 0 }, // along the pool
  { x: 46.5, z: -36.8, y: 0 }, // Piscine 2
  { x: 41.5, z: -38.4, y: 0 }, // Swimming Pool exit: right…
  { x: 37, z: -38, y: 0 }, // …left into the hook
  { x: 34, z: -34.5, y: 0 }, // La Rascasse (right hook)
  { x: 32, z: -31.5, y: 0.1 }, // Antony Noghès (right)
  { x: 28, z: -28.5, y: 0.2 },
  { x: 19, z: -27, y: 0.2 },
  { x: 9, z: -22.5, y: 0.1 },
  { x: 2, z: -15, y: 0 },
];

// the seven career corners, in lap order
const ANCHOR_PLAN_IDX = [3, 10, 13, 17, 22, 31, 38];

// tunnel runs between these plan points
const TUNNEL_RANGE: [number, number] = [24, 28];

// the Piscine pool — placed by poolPlacement() on the harbour side of the
// swimming-pool complex, between the track and the marina, like the real one.

export interface TrackData {
  curve: THREE.CatmullRomCurve3;
  length: number;
  cornerFractions: number[];
  cornerPositions: THREE.Vector3[];
  samples: THREE.Vector3[];
  tangents: THREE.Vector3[];
  tunnelFractions: [number, number];
  raceCurve: THREE.CatmullRomCurve3;
  raceSamples: THREE.Vector3[];
  raceTangents: THREE.Vector3[];
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

  // The racing line: a heavy box-blur of the centreline naturally clips
  // apexes and swings wide on entry and exit — out-in-out — then gets
  // clamped to stay on the road.
  const up = new THREE.Vector3(0, 1, 0);
  const side = new THREE.Vector3();
  const blurW = 55;
  const racePts: THREE.Vector3[] = [];
  for (let i = 0; i < N; i += 8) {
    const acc = new THREE.Vector3();
    for (let w = -blurW; w <= blurW; w++) {
      acc.add(samples[(((i + w) % N) + N) % N]);
    }
    acc.multiplyScalar(1 / (2 * blurW + 1));
    side.crossVectors(up, tangents[i]).setY(0).normalize();
    const lat = THREE.MathUtils.clamp(
      acc.sub(samples[i]).dot(side),
      -1.6,
      1.6
    );
    racePts.push(samples[i].clone().addScaledVector(side, lat));
  }
  // a light second pass irons out kinks the clamp introduced
  const smoothed = racePts.map((_, i) => {
    const a = racePts[(i - 1 + racePts.length) % racePts.length];
    const b = racePts[i];
    const c = racePts[(i + 1) % racePts.length];
    return new THREE.Vector3()
      .add(a)
      .add(b)
      .add(b)
      .add(c)
      .multiplyScalar(0.25);
  });
  const raceCurve = new THREE.CatmullRomCurve3(smoothed, true, "centripetal", 0.5);
  const raceSamples: THREE.Vector3[] = [];
  const raceTangents: THREE.Vector3[] = [];
  for (let i = 0; i <= N; i++) {
    raceSamples.push(raceCurve.getPointAt(i / N));
    raceTangents.push(raceCurve.getTangentAt(i / N));
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
    raceCurve,
    raceSamples,
    raceTangents,
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
  wallHeight = 0,
  useRaceLine = false
): THREE.BufferGeometry => {
  const samples = useRaceLine ? track.raceSamples : track.samples;
  const tangents = useRaceLine ? track.raceTangents : track.tangents;
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

// A repeating red/white stripe texture for the kerbs — bands run across the
// kerb width and alternate along its length, like a real circuit kerb.
export const kerbTexture = (): THREE.CanvasTexture => {
  const c = document.createElement("canvas");
  c.width = 8;
  c.height = 16;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#D8302B";
  ctx.fillRect(0, 0, 8, 8);
  ctx.fillStyle = "#F2F2F0";
  ctx.fillRect(0, 8, 8, 8);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.magFilter = THREE.NearestFilter;
  return tex;
};

// Continuous kerb ribbons hugging both road edges through the corners.
// Returns one geometry whose V coordinate maps to arc length so the stripe
// texture tiles neatly along the whole kerb instead of scattering boxes.
const STRIPE_LENGTH = 1.4; // world length of one red+white pair
const HALF_ROAD = 2.8; // narrow, like the real Monaco street
const KERB_WIDTH = 1.1;

export const kerbRibbon = (track: TrackData): THREE.BufferGeometry => {
  const { samples, tangents } = track;
  const n = samples.length;
  const up = new THREE.Vector3(0, 1, 0);
  const side = new THREE.Vector3();

  // mark corner samples by curvature
  const corner = new Array(n).fill(false);
  for (let i = 6; i < n - 6; i++) {
    if (tangents[i - 6].angleTo(tangents[i + 6]) > 0.05) corner[i] = true;
  }
  // dilate so kerbs start a touch before and end a touch after the apex
  const mask = corner.slice();
  for (let i = 0; i < n; i++) {
    if (!corner[i]) continue;
    for (let d = -10; d <= 10; d++) {
      const j = i + d;
      if (j >= 0 && j < n) mask[j] = true;
    }
  }

  const pos: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];

  for (const s of [1, -1]) {
    let arc = 0;
    let prevInStrip = false;
    let base = 0;
    for (let i = 0; i < n; i++) {
      if (i > 0) arc += samples[i].distanceTo(samples[i - 1]);
      if (!mask[i]) {
        prevInStrip = false;
        continue;
      }
      side.crossVectors(up, tangents[i]).setY(0).normalize();
      const p = samples[i];
      const inX = p.x + side.x * s * HALF_ROAD;
      const inZ = p.z + side.z * s * HALF_ROAD;
      const outX = p.x + side.x * s * (HALF_ROAD + KERB_WIDTH);
      const outZ = p.z + side.z * s * (HALF_ROAD + KERB_WIDTH);
      const y = p.y + 0.05;
      const v = arc / STRIPE_LENGTH;
      const row = pos.length / 3; // vertex index of this sample's inner edge
      pos.push(inX, y, inZ, outX, y, outZ);
      uv.push(0, v, 1, v);
      if (prevInStrip) {
        idx.push(base, base + 1, row, base + 1, row + 1, row);
      }
      base = row;
      prevInStrip = true;
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
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
      // the harbour basin and the swimming-pool quay stay clear of buildings
      if (x > 34 && x < 88 && z > -44 && z < 12) continue;
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
        if (d < 17 * 17) {
          clear = false;
          break;
        }
      }
      if (!clear) continue;
      // blocks near the elevated climb reach up toward the road height, but
      // there is no hillside mesh under them — so build them up from the
      // ground (base 0) to that height instead of floating them on a slope
      // that does not exist.
      const near = Math.sqrt(nearestD);
      const proximity = Math.max(0, 1 - near / 45);
      const lift = Math.max(0, nearestY * proximity - 1);
      // keep the skyline low next to the road so the chase camera never
      // dives through a tower
      const hMax = near < 26 ? 5.5 : 13;
      blocks.push({
        x,
        z,
        w: 4.5 + rand(i, 4) * 5,
        d: 4.5 + rand(i, 5) * 5,
        h: lift + Math.min(3 + rand(i, 6) * 10, hMax),
        tone: Math.floor(rand(i, 7) * 5),
        base: 0,
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

// Superyachts moored in two tidy rows along the harbour quay, kept in open
// water clear of the track and the pool — not scattered at random.
export const yachts = (): Yacht[] => {
  const out: Yacht[] = [];
  [-13, -7.5].forEach((z, r) => {
    for (let c = 0; c < 5; c++) {
      const i = r * 5 + c;
      out.push({
        x: 49 + c * 6.5 + r * 3,
        z,
        l: 4 + (i % 3),
        rot: Math.PI / 2,
      });
    }
  });
  return out;
};

export interface PoolPlacement {
  x: number;
  z: number;
  w: number;
  d: number;
  rot: number;
}

// The Stade Nautique Rainier III pool sits on the harbour side of the
// swimming-pool complex. Anchor it to the Piscine straight, align it to the
// track and push it toward the water — so it reads like the real pool tucked
// between the barriers and the marina, not floating in the infield.
export const poolPlacement = (track: TrackData): PoolPlacement => {
  const target = new THREE.Vector3(52, 0, -34);
  let bi = 0;
  let bd = Infinity;
  track.samples.forEach((p, i) => {
    const d = (p.x - target.x) ** 2 + (p.z - target.z) ** 2;
    if (d < bd) {
      bd = d;
      bi = i;
    }
  });
  const p = track.samples[bi];
  const tan = track.tangents[bi];
  const side = new THREE.Vector3()
    .crossVectors(new THREE.Vector3(0, 1, 0), tan)
    .setY(0)
    .normalize();
  // push toward the harbour (the +z side of the road)
  const sign = side.z >= 0 ? 1 : -1;
  const offset = 9;
  return {
    x: p.x + side.x * sign * offset,
    z: p.z + side.z * sign * offset,
    w: 5.5,
    d: 13,
    rot: Math.atan2(tan.x, tan.z),
  };
};
