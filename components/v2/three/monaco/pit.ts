import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

import { City } from "./city";
import { PIT_HALF, pitCentreline } from "./pitLane";
import { BARRIER } from "./track";

export { PIT_HALF } from "./pitLane";

// The pit complex along "Voie des stands", after the real one: a row of
// team garages between the pit lane and the start straight, each with an
// open ground floor (two cars parked inside, nose out), a hospitality level
// of leaning dark glass in white frames over a curved balcony, red roof
// trim and a chequered band; across the lane, the pit wall with each
// team's stand.
//
// CONTRACT used by the camera and the app (keep the signature and meaning):
//   projectGarages(city, count) → one anchor per project garage, in project
//   order. (x, y, z) is the middle of the garage door at ground level;
//   (nx, nz) is the unit vector pointing out of the door across the pit
//   lane; (tx, tz) is the unit vector along the pit lane toward the pit
//   exit. depth is door → back wall (m), width the door opening (m), and
//   screenY the height (m above the floor) of the centre of the project
//   screen on the back wall.

export interface GarageAnchor {
  x: number;
  y: number;
  z: number;
  nx: number;
  nz: number;
  tx: number;
  tz: number;
  depth: number;
  width: number;
  screenY: number;
  /** the back-wall screen's size (m); its centre is screenY up and
   * depth − inset back from the door */
  screenW: number;
  screenH: number;
  screenInset: number;
}

export const WORKING_LANE = 3.6; // the garage-side lane where cars stop
const BAY = 4.8; // one garage bay; each team has two
const TEAMS = 10;
const MIN_DEPTH = 6.5;
const MAX_DEPTH = 13;
export const GROUND_FLOOR = 4.4; // ground-floor height
export const UNIT_W = BAY * 2 - 0.3; // a team's building, with a slot either side
// the back-wall screen in a project garage; the app pins live web content
// onto it, so it is sized for reading from the pit lane
export const SCREEN = { w: 7.4, h: 2.85, y: 2.6, inset: 0.33 };
// which team slots (in lap order) belong to the projects
const PROJECT_SLOTS = [3, 4, 5, 6];

// generic team colours (no real teams)
export const TEAM_COLORS = [
  "#1E2B5C",
  "#C8102E",
  "#FF8A00",
  "#00A19B",
  "#B9BEC6",
  "#0B6E4F",
  "#2E5BFF",
  "#FF7BB6",
  "#5CC8F0",
  "#2B2B2F",
];

/** the lane's centreline points, smoothed into the circuit at both ends */
export const pitLanePoints = (city: City) => pitCentreline(city).pts;

export interface Frame {
  x: number;
  y: number;
  z: number;
  /** along the lane toward the exit */
  tx: number;
  tz: number;
  /** right of travel */
  rx: number;
  rz: number;
  /** half-width of the lane here */
  half: number;
}

/** the pit lane as an arc-length parametrised polyline */
const lane = (city: City) => {
  const c = pitCentreline(city);
  const pts = c.pts;
  const STEP = 2;
  const at = (d: number): Frame => {
    const s = THREE.MathUtils.clamp(d / STEP, 0, Math.max(0, pts.length - 1.001));
    const i = Math.floor(s);
    const f = s - i;
    const a = pts[i];
    const b = pts[Math.min(pts.length - 1, i + 1)];
    const p0 = pts[Math.max(0, i - 2)];
    const p1 = pts[Math.min(pts.length - 1, i + 3)];
    let tx = p1.x - p0.x;
    let tz = p1.z - p0.z;
    const l = Math.hypot(tx, tz) || 1;
    tx /= l;
    tz /= l;
    return {
      x: a.x + (b.x - a.x) * f,
      y: a.y + (b.y - a.y) * f,
      z: a.z + (b.z - a.z) * f,
      tx,
      tz,
      rx: -tz,
      rz: tx,
      half: a.half + (b.half - a.half) * f,
    };
  };
  return { length: c.length, at, entryClear: c.entryClear, exitClear: c.exitClear };
};

/** distance from a point to the start straight's centreline */
const straightDistance = (city: City) => {
  const t = city.track;
  const idx: number[] = [];
  for (let i = 0; i < t.n; i++) if (i > t.n - 170 || i < 230) idx.push(i);
  return (x: number, z: number) => {
    let best = Infinity;
    let bi = 0;
    for (const i of idx) {
      const d = Math.hypot(t.pos[i * 3] - x, t.pos[i * 3 + 2] - z);
      if (d < best) {
        best = d;
        bi = i;
      }
    }
    return { d: best, x: t.pos[bi * 3], z: t.pos[bi * 3 + 2] };
  };
};

