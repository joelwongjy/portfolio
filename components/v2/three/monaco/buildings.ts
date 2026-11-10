import * as THREE from "three";

import { City } from "./city";
import { withCutaway } from "./cutaway";

// Every OSM footprint extruded to its height, merged into one mesh. A facade
// attribute (u along the wall, height above ground, kind, wall height) lets
// the shader paint floor-by-floor windows and a soft contact shadow at the
// foot of each wall without any textures.

const WALLS = [
  "#F4EEE4",
  "#F0E4D0",
  "#EBD9BD",
  "#F1DDC8",
  "#E8E5E0",
  "#F2E7C9",
  "#EACFBA",
  "#E0E4E5",
  "#F5F1EA",
];
const FLAT_ROOFS = ["#D9D5CD", "#D0CCC3", "#E3DFD7", "#CDD0D0"];
const TILE_ROOFS = ["#C9876A", "#BF7C60", "#CF9478"];

const hash = (n: number) => {
  const s = Math.sin(n * 91.3458 + 47.123) * 43758.5453;
  return s - Math.floor(s);
};

export const buildingsGeometry = (city: City) => {
  const pos: number[] = [];
  const nor: number[] = [];
  const col: number[] = [];
  const fac: number[] = [];
  const idx: number[] = [];
  const c = new THREE.Color();
  const r = new THREE.Color();

  const quad = (
    ax: number,
    az: number,
    bx: number,
    bz: number,
    y0: number,
    y1: number,
    nx: number,
    nz: number,
    u0: number,
    u1: number,
    g: number,
    kind: number,
    color: THREE.Color
  ) => {
    const v = pos.length / 3;
    const h = y1 - y0;
    pos.push(ax, y0, az, bx, y0, bz, bx, y1, bz, ax, y1, az);
    for (let k = 0; k < 4; k++) {
      nor.push(nx, 0, nz);
      col.push(color.r, color.g, color.b);
    }
    const g0 = y0 - g;
    const g1 = y1 - g;
    fac.push(u0, g0, kind, h, u1, g0, kind, h, u1, g1, kind, h, u0, g1, kind, h);
    idx.push(v, v + 2, v + 1, v, v + 3, v + 2);
  };

  const cap = (pts: THREE.Vector2[], y: number, color: THREE.Color) => {
    const v = pos.length / 3;
    pts.forEach((p) => {
      pos.push(p.x, y, p.y);
      nor.push(0, 1, 0);
      col.push(color.r, color.g, color.b);
      fac.push(0, 99, -1, 0);
    });
    const tris = THREE.ShapeUtils.triangulateShape(pts, []);
    tris.forEach(([a, b, d]) => {
      // wind every triangle to face up
      const pa = pts[a];
      const pb = pts[b];
      const pd = pts[d];
      const ny = (pb.y - pa.y) * (pd.x - pa.x) - (pb.x - pa.x) * (pd.y - pa.y);
      if (ny > 0) idx.push(v + a, v + b, v + d);
      else idx.push(v + a, v + d, v + b);
    });
  };

  const box = (cx: number, cz: number, w: number, d: number, y0: number, y1: number, rot: number, color: THREE.Color) => {
    const cs = Math.cos(rot);
    const sn = Math.sin(rot);
    const corner = (sx: number, sz: number) =>
      new THREE.Vector2(cx + (sx * w * cs - sz * d * sn) / 2, cz + (sx * w * sn + sz * d * cs) / 2);
    const pts = [corner(-1, -1), corner(1, -1), corner(1, 1), corner(-1, 1)];
    walls(pts, y0, y1, y0, 0, color);
    cap(pts, y1, color);
  };

  function walls(pts: THREE.Vector2[], y0: number, y1: number, g: number, kind: number, color: THREE.Color) {
    let A = 0;
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      const q = pts[(i + 1) % pts.length];
      A += p.x * q.y - q.x * p.y;
    }
    const s = A > 0 ? 1 : -1;
    let u = 0;
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      const q = pts[(i + 1) % pts.length];
      const dx = q.x - p.x;
      const dz = q.y - p.y;
      const l = Math.hypot(dx, dz);
      if (l < 0.05) continue;
      const nx = (dz / l) * s;
      const nz = (-dx / l) * s;
      // emit so the face points along the outward normal
      if (s > 0) quad(p.x, p.y, q.x, q.y, y0, y1, nx, nz, u, u + l, g, kind, color);
      else quad(q.x, q.y, p.x, p.y, y0, y1, nx, nz, u + l, u, g, kind, color);
      u += l;
    }
  }

  city.raw.buildings.forEach((b, bi) => {
    const pts: THREE.Vector2[] = [];
    for (let i = 0; i < b.p.length; i += 2) {
      const v = new THREE.Vector2(b.p[i] / 10, b.p[i + 1] / 10);
      const last = pts[pts.length - 1];
      if (!last || last.distanceToSquared(v) > 0.01) pts.push(v);
    }
    if (pts.length < 3) return;
    const base = b.b / 10;
    const top = b.t / 10;
    const ground = b.k === 3 ? base : base + 1.5;
    let A = 0;
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      const q = pts[(i + 1) % pts.length];
      A += p.x * q.y - q.x * p.y;
    }
    const area = Math.abs(A) / 2;
    const h1 = hash(bi);
    const h2 = hash(bi + 0.5);

    if (b.c) {
      // OSM colours can be loud; keep them as a pastel hint of the real one
      c.set(WALLS[Math.floor(h1 * WALLS.length)]);
      const tint = new THREE.Color();
      try {
        tint.set(b.c);
        c.lerp(tint, 0.3);
      } catch {
        /* unparseable colour */
      }
    } else if (b.k === 1) c.set("#F5EFE4");
    else if (b.k === 2) c.set("#EDE5D6");
    else if (b.k === 3) c.set("#E9E7E2");
    else c.set(WALLS[Math.floor(h1 * WALLS.length)]);

    const tall = top - ground;
    const tiled = b.k !== 3 && area < 420 && tall < 22 && h2 < 0.55;
    if (b.k === 2) r.set("#B8B0A3");
    else if (tiled) r.set(TILE_ROOFS[Math.floor(h2 * TILE_ROOFS.length * 1.8) % TILE_ROOFS.length]);
    else r.set(FLAT_ROOFS[Math.floor(h2 * FLAT_ROOFS.length)]);

    const kind = b.k === 3 || b.k === 2 || tall < 4.5 ? 0 : 1;
    walls(pts, base, top, ground, kind, c);
    cap(pts, top, r);

    // a rooftop plant room on bigger flat roofs
    if (!tiled && b.k !== 3 && area > 260) {
      let cx = 0;
      let cz = 0;
      pts.forEach((p) => {
        cx += p.x;
        cz += p.y;
      });
      cx /= pts.length;
      cz /= pts.length;
      let inside = false;
      for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
        const pi = pts[i];
        const pj = pts[j];
        if (pi.y > cz !== pj.y > cz && cx < ((pj.x - pi.x) * (cz - pi.y)) / (pj.y - pi.y) + pi.x) inside = !inside;
      }
      if (inside) {
        // align with the longest wall
        let best = 0;
        let rot = 0;
        for (let i = 0; i < pts.length; i++) {
          const p = pts[i];
          const q = pts[(i + 1) % pts.length];
          const l = p.distanceTo(q);
          if (l > best) {
            best = l;
            rot = Math.atan2(q.y - p.y, q.x - p.x);
          }
        }
        const s = Math.min(Math.sqrt(area) * 0.28, 9);
        const plant = r.clone().multiplyScalar(0.94);
        box(cx, cz, s, s * (0.6 + h1 * 0.5), top, top + 2.2 + h2 * 1.4, rot, plant);
      }
    }

    if (b.d) {
      // a dome on top
      let cx = 0;
      let cz = 0;
      pts.forEach((p) => {
        cx += p.x;
        cz += p.y;
      });
      cx /= pts.length;
      cz /= pts.length;
      const rad = Math.sqrt(area / Math.PI) * 0.55;
      const dome = new THREE.SphereGeometry(rad, 18, 8, 0, Math.PI * 2, 0, Math.PI / 2);
      const dp = dome.getAttribute("position");
      const dn = dome.getAttribute("normal");
      const v = pos.length / 3;
      const dc = new THREE.Color("#9FB5AE");
      for (let i = 0; i < dp.count; i++) {
        pos.push(dp.getX(i) + cx, dp.getY(i) * 0.8 + top, dp.getZ(i) + cz);
        nor.push(dn.getX(i), dn.getY(i), dn.getZ(i));
        col.push(dc.r, dc.g, dc.b);
        fac.push(0, 99, -1, 0);
      }
      const di = dome.getIndex()!;
      for (let i = 0; i < di.count; i++) idx.push(v + di.getX(i));
      dome.dispose();
    }
  });

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
  geo.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  geo.setAttribute("facade", new THREE.Float32BufferAttribute(fac, 4));
  geo.setIndex(idx);
  geo.computeBoundingSphere();
  return geo;
};

