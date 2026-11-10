import * as THREE from "three";

import { City, HALF_ROAD, Track } from "./city";
import { inPitGap, pitGapsFor, registerPitGaps, runsAvoiding } from "./pitLane";

// Everything that follows the circuit: the asphalt, the pavement shoulders,
// kerbs at the apexes, Armco and catch fencing, the tunnel bore and its
// cover, the grid, and the racing line the car drives.

export const SHOULDER = 4.6; // pavement beyond the road edge
export const KERB = 1.1;
export const BARRIER = HALF_ROAD + KERB + 0.5; // Armco offset from the centreline
export const TUNNEL_COVER = 7.5; // must match scripts/monaco/build.mjs
const TUNNEL_CEILING = 6.2;

const right = (t: Track, i: number) => {
  const k = (((i % t.n) + t.n) % t.n) * 2;
  return [-t.tan[k + 1], t.tan[k]] as const;
};
const P = (t: Track, i: number) => {
  const k = (((i % t.n) + t.n) % t.n) * 3;
  return [t.pos[k], t.pos[k + 1], t.pos[k + 2]] as const;
};

type Lateral = (i: number) => number;

interface StripOpts {
  from: number;
  to: number;
  inner: Lateral | number;
  outer: Lateral | number;
  y: Lateral | number;
  vScale?: number;
  worldUV?: City["bounds"];
}

const val = (v: Lateral | number, i: number) => (typeof v === "number" ? v : v(i));