export interface Team {
  /** lane distance of the team's centre */
  d: number;
  depth: number;
  color: string;
  project: number;
}

export interface PitLayout {
  length: number;
  at: (d: number) => Frame;
  entryClear: number;
  exitClear: number;
  /** +1 if the garages are to the right of travel, −1 if left */
  side: number;
  teams: Team[];
}

const layoutCache = new WeakMap<City, PitLayout>();

export const pitLayout = (city: City): PitLayout => {
  const hit = layoutCache.get(city);
  if (hit) return hit;
  const L = lane(city);
  const toStraight = straightDistance(city);
  if (L.length < 40) {
    const empty = { length: 0, at: L.at, entryClear: 0, exitClear: 0, side: 1, teams: [] };
    layoutCache.set(city, empty);
    return empty;
  }
  // the garages stand between the lane and the start straight
  const mid = L.at(L.length * 0.6);
  const sp = toStraight(mid.x, mid.z);
  const side = (sp.x - mid.x) * mid.rx + (sp.z - mid.z) * mid.rz > 0 ? 1 : -1;

  // room behind a garage door, back to the straight's barrier
  const room = (d: number) => {
    const f = L.at(d);
    const door = PIT_HALF + 0.4;
    let r = 0;
    for (let k = -1; k <= 1; k++) {
      const g = L.at(d + k * BAY * 0.9);
      const v = toStraight(g.x + g.rx * side * door, g.z + g.rz * side * door).d - (BARRIER + 1.4);
      r = k === -1 ? v : Math.min(r, v);
    }
    void f;
    return Math.min(MAX_DEPTH, r);
  };
  const SPAN = BAY * 2;
  const candidates: { d: number; depth: number }[] = [];
  for (let d = L.entryClear + 14; d < L.exitClear - 14; d += SPAN) candidates.push({ d, depth: room(d) });
  // the longest run of team plots deep enough to build
  let best = { a: 0, b: -1 };
  let start = -1;
  candidates.forEach((c, i) => {
    if (c.depth >= MIN_DEPTH) {
      if (start < 0) start = i;
      if (i - start > best.b - best.a) best = { a: start, b: i };
    } else start = -1;
  });
  const run = candidates.slice(best.a, best.b + 1);
  const count = Math.min(TEAMS, run.length);
  const first = Math.floor((run.length - count) / 2);
  const chosen = run.slice(first, first + count);
  const teams: Team[] = chosen.map((c, t) => ({
    d: c.d,
    depth: c.depth,
    color: TEAM_COLORS[t % TEAM_COLORS.length],
    project: PROJECT_SLOTS.indexOf(t),
  }));
  const layout: PitLayout = {
    length: L.length,
    at: L.at,
    entryClear: L.entryClear,
    exitClear: L.exitClear,
    side,
    teams,
  };
  layoutCache.set(city, layout);
  return layout;
};

/** the door line of a garage: on the lane edge, facing across the lane */
export const doorFrame = (f: Frame, side: number) => ({
  x: f.x + f.rx * side * (PIT_HALF + 0.4),
  y: f.y,
  z: f.z + f.rz * side * (PIT_HALF + 0.4),
  nx: -f.rx * side,
  nz: -f.rz * side,
  tx: f.tx,
  tz: f.tz,
});

export const projectGarages = (city: City, count: number): GarageAnchor[] => {
  const layout = pitLayout(city);
  const out: GarageAnchor[] = [];
  layout.teams.forEach((t) => {
    if (t.project < 0 || t.project >= count) return;
    out[t.project] = {
      ...doorFrame(layout.at(t.d), layout.side),
      depth: t.depth,
      width: UNIT_W - 0.5,
      screenY: SCREEN.y,
      screenW: SCREEN.w,
      screenH: SCREEN.h,
      screenInset: SCREEN.inset,
    };
  });
  return out.filter(Boolean);
};

/** the cars, two per team, parked inside the garages nose-out */
export const garageCars = (city: City) => {
  const layout = pitLayout(city);
  const out: { x: number; y: number; z: number; yaw: number; color: string; project: number }[] = [];
  layout.teams.forEach((t) => {
    const o = doorFrame(layout.at(t.d), layout.side);
    const back = t.depth >= 9 ? 4.4 : t.depth / 2;
    [-BAY / 2, BAY / 2].forEach((u) => {
      out.push({
        x: o.x + o.tx * u - o.nx * back,
        y: o.y,
        z: o.z + o.tz * u - o.nz * back,
        yaw: Math.atan2(o.nx, o.nz),
        color: t.color,
        project: t.project,
      });
    });
  });
  return out;
};

