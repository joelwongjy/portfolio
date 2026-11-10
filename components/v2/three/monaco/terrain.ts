import * as THREE from "three";

import { City, HALF_ROAD, HeightGrid } from "./city";
import { underPitBuildings } from "./pit";

// The detailed ground: a heightfield from the terrain grid, UV-mapped to the
// painted map texture. Cells under the circuit are left out — the road,
// pavements and tunnel cover are their own meshes that follow it exactly.
export const terrainGeometry = (city: City) => {
  const g = city.terrain;
  const { x0, x1, z0, z1 } = city.bounds;
  const pos = new Float32Array(g.w * g.h * 3);
  const uv = new Float32Array(g.w * g.h * 2);
  for (let j = 0; j < g.h; j++) {
    for (let i = 0; i < g.w; i++) {
      const k = j * g.w + i;
      const x = g.x0 + i * g.step;
      const z = g.z0 + j * g.step;
      pos[k * 3] = x;
      pos[k * 3 + 1] = g.data[k];
      pos[k * 3 + 2] = z;
      uv[k * 2] = (x - x0) / (x1 - x0);
      uv[k * 2 + 1] = 1 - (z - z0) / (z1 - z0);
    }
  }
  const lim = HALF_ROAD + 4.1;
  const garages = underPitBuildings(city);
  const cut = (k: number) => city.nearTrack(pos[k * 3], pos[k * 3 + 2]).d < lim || garages(pos[k * 3], pos[k * 3 + 2]);
  // the cell is dropped when any of its corners is under a garage, so
  // no sliver of hillside survives inside a garage floor
  const skip = (a: number, b: number, c: number) =>
    (cut(a) && cut(b) && cut(c)) ||
    garages(pos[a * 3], pos[a * 3 + 2]) ||
    garages(pos[b * 3], pos[b * 3 + 2]) ||
    garages(pos[c * 3], pos[c * 3 + 2]);
  return grid(g, pos, uv, undefined, skip);
};

const grid = (
  g: HeightGrid,
  pos: Float32Array,
  uv?: Float32Array,
  color?: Float32Array,
  skip?: (a: number, b: number, c: number) => boolean
) => {
  const all = new Uint32Array((g.w - 1) * (g.h - 1) * 6);
  let o = 0;
  for (let j = 0; j < g.h - 1; j++) {
    for (let i = 0; i < g.w - 1; i++) {
      const a = j * g.w + i;
      const b = a + 1;
      const c = a + g.w;
      const d = c + 1;
      if (!skip?.(a, c, b)) {
        all[o++] = a;
        all[o++] = c;
        all[o++] = b;
      }
      if (!skip?.(b, c, d)) {
        all[o++] = b;
        all[o++] = c;
        all[o++] = d;
      }
    }
  }
  const idx = all.slice(0, o);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  if (uv) geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  if (color) geo.setAttribute("color", new THREE.BufferAttribute(color, 3));
  geo.setIndex(new THREE.BufferAttribute(idx, 1));
  geo.computeVertexNormals();
  return geo;
};

// The Riviera beyond the detailed area: Beausoleil, Cap d'Ail and the
// Alpes-Maritimes rising behind, shaded by height and slope. The part under
// the detailed tile is sunk so the two never fight.
export const outerTerrainGeometry = (city: City) => {
  const g = city.outer;
  const { x0, x1, z0, z1 } = city.bounds;
  const pos = new Float32Array(g.w * g.h * 3);
  const col = new Float32Array(g.w * g.h * 3);
  const town = new THREE.Color("#E6E0D4");
  const scrub = new THREE.Color("#B9C598");
  const forest = new THREE.Color("#93AE78");
  const rock = new THREE.Color("#CFC6B4");
  const c = new THREE.Color();
  const at = (i: number, j: number) =>
    g.data[Math.max(0, Math.min(g.h - 1, j)) * g.w + Math.max(0, Math.min(g.w - 1, i))];
  for (let j = 0; j < g.h; j++) {
    for (let i = 0; i < g.w; i++) {
      const k = j * g.w + i;
      const x = g.x0 + i * g.step;
      const z = g.z0 + j * g.step;
      let h = g.data[k];
      // Its 60 m cells would bridge the narrow valleys of the detailed tile
      // (Ste Dévote sits in one), so well inside the tile it drops right away;
      // only a band at the edges stays just under the detailed ground.
      const edge = Math.min(x - x0, x1 - x, z - z0, z1 - z);
      if (edge > 6) h = edge > 70 ? -40 : Math.min(h, city.groundAt(x, z)) - 3;
      pos[k * 3] = x;
      pos[k * 3 + 1] = h < 0 ? -20 : h;
      pos[k * 3 + 2] = z;
      const slope =
        Math.hypot(at(i + 1, j) - at(i - 1, j), at(i, j + 1) - at(i, j - 1)) / (2 * g.step);
      // dense town on the lower slopes, scrub and pine above, rock on cliffs
      const townness = 1 - THREE.MathUtils.smoothstep(h, 120, 260);
      c.copy(scrub).lerp(forest, THREE.MathUtils.smoothstep(h, 250, 700));
      c.lerp(town, townness * 0.9);
      c.lerp(rock, THREE.MathUtils.smoothstep(slope, 0.55, 1.1) * 0.8);
      col[k * 3] = c.r;
      col[k * 3 + 1] = c.g;
      col[k * 3 + 2] = c.b;
    }
  }
  return grid(g, pos, undefined, col);
};

// A small tiling normal map of soft ripples for the harbour and the sea.
export const rippleNormals = () => {
  const N = 256;
  const c = document.createElement("canvas");
  c.width = c.height = N;
  const ctx = c.getContext("2d")!;
  const img = ctx.createImageData(N, N);
  const h = new Float32Array(N * N);
  const waves = Array.from({ length: 14 }, (_, i) => ({
    kx: Math.round(Math.cos(i * 2.39) * (2 + (i % 5))),
    ky: Math.round(Math.sin(i * 2.39) * (2 + (i % 5))),
    a: 1 / (1 + i * 0.35),
    p: i * 1.7,
  }));
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      let v = 0;
      waves.forEach((w) => {
        v += w.a * Math.sin(((w.kx * x + w.ky * y) / N) * Math.PI * 2 + w.p);
      });
      h[y * N + x] = v;
    }
  }
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const dx = h[y * N + ((x + 1) % N)] - h[y * N + ((x - 1 + N) % N)];
      const dy = h[((y + 1) % N) * N + x] - h[((y - 1 + N) % N) * N + x];
      const nx = -dx * 0.35;
      const ny = -dy * 0.35;
      const l = Math.hypot(nx, ny, 1);
      const i = (y * N + x) * 4;
      img.data[i] = ((nx / l) * 0.5 + 0.5) * 255;
      img.data[i + 1] = ((ny / l) * 0.5 + 0.5) * 255;
      img.data[i + 2] = ((1 / l) * 0.5 + 0.5) * 255;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
};