/** a flat strip between two lateral offsets, facing up */
export const strip = (t: Track, o: StripOpts) => {
  const count = o.to - o.from + 1;
  const pos = new Float32Array(count * 6);
  const uv = new Float32Array(count * 4);
  const idx: number[] = [];
  for (let s = 0; s < count; s++) {
    const i = o.from + s;
    const [x, y, z] = P(t, i);
    const [rx, rz] = right(t, i);
    const a = val(o.inner, i);
    const b = val(o.outer, i);
    const yy = y + val(o.y, i);
    pos.set([x + rx * a, yy, z + rz * a, x + rx * b, yy, z + rz * b], s * 6);
    if (o.worldUV) {
      const B = o.worldUV;
      const u = (px: number, pz: number) => [(px - B.x0) / (B.x1 - B.x0), 1 - (pz - B.z0) / (B.z1 - B.z0)];
      uv.set([...u(x + rx * a, z + rz * a), ...u(x + rx * b, z + rz * b)], s * 4);
    } else {
      const v = (s * t.step) / (o.vScale ?? 1);
      uv.set([0, v, 1, v], s * 4);
    }
    if (s < count - 1) {
      const A = s * 2;
      // keep every triangle facing up whichever side of the line it's on
      if (b > a) idx.push(A, A + 1, A + 2, A + 1, A + 3, A + 2);
      else idx.push(A, A + 2, A + 1, A + 1, A + 2, A + 3);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
};

/** a vertical ribbon at a lateral offset */
export const wall = (
  t: Track,
  from: number,
  to: number,
  lateral: Lateral | number,
  y0: number,
  y1: number,
  vScale = 1
) => {
  const count = to - from + 1;
  const pos = new Float32Array(count * 6);
  const uv = new Float32Array(count * 4);
  const idx: number[] = [];
  let arc = 0;
  for (let s = 0; s < count; s++) {
    const i = from + s;
    const [x, y, z] = P(t, i);
    const [rx, rz] = right(t, i);
    const l = val(lateral, i);
    pos.set([x + rx * l, y + y0, z + rz * l, x + rx * l, y + y1, z + rz * l], s * 6);
    uv.set([arc / vScale, 0, arc / vScale, 1], s * 4);
    arc += t.step;
    if (s < count - 1) {
      const A = s * 2;
      idx.push(A, A + 2, A + 1, A + 1, A + 2, A + 3);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
};

// ——— textures ————————————————————————————————————————————————————

const canvasTex = (w: number, h: number, paint: (ctx: CanvasRenderingContext2D) => void) => {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  paint(c.getContext("2d")!);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  return tex;
};

// 12 m wide × 16 m of circuit surface in the coral map apps paint race
// tracks in, with a little grain and white edge lines
export const CORAL = "#D9857C";
export const coralSurface = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
  ctx.fillStyle = CORAL;
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < (w * h) / 22; i++) {
    const d = Math.random() < 0.5 ? -1 : 1;
    const a = 0.05 + Math.random() * 0.08;
    ctx.fillStyle = d > 0 ? `rgba(255,236,230,${a})` : `rgba(120,40,34,${a})`;
    ctx.fillRect(Math.random() * w, Math.random() * h, 1.4, 1.4);
  }
  // a faintly darker band where the cars run
  const g = ctx.createLinearGradient(0, 0, w, 0);
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(0.35, "rgba(110,36,30,0.07)");
  g.addColorStop(0.65, "rgba(110,36,30,0.07)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
};

export const asphaltTexture = () =>
  canvasTex(256, 448, (ctx) => {
    coralSurface(ctx, 256, 448);
    ctx.fillStyle = "#FBF8F6";
    ctx.fillRect(4, 0, 6, 448);
    ctx.fillRect(246, 0, 6, 448);
  });

export const kerbTexture = () => {
  const tex = canvasTex(16, 32, (ctx) => {
    ctx.fillStyle = "#B81E1A";
    ctx.fillRect(0, 0, 16, 16);
    ctx.fillStyle = "#F5F4F0";
    ctx.fillRect(0, 16, 16, 16);
  });
  tex.magFilter = THREE.NearestFilter;
  return tex;
};

export const barrierTexture = () =>
  canvasTex(64, 32, (ctx) => {
    ctx.fillStyle = "#F3F3F1";
    ctx.fillRect(0, 0, 64, 32);
    ctx.fillStyle = "#C9CDD3";
    ctx.fillRect(0, 13, 64, 6);
    ctx.fillStyle = "#9AA0A8";
    ctx.fillRect(0, 0, 64, 2);
  });

export const fenceTexture = () => {
  const tex = canvasTex(32, 32, (ctx) => {
    ctx.clearRect(0, 0, 32, 32);
    ctx.strokeStyle = "rgba(225,228,232,1)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(32, 32);
    ctx.moveTo(32, 0);
    ctx.lineTo(0, 32);
    ctx.stroke();
  });
  tex.colorSpace = THREE.NoColorSpace;
  return tex;
};

// The route line, map-app style: a solid band with a pale casing.
export const routeTexture = (color: string) =>
  canvasTex(64, 4, (ctx) => {
    ctx.fillStyle = "rgba(255,255,255,0.95)";
    ctx.fillRect(0, 0, 64, 4);
    ctx.fillStyle = color;
    ctx.fillRect(9, 0, 46, 4);
  });

// The grid: a chequered line and staggered slots painted behind it.
export const GRID_BEHIND = 120; // metres of grid behind the line
export const gridTexture = () => {
  const PXM = 12; // px per metre
  const len = GRID_BEHIND + 4;
  const tex = canvasTex(Math.round(HALF_ROAD * 2 * PXM), len * PXM, (ctx) => {
    const W = HALF_ROAD * 2 * PXM;
    ctx.clearRect(0, 0, W, len * PXM);
    // v runs along the lap and the canvas is flipped, so the line (at the
    // far end of the strip) sits near the top
    const lineY = 2 * PXM;
    const sq = 0.5 * PXM;
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < W / sq; c++) {
        ctx.fillStyle = (r + c) % 2 ? "#111" : "#F5F5F2";
        ctx.fillRect(c * sq, lineY + r * sq, sq, sq);
      }
    }
    ctx.strokeStyle = "#F5F5F2";
    ctx.lineWidth = 0.18 * PXM;
    for (let k = 0; k < 20; k++) {
      const side = k % 2 === 0 ? 0.28 : 0.72;
      const y = lineY + (k * 6 + 4) * PXM;
      const x = side * W;
      const hw = 1.3 * PXM;
      ctx.beginPath();
      ctx.moveTo(x - hw, y + 1.2 * PXM);
      ctx.lineTo(x - hw, y);
      ctx.lineTo(x + hw, y);
      ctx.lineTo(x + hw, y + 1.2 * PXM);
      ctx.stroke();
    }
  });
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.wrapS = THREE.ClampToEdgeWrapping;
  return tex;
};

// ——— the racing line ————————————————————————————————————————————

export interface RaceLine {
  n: number;
  pos: Float32Array;
  /** offset from the centreline (m, +ve right) per sample */
  lateral: Float32Array;
}

// A heavy blur of the centreline clips apexes and runs wide on entry and
// exit, then gets clamped to stay on the road.
export const raceLine = (t: Track): RaceLine => {
  const n = t.n;
  const W = 22;
  const lat = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    let ax = 0;
    let az = 0;
    for (let k = -W; k <= W; k++) {
      const [x, , z] = P(t, i + k);
      ax += x;
      az += z;
    }
    ax /= 2 * W + 1;
    az /= 2 * W + 1;
    const [x, , z] = P(t, i);
    const [rx, rz] = right(t, i);
    // exaggerate the pull toward the apex a touch, then keep it on the road
    lat[i] = THREE.MathUtils.clamp(((ax - x) * rx + (az - z) * rz) * 1.6, -(HALF_ROAD - 1.5), HALF_ROAD - 1.5);
  }
  // iron out kinks
  const sm = new Float32Array(n);
  for (let pass = 0; pass < 3; pass++) {
    for (let i = 0; i < n; i++) {
      let s = 0;
      for (let k = -6; k <= 6; k++) s += lat[(i + k + n) % n];
      sm[i] = s / 13;
    }
    lat.set(sm);
  }
  const pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const [x, y, z] = P(t, i);
    const [rx, rz] = right(t, i);
    pos.set([x + rx * lat[i], y, z + rz * lat[i]], i * 3);
  }
  return { n, pos, lateral: lat };
};