/** each bay's painted box on the working lane */
export const pitBoxes = (city: City) => {
  const layout = pitLayout(city);
  const out: { x: number; y: number; z: number; yaw: number; color: string; project: number }[] = [];
  layout.teams.forEach((t) => {
    [-BAY / 2, BAY / 2].forEach((u) => {
      const f = layout.at(t.d + u);
      const lat = layout.side * (PIT_HALF - WORKING_LANE / 2);
      out.push({
        x: f.x + f.rx * lat,
        y: f.y,
        z: f.z + f.rz * lat,
        yaw: Math.atan2(f.tx, f.tz),
        color: t.color,
        project: t.project,
      });
    });
  });
  return out;
};

// ——— geometry ——————————————————————————————————————————————————————

export class Builder {
  parts: THREE.BufferGeometry[] = [];
  private m = new THREE.Matrix4();
  private basis = new THREE.Matrix4();
  private tilt = new THREE.Matrix4();
  private c = new THREE.Color();

  /** a geometry placed in a garage's frame (see box) and painted one colour */
  place(
    g: THREE.BufferGeometry,
    o: { x: number; y: number; z: number; tx: number; tz: number; nx: number; nz: number },
    u: number,
    y: number,
    n: number,
    color: string,
    lean = 0
  ) {
    if (g.getAttribute("uv")) g.deleteAttribute("uv");
    if (g.index) {
      const ni = g.toNonIndexed();
      g.dispose();
      g = ni;
    }
    // local axes: X = along, Y = up, Z = out of the door. Keep it
    // right-handed: Z must equal X × Y.
    const zx = -o.tz;
    const zz = o.tx;
    const flip = zx * o.nx + zz * o.nz > 0 ? 1 : -1;
    this.basis.makeBasis(
      new THREE.Vector3(o.tx * flip, 0, o.tz * flip),
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(o.nx, 0, o.nz)
    );
    this.tilt.makeRotationX(lean);
    this.m
      .makeTranslation(o.x + o.tx * u + o.nx * n, o.y + y, o.z + o.tz * u + o.nz * n)
      .multiply(this.basis)
      .multiply(this.tilt);
    g.applyMatrix4(this.m);
    this.c.set(color);
    const count = g.getAttribute("position").count;
    const col = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) col.set([this.c.r, this.c.g, this.c.b], i * 3);
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    this.parts.push(g);
  }

  /**
   * A box in a garage's frame: u along the lane, y up, n out of the door
   * (toward the lane). `lean` tips the top toward +n (radians).
   */
  box(
    o: { x: number; y: number; z: number; tx: number; tz: number; nx: number; nz: number },
    u: number,
    y: number,
    n: number,
    w: number,
    h: number,
    d: number,
    color: string,
    lean = 0
  ) {
    this.place(new THREE.BoxGeometry(w, h, d), o, u, y, n, color, lean);
  }

  build() {
    const g = mergeGeometries(this.parts, false);
    this.parts.forEach((p) => p.dispose());
    this.parts = [];
    g.computeVertexNormals();
    g.computeBoundingSphere();
    return g;
  }
}

const WHITE = "#F1F1EE";
const UPPER = "#DADDE1";
const GLASS = "#1F2A38";
const ROOF = "#C8372D";
const FLOOR = "#A9ADB3";
const CEIL = "#E4E5E7";

const dim = (hex: string, k: number) => "#" + new THREE.Color(hex).multiplyScalar(k).getHexString();