export const buildingsMaterial = () => {
  const m = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.86,
    metalness: 0,
    envMapIntensity: 0.55,
  });
  m.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        "#include <common>\nattribute vec4 facade;\nvarying vec4 vFacade;"
      )
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvFacade = facade;");
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", "#include <common>\nvarying vec4 vFacade;")
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
        float glass = 0.0;
        if (vFacade.z > -0.5) {
          if (vFacade.z > 0.5) {
            vec2 g = vec2(vFacade.x / 2.9, vFacade.y / 3.1);
            vec2 w = fwidth(g);
            vec2 f = fract(g);
            float wx = smoothstep(0.26 - w.x, 0.26 + w.x, f.x) * (1.0 - smoothstep(0.74 - w.x, 0.74 + w.x, f.x));
            float wy = smoothstep(0.3 - w.y, 0.3 + w.y, f.y) * (1.0 - smoothstep(0.84 - w.y, 0.84 + w.y, f.y));
            float band = step(3.0, vFacade.y) * (1.0 - step(vFacade.w - 2.6, vFacade.y));
            float fade = 1.0 - smoothstep(0.18, 0.45, max(w.x, w.y));
            glass = wx * wy * band * fade;
            diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.5, 0.58, 0.66), glass * 0.42);
          }
          // contact shadow at the foot of the wall
          diffuseColor.rgb *= mix(0.6, 1.0, smoothstep(-0.5, 9.0, vFacade.y));
        }`
      )
      .replace(
        "#include <roughnessmap_fragment>",
        "#include <roughnessmap_fragment>\nroughnessFactor = mix(roughnessFactor, 0.18, glass);"
      );
  };
  m.customProgramCacheKey = () => "monaco-buildings";
  return withCutaway(m);
};

/** a coarse grid of the tallest roof (or ground) per cell, for the camera */
export const skylineGrid = (city: City, step = 4) => {
  const { x0, x1, z0, z1 } = city.bounds;
  const w = Math.ceil((x1 - x0) / step) + 1;
  const h = Math.ceil((z1 - z0) / step) + 1;
  const top = new Float32Array(w * h);
  for (let j = 0; j < h; j++) {
    for (let i = 0; i < w; i++) top[j * w + i] = city.groundAt(x0 + i * step, z0 + j * step);
  }
  city.raw.buildings.forEach((b) => {
    const xs: number[] = [];
    const zs: number[] = [];
    for (let k = 0; k < b.p.length; k += 2) {
      xs.push(b.p[k] / 10);
      zs.push(b.p[k + 1] / 10);
    }
    const t = b.t / 10;
    const i0 = Math.max(0, Math.floor((Math.min(...xs) - x0) / step));
    const i1 = Math.min(w - 1, Math.ceil((Math.max(...xs) - x0) / step));
    const j0 = Math.max(0, Math.floor((Math.min(...zs) - z0) / step));
    const j1 = Math.min(h - 1, Math.ceil((Math.max(...zs) - z0) / step));
    for (let j = j0; j <= j1; j++) {
      for (let i = i0; i <= i1; i++) {
        const x = x0 + i * step;
        const z = z0 + j * step;
        let inside = false;
        for (let a = 0, c = xs.length - 1; a < xs.length; c = a++) {
          if (zs[a] > z !== zs[c] > z && x < ((xs[c] - xs[a]) * (z - zs[a])) / (zs[c] - zs[a]) + xs[a]) inside = !inside;
        }
        if (inside && t > top[j * w + i]) top[j * w + i] = t;
      }
    }
  });
  return (x: number, z: number) => {
    const i = Math.round((x - x0) / step);
    const j = Math.round((z - z0) / step);
    if (i < 0 || j < 0 || i >= w || j >= h) return 0;
    return top[j * w + i];
  };
};