const mergeStrips = (geos: THREE.BufferGeometry[]) => {
  const pos: number[] = [];
  const idx: number[] = [];
  geos.forEach((g) => {
    const base = pos.length / 3;
    Array.prototype.push.apply(pos, Array.from(g.getAttribute("position").array));
    const ix = g.getIndex()!;
    for (let i = 0; i < ix.count; i++) idx.push(base + ix.getX(i));
    g.dispose();
  });
  const out = new THREE.BufferGeometry();
  out.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  out.setIndex(idx);
  out.computeVertexNormals();
  return out;
};

// merge vertical ribbons (position + uv) into one geometry
const mergeWalls = (geos: THREE.BufferGeometry[]) => {
  const pos: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  geos.forEach((g) => {
    const base = pos.length / 3;
    Array.prototype.push.apply(pos, Array.from(g.getAttribute("position").array));
    Array.prototype.push.apply(uv, Array.from(g.getAttribute("uv").array));
    const ix = g.getIndex()!;
    for (let i = 0; i < ix.count; i++) idx.push(base + ix.getX(i));
    g.dispose();
  });
  const out = new THREE.BufferGeometry();
  out.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  out.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  out.setIndex(idx);
  out.computeVertexNormals();
  return out;
};

// ——— assembled geometry ————————————————————————————————————————————