/** the garage row: ground floor, hospitality level, roof and trim */
export const garageGeometry = (city: City) => {
  const layout = pitLayout(city);
  const b = new Builder();
  const H = GROUND_FLOOR;
  const W = UNIT_W;
  layout.teams.forEach((team, ti) => {
    const o = doorFrame(layout.at(team.d), layout.side);
    const D = team.depth;
    const project = team.project >= 0;
    // ——— ground floor: an open garage ———
    b.box(o, 0, 0.03, -D / 2, W - 0.3, 0.06, D, FLOOR);
    b.box(o, 0, H / 2 - 0.5, -D + 0.15, W, H + 1, 0.3, project ? "#20232B" : dim(team.color, 0.55));
    [-1, 1].forEach((sgn) => {
      b.box(o, sgn * (W / 2 - 0.15), H / 2 - 0.5, -D / 2, 0.3, H + 1, D, WHITE);
      // team-colour dado along the inside walls
      b.box(o, sgn * (W / 2 - 0.32), 1.0, -D / 2 - 0.2, 0.04, 0.7, D - 0.8, project ? "#2A2D35" : team.color);
    });
    b.box(o, 0, H - 0.15, -D / 2, W, 0.3, D, CEIL);
    // ceiling light strips (project garages get switchable ones in PitComplex)
    if (!project) {
      [-BAY / 2, BAY / 2].forEach((u) => b.box(o, u, H - 0.33, -D / 2, 0.35, 0.05, D * 0.7, "#FFFFFF"));
      // the column between the two bays
      b.box(o, 0, H / 2, -0.15, 0.32, H, 0.4, WHITE);
    }
    // lintel and the team's fascia band over the door
    b.box(o, 0, H - 0.4, 0.0, W, 0.8, 0.3, WHITE);
    if (!project) b.box(o, 0, H - 0.4, 0.16, W - 0.4, 0.5, 0.04, team.color);
    // the floor-line chequered band
    const SQ = 0.31;
    const nSq = Math.floor((W + 0.2) / SQ);
    for (let k = 0; k < nSq; k++) {
      for (let r = 0; r < 2; r++) {
        const dark = (k + r) % 2 === 0;
        b.box(o, -(nSq * SQ) / 2 + SQ * (k + 0.5), H + 0.08 + r * SQ * 0.5, 1.23, SQ, SQ * 0.5, 0.04, dark ? "#1C1D21" : "#F7F7F5");
      }
    }
    // ——— hospitality level ———
    b.box(o, 0, H + 0.15, -D / 2 + 0.6, W + 0.2, 0.3, D + 1.2, WHITE);
    // the curved balcony and its railing, out over the pit lane
    const R = W * 0.36;
    const disc = new THREE.CylinderGeometry(R, R, 0.18, 28, 1, false, -Math.PI / 2, Math.PI);
    disc.scale(1, 1, 0.42);
    b.place(disc, o, 0, H + 0.38, 1.2, WHITE);
    const rail = new THREE.CylinderGeometry(R, R, 0.9, 28, 1, true, -Math.PI / 2, Math.PI);
    rail.scale(1, 1, 0.42);
    b.place(rail, o, 0, H + 0.92, 1.2, "#4F5560");
    const top = new THREE.CylinderGeometry(R + 0.03, R + 0.03, 0.07, 28, 1, true, -Math.PI / 2, Math.PI);
    top.scale(1, 1, 0.43);
    b.place(top, o, 0, H + 1.4, 1.2, "#D5D8DC");
    // the leaning glass front in its white frame, with white mullions
    const GY = H + 0.3 + 1.45;
    const LEAN = 0.2;
    b.box(o, 0, GY, 0.34, W - 0.1, 3.1, 0.08, WHITE, LEAN);
    b.box(o, 0, GY, 0.42, W - 0.7, 2.7, 0.08, GLASS, LEAN);
    [-W / 6, W / 6].forEach((u) => b.box(o, u, GY, 0.48, 0.16, 2.75, 0.06, WHITE, LEAN));
    [-1, 1].forEach((sgn) => b.box(o, sgn * (W / 2 - 0.12), GY, -0.8, 0.24, 3.1, 2.4, WHITE, LEAN));
    b.box(o, 0, GY - 0.05, -D / 2 - 0.2, W - 0.4, 3.0, D - 0.8, UPPER);
    // roof and the red trim along its leading edge
    b.box(o, 0, H + 3.35, -D / 2 + 0.25, W + 0.1, 0.25, D + 0.5, "#F3F3F1");
    b.box(o, 0, H + 3.42, 0.72, W + 0.2, 0.4, 0.75, ROOF, LEAN);
    void ti;
  });

  // ——— the pit wall across the lane, with each team's stand ———
  const L = layout;
  const wallSide = -layout.side;
  for (let d = L.entryClear + 6; d < L.exitClear - 6; d += 2) {
    const f = L.at(d + 1);
    const lat = wallSide * (PIT_HALF + 0.35);
    const o = { x: f.x + f.rx * lat, y: f.y, z: f.z + f.rz * lat, tx: f.tx, tz: f.tz, nx: f.rx * wallSide, nz: f.rz * wallSide };
    b.box(o, 0, 0.1, 0, 2.05, 1.6, 0.45, "#E9E9E6");
    b.box(o, 0, 0.92, 0, 2.05, 0.08, 0.5, "#B9BDC3");
  }
  layout.teams.forEach((team) => {
    const f = L.at(team.d);
    const lat = wallSide * (PIT_HALF + 1.6);
    const o = { x: f.x + f.rx * lat, y: f.y, z: f.z + f.rz * lat, tx: f.tx, tz: f.tz, nx: -f.rx * wallSide, nz: -f.rz * wallSide };
    // a stand facing the garage: desk, screens, a team-colour canopy
    b.box(o, 0, 0.5, 0, 3.8, 1.0, 1.8, "#2A2D33");
    b.box(o, 0, 1.35, -0.2, 3.4, 0.7, 0.12, "#11141A");
    [-1.8, 1.8].forEach((u) => b.box(o, u, 1.8, -0.7, 0.12, 2.6, 0.12, "#3A3D44"));
    b.box(o, 0, 3.1, -0.1, 4.2, 0.16, 2.4, team.color);
  });
  return b.build();
};

