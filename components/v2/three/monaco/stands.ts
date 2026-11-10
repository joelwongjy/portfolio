import * as THREE from "three";

import { City, trackPose } from "./city";
import { Builder, PIT_HALF, pitLanePoints } from "./pit";
import { BARRIER } from "./track";

// Temporary grandstands along the circuit, and parasols with sun loungers
// around the Stade Nautique pool — the details that make the harbour read
// as race weekend.

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

/** true where a building stands (bbox prefilter, then point-in-polygon) */
const builtUp = (city: City) => {
  const boxes = city.raw.buildings.map((b) => {
    let x0 = Infinity;
    let x1 = -Infinity;
    let z0 = Infinity;
    let z1 = -Infinity;
    for (let k = 0; k < b.p.length; k += 2) {
      x0 = Math.min(x0, b.p[k] / 10);
      x1 = Math.max(x1, b.p[k] / 10);
      z0 = Math.min(z0, b.p[k + 1] / 10);
      z1 = Math.max(z1, b.p[k + 1] / 10);
    }
    return { x0, x1, z0, z1, p: b.p };
  });
  return (x: number, z: number) =>
    boxes.some((b) => x >= b.x0 && x <= b.x1 && z >= b.z0 && z <= b.z1 && pointInRing(x, z, b.p));
};

// Monaco's stands, by lap distance (m): K along the harbour by the pool,
// T at Tabac, and the one overlooking La Rascasse
const STANDS: [number, number][] = [
  [2440 - 262, 2520 - 262],
  [2640 - 262, 2770 - 262],
  [3080 - 262, 3150 - 262],
];

const ROWS = 8;
const ROW_D = 0.85;
const ROW_H = 0.55;

export const grandstandGeometry = (city: City) => {
  const occupied = builtUp(city);
  const pit = pitLanePoints(city);
  const b = new Builder();
  const pose = { x: 0, y: 0, z: 0, tx: 0, tz: 0 };
  const depth = ROWS * ROW_D + 1.2;
  STANDS.forEach(([d0, d1]) => {
    // build each 6 m section on whichever side has open land for it,
    // preferring the side most of the stand fits on
    const fits = (d: number, side: number) => {
      trackPose(city.track, d, pose);
      const rx = -pose.tz;
      const rz = pose.tx;
      for (const lat of [BARRIER + 1.5, BARRIER + 1.5 + depth / 2, BARRIER + 1.5 + depth]) {
        for (const du of [-3, 3]) {
          const x = pose.x + rx * side * lat + pose.tx * du;
          const z = pose.z + rz * side * lat + pose.tz * du;
          if (city.isSea(x, z) || occupied(x, z)) return false;
          const nt = city.nearTrack(x, z);
          if (nt.d < BARRIER + 1) return false;
          if (pit.some((p) => Math.hypot(p.x - x, p.z - z) < PIT_HALF + 2)) return false;
        }
      }
      return true;
    };
    let score = 0;
    for (let d = d0; d < d1; d += 6) score += (fits(d + 3, 1) ? 1 : 0) - (fits(d + 3, -1) ? 1 : 0);
    const side = score >= 0 ? 1 : -1;
    for (let d = d0; d < d1; d += 6) {
      if (!fits(d + 3, side)) continue;
      trackPose(city.track, d + 3, pose);
      const rx = -pose.tz;
      const rz = pose.tx;
      const lat = side * (BARRIER + 1.5);
      // frame: n points back toward the track
      const o = {
        x: pose.x + rx * lat,
        y: city.groundAt(pose.x + rx * lat, pose.z + rz * lat),
        z: pose.z + rz * lat,
        tx: pose.tx,
        tz: pose.tz,
        nx: -rx * side,
        nz: -rz * side,
      };
      for (let r = 0; r < ROWS; r++) {
        const n = -(r * ROW_D + ROW_D / 2);
        const top = (r + 1) * ROW_H;
        // the stepped concrete
        b.box(o, 0, top / 2 - 0.4, n, 6, top + 0.8, ROW_D, "#E9E9E6");
        // a row of blue seats along the step
        b.box(o, 0, top + 0.18, n + 0.12, 5.7, 0.36, 0.45, r % 4 === 3 ? "#F2F2F0" : "#2F6FD0");
      }
      // an open-air stand (the blue seats read from above), with a back wall
      b.box(o, 0, (ROWS * ROW_H + 1.4) / 2, -depth + 0.1, 6, ROWS * ROW_H + 1.4, 0.3, "#F2F2EF");
    }
  });
  return b.parts.length ? b.build() : null;
};

export interface Parasol {
  x: number;
  y: number;
  z: number;
  yaw: number;
  tone: number;
}

/** parasols every few metres around the big pools, two loungers each */
export const poolside = (city: City): Parasol[] => {
  const occupied = builtUp(city);
  const pit = pitLanePoints(city);
  const nearPit = (x: number, z: number) => pit.some((p) => Math.hypot(p.x - x, p.z - z) < PIT_HALF + 4);
  const out: Parasol[] = [];
  city.raw.areas
    .filter((a) => a.k === 4)
    .forEach((a, ai) => {
      const pts: [number, number][] = [];
      for (let k = 0; k < a.p.length; k += 2) pts.push([a.p[k] / 10, a.p[k + 1] / 10]);
      let A = 0;
      for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) A += pts[j][0] * pts[i][1] - pts[i][0] * pts[j][1];
      if (Math.abs(A) / 2 < 300) return;
      const s = A > 0 ? 1 : -1;
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        const q = pts[(i + 1) % pts.length];
        const dx = q[0] - p[0];
        const dz = q[1] - p[1];
        const L = Math.hypot(dx, dz);
        if (L < 8) continue;
        // outward normal, tested by stepping out of the polygon
        let nx = (dz / L) * s;
        let nz = (-dx / L) * s;
        const mx = (p[0] + q[0]) / 2;
        const mz = (p[1] + q[1]) / 2;
        if (pointInRing(mx + nx * 0.5, mz + nz * 0.5, a.p)) {
          nx = -nx;
          nz = -nz;
        }
        for (let t = 3; t < L - 3; t += 4.2) {
          const x = p[0] + (dx / L) * t + nx * 3.2;
          const z = p[1] + (dz / L) * t + nz * 3.2;
          if (city.isSea(x, z) || occupied(x, z) || nearPit(x, z)) continue;
          if (city.nearTrack(x, z).d < BARRIER + 2) continue;
          out.push({ x, y: city.groundAt(x, z), z, yaw: Math.atan2(nx, nz), tone: (ai + Math.round(t)) % 2 });
        }
      }
    });
  return out;
};

/** a striped parasol canopy (unit radius): stripes in a colour and white */
export const parasolGeometry = (stripe: string) => {
  const g = new THREE.ConeGeometry(1, 0.42, 12, 1, true).toNonIndexed();
  const pos = g.getAttribute("position");
  const col = new Float32Array(pos.count * 3);
  const c = new THREE.Color(stripe);
  for (let i = 0; i < pos.count; i += 3) {
    const x = (pos.getX(i) + pos.getX(i + 1) + pos.getX(i + 2)) / 3;
    const z = (pos.getZ(i) + pos.getZ(i + 1) + pos.getZ(i + 2)) / 3;
    const seg = Math.floor(((Math.atan2(z, x) + Math.PI) / (Math.PI * 2)) * 12);
    for (let k = 0; k < 3; k++) col.set(seg % 2 ? [1, 1, 1] : [c.r, c.g, c.b], (i + k) * 3);
  }
  g.setAttribute("color", new THREE.BufferAttribute(col, 3));
  g.computeVertexNormals();
  return g;
};