export const trackGeometries = (city: City) => {
  const t = city.track;
  const n = t.n;
  const [ta, tb] = t.tunnel;
  const inTunnel = (i: number) => i >= ta && i <= tb;

  const road = strip(t, { from: 0, to: n, inner: -HALF_ROAD, outer: HALF_ROAD, y: 0.02, vScale: 16 });
  const shoulderL = strip(t, {
    from: 0,
    to: n,
    inner: -HALF_ROAD,
    outer: -(HALF_ROAD + SHOULDER),
    y: 0,
    worldUV: city.bounds,
  });
  const shoulderR = strip(t, {
    from: 0,
    to: n,
    inner: HALF_ROAD,
    outer: HALF_ROAD + SHOULDER,
    y: 0,
    worldUV: city.bounds,
  });
  const skirtL = wall(t, 0, n, -(HALF_ROAD + SHOULDER), -3, 0);
  const skirtR = wall(t, 0, n, HALF_ROAD + SHOULDER, -3, 0);

  const kerbs = kerbGeometries(t);

  // Armco everywhere; catch fencing everywhere but the tunnel. Both stay
  // open where the pit lane leaves and rejoins the circuit.
  const gaps = registerPitGaps(city);
  const sideRuns = (side: 1 | -1, a: number, b: number) => runsAvoiding(gaps, side, a, b, n);
  const barrierRuns = ([1, -1] as const).flatMap((side) =>
    sideRuns(side, 0, n).map(([a, b]) => wall(t, a, b, side * BARRIER, 0, 1.05, 4))
  );
  const barrierL = mergeWalls(barrierRuns);
  const fenceRuns: THREE.BufferGeometry[] = [];
  const pushFence = (a: number, b: number) => {
    ([1, -1] as const).forEach((side) =>
      sideRuns(side, a, b).forEach(([x, y]) => fenceRuns.push(wall(t, x, y, side * BARRIER, 1.05, 3.9, 0.35)))
    );
  };
  pushFence(0, ta - 2);
  pushFence(tb + 2, n);

  // the tunnel: bore walls, ceiling, light strips, the cover over it and
  // portal headwalls at each end
  const tunnelWallL = wall(t, ta, tb, -(HALF_ROAD + 1.2), -0.1, TUNNEL_CEILING);
  const tunnelWallR = wall(t, ta, tb, HALF_ROAD + 1.2, -0.1, TUNNEL_CEILING);
  const ceiling = strip(t, {
    from: ta,
    to: tb,
    inner: HALF_ROAD + 1.2,
    outer: -(HALF_ROAD + 1.2),
    y: TUNNEL_CEILING,
  });
  // flip it to face down into the bore
  const ci = ceiling.getIndex()!;
  for (let i = 0; i < ci.count; i += 3) {
    const a = ci.getX(i + 1);
    ci.setX(i + 1, ci.getX(i + 2));
    ci.setX(i + 2, a);
  }
  ceiling.computeVertexNormals();
  // rows of light fittings along the roof, one every 6 m
  const fittings: THREE.BufferGeometry[] = [];
  for (let i = ta + 1; i < tb - 1; i += 3) {
    fittings.push(strip(t, { from: i, to: i + 1, inner: -2.6, outer: -2.2, y: TUNNEL_CEILING - 0.05 }));
    fittings.push(strip(t, { from: i, to: i + 1, inner: 2.2, outer: 2.6, y: TUNNEL_CEILING - 0.05 }));
  }
  const lightsL = mergeStrips(fittings.filter((_, k) => k % 2 === 0));
  const lightsR = mergeStrips(fittings.filter((_, k) => k % 2 === 1));
  [lightsL, lightsR].forEach((g) => {
    const ix = g.getIndex()!;
    for (let i = 0; i < ix.count; i += 3) {
      const a = ix.getX(i + 1);
      ix.setX(i + 1, ix.getX(i + 2));
      ix.setX(i + 2, a);
    }
  });
  const cover = strip(t, {
    from: ta - 1,
    to: tb + 1,
    inner: -(HALF_ROAD + SHOULDER + 0.5),
    outer: HALF_ROAD + SHOULDER + 0.5,
    y: TUNNEL_COVER,
    worldUV: city.bounds,
  });
  const portal = (i: number, facing: 1 | -1) => {
    const [x, y, z] = P(t, i);
    const [rx, rz] = right(t, i);
    const w = 15;
    const geo = new THREE.PlaneGeometry(w * 2, TUNNEL_COVER + 2.5 - TUNNEL_CEILING + 0.6);
    const k = (((i % n) + n) % n) * 2;
    const yaw = Math.atan2(t.tan[k] * facing, t.tan[k + 1] * facing);
    geo.rotateY(yaw);
    geo.translate(x, y + (TUNNEL_CEILING - 0.6 + TUNNEL_COVER + 2.5) / 2, z);
    void rx;
    void rz;
    return geo;
  };
  const portals = [portal(ta, -1), portal(tb, 1)];

  // the grid and start line
  const gridFrom = n - Math.round(GRID_BEHIND / t.step);
  const grid = strip(t, {
    from: gridFrom,
    to: n + 2,
    inner: -HALF_ROAD,
    outer: HALF_ROAD,
    y: 0.04,
    vScale: GRID_BEHIND + 4,
  });

  return {
    road,
    shoulders: [shoulderL, shoulderR],
    skirts: [skirtL, skirtR],
    kerbs,
    barriers: [barrierL],
    fences: fenceRuns,
    tunnel: { walls: [tunnelWallL, tunnelWallR], ceiling, lights: [lightsL, lightsR], cover, portals },
    grid,
    inTunnel,
  };
};

// ——— kerbs ——————————————————————————————————————————————————————

interface KerbRun {
  from: number;
  to: number;
  side: 1 | -1;
}

// Corners from the smoothed curvature: contiguous runs of one hand, small
// gaps bridged, slivers dropped. Every corner gets an apex kerb on the
// inside; the tight ones also get an exit kerb on the outside, as at a real
// circuit.
export const kerbRuns = (t: Track): KerbRun[] => {
  const n = t.n;
  const ON = 1 / 75;
  const runs: { from: number; to: number; side: 1 | -1; peak: number }[] = [];
  let cur: (typeof runs)[number] | null = null;
  for (let i = 0; i < n; i++) {
    const c = t.curv[i];
    const side = (Math.sign(c) || 1) as 1 | -1;
    if (Math.abs(c) > ON) {
      if (cur && cur.side === side && i - cur.to <= 10) {
        cur.to = i;
        cur.peak = Math.max(cur.peak, Math.abs(c));
      } else {
        if (cur) runs.push(cur);
        cur = { from: i, to: i, side, peak: Math.abs(c) };
      }
    }
  }
  if (cur) runs.push(cur);
  const out: KerbRun[] = [];
  runs
    .filter((r) => r.to - r.from >= 5 || r.peak > 1 / 22)
    .forEach((r) => {
      // apex kerb, starting a little before turn-in and running past the apex
      out.push({ from: r.from - 3, to: r.to + 3, side: r.side });
      if (r.peak > 1 / 32) {
        const mid = Math.round((r.from + r.to) / 2);
        out.push({ from: mid, to: r.to + 9, side: (-r.side) as 1 | -1 });
      }
    });
  // merge overlapping runs on the same side so no kerb is drawn twice
  const merged: KerbRun[] = [];
  ([1, -1] as const).forEach((side) => {
    const list = out.filter((r) => r.side === side).sort((a, b) => a.from - b.from);
    list.forEach((r) => {
      const last = merged[merged.length - 1];
      if (last && last.side === side && r.from <= last.to + 4) last.to = Math.max(last.to, r.to);
      else merged.push({ ...r });
    });
  });
  return merged;
};