/** yellow box outlines on the working lane, one per bay */
export const pitBoxGeometry = (city: City) => {
  const layout = pitLayout(city);
  const b = new Builder();
  pitBoxes(city).forEach((p) => {
    const o = { x: p.x, y: p.y + 0.06, z: p.z, tx: Math.sin(p.yaw), tz: Math.cos(p.yaw), nx: 0, nz: 0 };
    o.nx = -o.tz * layout.side;
    o.nz = o.tx * layout.side;
    const Ln = 4.2;
    const Wd = WORKING_LANE - 0.6;
    const T = 0.14;
    const Y = "#F2C230";
    b.box(o, 0, 0, Wd / 2, Ln, 0.02, T, Y);
    b.box(o, 0, 0, -Wd / 2, Ln, 0.02, T, Y);
    b.box(o, Ln / 2, 0, 0, T, 0.02, Wd, Y);
    b.box(o, -Ln / 2, 0, 0, T, 0.02, Wd, Y);
  });
  // the pit entry and exit lines across the lane
  [layout.entryClear, layout.exitClear].forEach((d) => {
    const f = layout.at(d);
    const o = { x: f.x, y: f.y + 0.065, z: f.z, tx: f.tx, tz: f.tz, nx: f.rx, nz: f.rz };
    b.box(o, 0, 0, 0, 0.35, 0.02, f.half * 2, "#F6F4EF");
  });
  return b.build();
};

/**
 * The lane surface as two ribbons: the merges at each end in the circuit's
 * own coral (they're part of the road there), and the pit lane proper.
 * u runs left → right of travel.
 */
export const pitLaneGeometry = (city: City) => {
  const layout = pitLayout(city);
  const STEP = 1;
  const ribbon = (d0: number, d1: number) => {
    const n = Math.max(1, Math.floor((d1 - d0) / STEP));
    const pos = new Float32Array((n + 1) * 6);
    const uv = new Float32Array((n + 1) * 4);
    const idx: number[] = [];
    for (let k = 0; k <= n; k++) {
      const d = d0 + ((d1 - d0) * k) / n;
      const f = layout.at(d);
      const y = f.y + 0.045;
      const h = Math.max(0.02, f.half);
      pos.set([f.x - f.rx * h, y, f.z - f.rz * h, f.x + f.rx * h, y, f.z + f.rz * h], k * 6);
      const v = d / 16;
      uv.set([0, v, 1, v], k * 4);
      if (k < n) {
        const A = k * 2;
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
  const merges = mergeGeometries(
    [ribbon(0, layout.entryClear), ribbon(layout.exitClear, layout.length)],
    false
  );
  const main = ribbon(layout.entryClear, layout.exitClear);
  // skirts down both edges so the lane never floats over a dip
  const skirt = (() => {
    const pos: number[] = [];
    const idx: number[] = [];
    [-1, 1].forEach((sgn) => {
      const base = pos.length / 3;
      const n = Math.floor(layout.length / 2);
      for (let k = 0; k <= n; k++) {
        const f = layout.at(k * 2);
        const h = Math.max(0.02, f.half) * sgn;
        const x = f.x + f.rx * h;
        const z = f.z + f.rz * h;
        pos.push(x, f.y + 0.04, z, x, f.y - 2.5, z);
        if (k < n) {
          const A = base + k * 2;
          idx.push(A, A + 2, A + 1, A + 1, A + 2, A + 3);
        }
      }
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  })();
  return { merges, main, skirt };
};

// ——— a parked-car model ————————————————————————————————————————————

// One merged F1 car (nose toward +z, ~5 m long before scaling) in vertex
// colours: white panels take the instance colour, dark parts stay dark.
export const carGeometry = () => {
  const parts: THREE.BufferGeometry[] = [];
  const add = (g: THREE.BufferGeometry, x: number, y: number, z: number, color: string, rx = 0, rz = 0, s?: [number, number, number]) => {
    if (g.getAttribute("uv")) g.deleteAttribute("uv");
    if (s) g.scale(...s);
    if (rx) g.rotateX(rx);
    if (rz) g.rotateZ(rz);
    g.translate(x, y, z);
    const c = new THREE.Color(color);
    const count = g.getAttribute("position").count;
    const col = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) col.set([c.r, c.g, c.b], i * 3);
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    parts.push(g.index ? g.toNonIndexed() : g);
  };
  const BODY = "#FFFFFF";
  const DARK = "#1E1F24";
  add(new THREE.BoxGeometry(1.9, 0.08, 4.6), 0, 0.14, 0.1, DARK);
  add(new THREE.BoxGeometry(1.05, 0.5, 2.6), 0, 0.42, -0.4, BODY);
  add(new THREE.BoxGeometry(1, 0.42, 1.8), 0, 0.38, 1.6, BODY, 0.04, 0, [0.62, 0.7, 1]);
  add(new THREE.ConeGeometry(0.22, 1.1, 10), 0, 0.34, 2.9, BODY, Math.PI / 2);
  add(new THREE.BoxGeometry(2.6, 0.07, 0.85), 0, 0.16, 3.05, DARK);
  add(new THREE.BoxGeometry(2.3, 0.05, 0.45), 0, 0.24, 3.2, BODY);
  [-0.78, 0.78].forEach((x) => add(new THREE.BoxGeometry(0.55, 0.46, 2), x, 0.42, -0.5, BODY));
  add(new THREE.BoxGeometry(0.66, 0.26, 1), 0, 0.62, 0.55, DARK);
  add(new THREE.SphereGeometry(0.16, 10, 8), 0, 0.68, 0.42, "#F2F2F4");
  add(new THREE.BoxGeometry(0.4, 0.34, 0.7), 0, 0.78, -0.15, BODY);
  add(new THREE.BoxGeometry(0.5, 0.5, 1.7), 0, 0.6, -1.3, BODY, -0.1);
  add(new THREE.BoxGeometry(0.05, 0.34, 1.1), 0, 0.86, -1.5, BODY);
  add(new THREE.BoxGeometry(2.1, 0.06, 0.5), 0, 0.96, -2.18, DARK);
  add(new THREE.BoxGeometry(2.1, 0.05, 0.34), 0, 1.08, -2.3, BODY);
  [-1.05, 1.05].forEach((x) => add(new THREE.BoxGeometry(0.06, 0.52, 0.74), x, 0.86, -2.2, DARK));
  [
    { x: -1.18, z: 1.62, r: 0.4 },
    { x: 1.18, z: 1.62, r: 0.4 },
    { x: -1.22, z: -1.55, r: 0.44 },
    { x: 1.22, z: -1.55, r: 0.44 },
  ].forEach((w) => add(new THREE.CylinderGeometry(w.r, w.r, 0.42, 14), w.x, w.r, w.z, "#121216", 0, Math.PI / 2));
  const g = mergeGeometries(parts, false);
  parts.forEach((p) => p.dispose());
  g.computeVertexNormals();
  return g;
};

/** true when (x, z) is under a garage building, where the ground mesh must
 * not poke up through the garage floors */
export const underPitBuildings = (city: City) => {
  const layout = pitLayout(city);
  const rects = layout.teams.map((t) => ({ o: doorFrame(layout.at(t.d), layout.side), depth: t.depth }));
  return (x: number, z: number) =>
    rects.some(({ o, depth }) => {
      const dx = x - o.x;
      const dz = z - o.z;
      const along = dx * o.tx + dz * o.tz;
      const out = dx * o.nx + dz * o.nz;
      return Math.abs(along) <= UNIT_W / 2 + 0.6 && out <= 1.5 && out >= -depth - 1;
    });
};