// Each kerb is an even 1.1 m band with angled ends, gently crowned, and
// striped in whole 1 m red/white blocks so a run never ends on a sliver.
export const kerbGeometries = (t: Track) =>
  kerbRuns(t).map(({ from, to, side }) => {
    const count = to - from + 1;
    const len = (count - 1) * t.step;
    const pairs = Math.max(1, Math.round(len / 2));
    const vPer = pairs / len; // stripe pairs per metre
    const ROWS = 3; // inner edge, crown, outer edge
    const pos = new Float32Array(count * ROWS * 3);
    const uv = new Float32Array(count * ROWS * 2);
    const idx: number[] = [];
    const TAPER = 4; // samples (8 m) to reach full width
    for (let s = 0; s < count; s++) {
      const i = from + s;
      const [x, y, z] = P(t, i);
      const [rx, rz] = right(t, i);
      const ramp = Math.min(1, Math.min(s, count - 1 - s) / TAPER);
      const w = KERB * (0.25 + 0.75 * Math.sin((ramp * Math.PI) / 2));
      const v = s * t.step * vPer;
      for (let r = 0; r < ROWS; r++) {
        const f = r / (ROWS - 1);
        const lat = side * (HALF_ROAD + w * f);
        const lift = 0.04 + Math.sin(f * Math.PI) * 0.05 * ramp;
        pos.set([x + rx * lat, y + lift, z + rz * lat], (s * ROWS + r) * 3);
        uv.set([f, v], (s * ROWS + r) * 2);
      }
      if (s < count - 1) {
        for (let r = 0; r < ROWS - 1; r++) {
          const A = s * ROWS + r;
          const B = A + ROWS;
          // faces up on either side of the road
          if (side > 0) idx.push(A, A + 1, B, A + 1, B + 1, B);
          else idx.push(A, B, A + 1, A + 1, B, B + 1);
        }
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    return geo;
  });

/** fence posts every few metres (instance transforms) */
export const fencePosts = (t: Track, every = 3) => {
  const [ta, tb] = t.tunnel;
  const gaps = pitGapsFor(t);
  const out: { x: number; y: number; z: number }[] = [];
  for (let i = 0; i < t.n; i += every) {
    if (i >= ta - 2 && i <= tb + 2) continue;
    const [x, y, z] = P(t, i);
    const [rx, rz] = right(t, i);
    if (!inPitGap(gaps, 1, i)) out.push({ x: x + rx * BARRIER, y, z: z + rz * BARRIER });
    if (!inPitGap(gaps, -1, i)) out.push({ x: x - rx * BARRIER, y, z: z - rz * BARRIER });
  }
  return out;
};

/** the route ribbon along the racing line; draw range = progress */
export const routeGeometry = (line: RaceLine) => {
  const n = line.n;
  const pos = new Float32Array((n + 1) * 6);
  const uv = new Float32Array((n + 1) * 4);
  const idx: number[] = [];
  const w = 0.85;
  for (let s = 0; s <= n; s++) {
    const i = s % n;
    const a = ((i - 1 + n) % n) * 3;
    const b = ((i + 1) % n) * 3;
    let tx = line.pos[b] - line.pos[a];
    let tz = line.pos[b + 2] - line.pos[a + 2];
    const l = Math.hypot(tx, tz) || 1;
    tx /= l;
    tz /= l;
    const rx = -tz;
    const rz = tx;
    const x = line.pos[i * 3];
    const y = line.pos[i * 3 + 1] + 0.07;
    const z = line.pos[i * 3 + 2];
    pos.set([x - rx * w, y, z - rz * w, x + rx * w, y, z + rz * w], s * 6);
    uv.set([0, 0, 1, 0], s * 4);
    if (s < n) {
      const A = s * 2;
      idx.push(A, A + 1, A + 2, A + 1, A + 3, A + 2);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
};
