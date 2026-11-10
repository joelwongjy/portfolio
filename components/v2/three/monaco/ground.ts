import * as THREE from "three";

import { City, HALF_ROAD } from "./city";

// The ground is painted once into a canvas from the OSM vectors — land,
// water, parks, plazas, quays, roads with casings and soft contact shadows
// around every building — then draped over the terrain like a map tile.

export const PALETTE = {
  land: "#E4DFD5",
  // what shows of the seabed: only the sloped quay walls above the water
  sea: "#D2CBBE",
  park: "#BEDB9C",
  wood: "#A6CD8A",
  plaza: "#ECE8E1",
  quay: "#E7E3DB",
  pool: "#4CC6E2",
  water: "#7FC2E8",
  parking: "#D9D8D6",
  pitch: "#AFD594",
  sand: "#EFE1BC",
  rock: "#D2CABB",
  sidewalk: "#EEEBE5",
  kerbLine: "#CFCAC0",
  road: "#C5C7CB",
  roadMinor: "#CFD1D4",
  service: "#D8D9DB",
  path: "#F3F1EC",
  marking: "#FAFAF8",
  asphalt: "#D58076",
};

const AREA_FILL = [
  PALETTE.park,
  PALETTE.wood,
  PALETTE.plaza,
  PALETTE.quay,
  PALETTE.pool,
  PALETTE.water,
  PALETTE.parking,
  PALETTE.pitch,
  PALETTE.sand,
  PALETTE.rock,
];

// bounding boxes of the decimetre polylines, cached per array
const boxes = new WeakMap<number[], [number, number, number, number]>();
const bbox = (p: number[]) => {
  let b = boxes.get(p);
  if (!b) {
    b = [Infinity, Infinity, -Infinity, -Infinity];
    for (let i = 0; i < p.length; i += 2) {
      const x = p[i] / 10;
      const z = p[i + 1] / 10;
      if (x < b[0]) b[0] = x;
      if (z < b[1]) b[1] = z;
      if (x > b[2]) b[2] = x;
      if (z > b[3]) b[3] = z;
    }
    boxes.set(p, b);
  }
  return b;
};

interface Rect {
  x0: number;
  z0: number;
  w: number;
  h: number;
}

// Paint the map into a canvas covering one world rectangle at `longSide`
// pixels along its longer side.
const paint = (city: City, r: Rect, longSide: number, into?: HTMLCanvasElement) => {
  const { x0, z0 } = r;
  const W = r.w;
  const H = r.h;
  const scale = longSide / Math.max(W, H); // px per metre
  const cw = Math.round(W * scale);
  const ch = Math.round(H * scale);
  const canvas = into ?? document.createElement("canvas");
  if (canvas.width !== cw) canvas.width = cw;
  if (canvas.height !== ch) canvas.height = ch;
  const ctx = canvas.getContext("2d")!;
  ctx.setTransform(scale, 0, 0, scale, -x0 * scale, -z0 * scale);

  // skip features outside the rectangle (plus room for wide strokes)
  const rx0 = r.x0 - 16;
  const rz0 = r.z0 - 16;
  const rx1 = r.x0 + r.w + 16;
  const rz1 = r.z0 + r.h + 16;
  const path = (p: number[], close: boolean) => {
    const b = bbox(p);
    if (b[2] < rx0 || b[0] > rx1 || b[3] < rz0 || b[1] > rz1) return;
    ctx.moveTo(p[0] / 10, p[1] / 10);
    for (let i = 2; i < p.length; i += 2) ctx.lineTo(p[i] / 10, p[i + 1] / 10);
    if (close) ctx.closePath();
  };

  ctx.fillStyle = PALETTE.land;
  ctx.fillRect(x0, z0, W, H);

  // the sea, then any islands inside it
  ctx.fillStyle = PALETTE.sea;
  ctx.beginPath();
  city.raw.sea.forEach((r) => path(r, true));
  ctx.fill("evenodd");
  ctx.fillStyle = PALETTE.land;
  ctx.beginPath();
  city.raw.land.forEach((r) => path(r, true));
  ctx.fill();

  // land use — big soft areas first, small crisp ones on top
  const order = [6, 2, 0, 1, 7, 8, 9, 3, 5, 4];
  order.forEach((k) => {
    ctx.fillStyle = AREA_FILL[k];
    ctx.beginPath();
    city.raw.areas.filter((a) => a.k === k).forEach((a) => path(a.p, true));
    ctx.fill();
    if (k === 4) {
      // pool copings
      ctx.strokeStyle = "#F4F2EC";
      ctx.lineWidth = 0.8;
      ctx.stroke();
    }
  });

  // pontoons
  ctx.strokeStyle = PALETTE.quay;
  ctx.lineCap = "butt";
  city.raw.piers.forEach((p) => {
    ctx.lineWidth = p.w;
    ctx.beginPath();
    path(p.p, false);
    ctx.stroke();
  });

  // streets the way detailed city maps draw them: a pavement either side,
  // a grey carriageway, white lane markings
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const roads = city.raw.roads;
  const draw = (filter: (c: number) => boolean, widen: number, color: string, dash?: number[]) => {
    ctx.strokeStyle = color;
    ctx.setLineDash(dash ?? []);
    roads
      .filter((r) => filter(r.c))
      .forEach((r) => {
        ctx.lineWidth = Math.max(0.2, r.w + widen);
        ctx.beginPath();
        path(r.p, false);
        ctx.stroke();
      });
  };
  // footpaths and steps under everything
  draw((c) => c === 3 || c === 4, 0.5, PALETTE.kerbLine);
  draw((c) => c === 3, 0, PALETTE.path);
  draw((c) => c === 4, 0, PALETTE.path, [0.3, 0.3]);
  ctx.setLineDash([]);
  // pavements, with a kerb line
  draw((c) => c <= 2, 4.6, PALETTE.kerbLine);
  draw((c) => c <= 2, 4.2, PALETTE.sidewalk);
  draw((c) => c <= 1, 0.35, PALETTE.kerbLine);
  draw((c) => c === 2, 0, PALETTE.plaza);
  draw((c) => c === 1, 0, PALETTE.service);
  draw((c) => c === 0 && roads.length > 0, 0, PALETTE.road);
  // lane markings on the bigger streets
  ctx.strokeStyle = PALETTE.marking;
  ctx.setLineDash([3, 5]);
  roads
    .filter((r) => r.c === 0 && r.w >= 7.5)
    .forEach((r) => {
      ctx.lineWidth = 0.16;
      ctx.beginPath();
      path(r.p, false);
      ctx.stroke();
    });
  ctx.setLineDash([]);
  roads
    .filter((r) => r.c === 0 && r.w >= 9)
    .forEach((r) => {
      // edge lines
      ctx.lineWidth = r.w - 0.9;
      ctx.strokeStyle = PALETTE.marking;
      ctx.beginPath();
      path(r.p, false);
      ctx.stroke();
      ctx.lineWidth = r.w - 1.2;
      ctx.strokeStyle = PALETTE.road;
      ctx.stroke();
    });
  ctx.strokeStyle = PALETTE.marking;
  ctx.setLineDash([3, 5]);
  ctx.lineWidth = 0.16;
  roads
    .filter((r) => r.c === 0 && r.w >= 9)
    .forEach((r) => {
      ctx.beginPath();
      path(r.p, false);
      ctx.stroke();
    });
  ctx.setLineDash([]);

  // the circuit corridor in asphalt (the road mesh sits on top of it)
  // with a band of pavement beyond the barriers
  const { track } = city;
  ctx.beginPath();
  for (let i = 0; i <= track.n; i++) {
    const k = (i % track.n) * 3;
    if (i === 0) ctx.moveTo(track.pos[k], track.pos[k + 2]);
    else ctx.lineTo(track.pos[k], track.pos[k + 2]);
  }
  ctx.strokeStyle = PALETTE.sidewalk;
  ctx.lineWidth = HALF_ROAD * 2 + 9;
  ctx.stroke();
  ctx.strokeStyle = PALETTE.asphalt;
  ctx.lineWidth = HALF_ROAD * 2 + 2.4;
  ctx.stroke();

  // a tight ambient-occlusion edge hugging each building (the sun's own
  // shadows come from the shadow map, so this only darkens the first metre)
  ctx.save();
  ctx.shadowColor = "rgba(70, 60, 45, 0.32)";
  ctx.shadowBlur = Math.max(1.5, 0.9 * scale);
  ctx.fillStyle = "rgba(150, 140, 125, 0.35)";
  ctx.beginPath();
  city.raw.buildings.forEach((b) => {
    if (b.k === 3) return;
    path(b.p, true);
  });
  ctx.fill();
  ctx.restore();

  return canvas;
};

const toTexture = (canvas: HTMLCanvasElement, anisotropy: number) => {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = anisotropy;
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.needsUpdate = true;
  return tex;
};

export interface GroundMaps {
  /** the whole tile, coarse — what you see from the heli cam */
  base: THREE.CanvasTexture;
  /** the circuit and the streets around it, sharp */
  detail: THREE.CanvasTexture;
  /** maps the tile's uv to the detail map's uv: (uv - xy) * zw */
  rect: THREE.Vector4;
  /** milliseconds spent painting both canvases */
  paintMs: number;
  /** a small, very sharp map repainted around wherever the camera looks */
  near: NearField;
  dispose: () => void;
}

interface NearField {
  tex: THREE.CanvasTexture;
  rect: THREE.Vector4;
  on: { value: number };
  /** world centre and size of the current paint */
  cx: number;
  cz: number;
  size: number;
  px: number;
  frame: number;
  lastMs: number;
  update: (camera: THREE.Camera, frame: number) => void;
}

/**
 * Two maps: a coarse one for the whole tile and a sharp one over the circuit
 * plus a wide margin (the only place the chase camera ever gets close).
 * Both are UV-addressed the same way, so the shader picks per pixel.
 */
export const groundMaps = (
  city: City,
  opts: { base: number; detail: number; anisotropy: number; margin?: number; near?: number; nearSize?: number }
): GroundMaps => {
  const t0 = performance.now();
  const B = city.bounds;
  const W = B.x1 - B.x0;
  const H = B.z1 - B.z0;
  const tile: Rect = { x0: B.x0, z0: B.z0, w: W, h: H };

  // the circuit's footprint plus a margin, clamped to the tile
  const m = opts.margin ?? 150;
  let ax = Infinity;
  let bx = -Infinity;
  let az = Infinity;
  let bz = -Infinity;
  const p = city.track.pos;
  for (let i = 0; i < city.track.n; i++) {
    ax = Math.min(ax, p[i * 3]);
    bx = Math.max(bx, p[i * 3]);
    az = Math.min(az, p[i * 3 + 2]);
    bz = Math.max(bz, p[i * 3 + 2]);
  }
  const dx0 = Math.max(B.x0, ax - m);
  const dz0 = Math.max(B.z0, az - m);
  const around: Rect = { x0: dx0, z0: dz0, w: Math.min(B.x1, bx + m) - dx0, h: Math.min(B.z1, bz + m) - dz0 };

  const base = toTexture(paint(city, tile, opts.base), opts.anisotropy);
  const detail = toTexture(paint(city, around, opts.detail), opts.anisotropy);
  // tile uv: u = (x - x0)/W, v = 1 - (z - z0)/H (canvas rows run north → south)
  const rect = new THREE.Vector4(
    (around.x0 - B.x0) / W,
    1 - (around.z0 - B.z0) / H - around.h / H,
    W / around.w,
    H / around.h
  );
  const near = nearField(city, opts.near ?? 2048, opts.nearSize ?? 180, opts.anisotropy);
  return {
    base,
    detail,
    rect,
    paintMs: performance.now() - t0,
    near,
    dispose: () => {
      base.dispose();
      detail.dispose();
      near.tex.dispose();
    },
  };
};

// The chase camera sits ~90 m from the car, where a screen pixel covers
// about 7 cm of ground: no static map of the whole circuit can be that
// sharp, so a small one is repainted around the point the camera looks at
// whenever that point drifts toward its edge.
const nearField = (city: City, px: number, size: number, anisotropy: number): NearField => {
  const B = city.bounds;
  const W = B.x1 - B.x0;
  const H = B.z1 - B.z0;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = px;
  const tex = toTexture(canvas, anisotropy);
  const ray = new THREE.Vector3();
  const nf: NearField = {
    tex,
    rect: new THREE.Vector4(0, 0, 1, 1),
    on: { value: 0 },
    cx: Infinity,
    cz: Infinity,
    size,
    px,
    frame: -1,
    lastMs: 0,
    update: (camera, frame) => {
      if (nf.frame === frame) return;
      nf.frame = frame;
      // where the view centre meets the ground
      camera.getWorldDirection(ray);
      const cam = camera.position;
      const gy = city.groundAt(cam.x, cam.z);
      const height = cam.y - gy;
      // from the heli cam the coarse maps are already sharp enough
      if (height > 260 || ray.y > -0.08) {
        nf.on.value = 0;
        return;
      }
      const t = (height - 4) / -ray.y;
      const fx = cam.x + ray.x * t;
      const fz = cam.z + ray.z * t;
      nf.on.value = 1;
      if (Math.hypot(fx - nf.cx, fz - nf.cz) < size * 0.22) return;
      const t0 = performance.now();
      const r: Rect = { x0: fx - size / 2, z0: fz - size / 2, w: size, h: size };
      paint(city, r, px, canvas);
      tex.needsUpdate = true;
      nf.cx = fx;
      nf.cz = fz;
      nf.rect.set((r.x0 - B.x0) / W, 1 - (r.z0 - B.z0) / H - r.h / H, W / r.w, H / r.h);
      nf.lastMs = performance.now() - t0;
    },
  };
  return nf;
};

const NOISE = `
  float gHash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float gNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(gHash(i), gHash(i + vec2(1.0, 0.0)), f.x), mix(gHash(i + vec2(0.0, 1.0)), gHash(i + vec2(1.0, 1.0)), f.x), f.y);
  }
`;

// stone courses for retaining walls: Monaco's hillsides are terraced in
// dressed stone, and a wall reads far better than a map stretched down a cliff
const STONE = `
  vec3 gStone(vec3 w) {
    float course = floor(w.y / 0.75);
    float along = (abs(w.x) + abs(w.z)) / 1.6 + mod(course, 2.0) * 0.5;
    float joint = max(1.0 - smoothstep(0.0, 0.06, abs(fract(w.y / 0.75) - 0.5) * 2.0 - 0.9),
                      1.0 - smoothstep(0.0, 0.05, abs(fract(along) - 0.5) * 2.0 - 0.92));
    float tone = 0.92 + 0.08 * gHash(vec2(course, floor(along)));
    return vec3(0.86, 0.82, 0.75) * tone * (1.0 - 0.18 * joint);
  }
`;

/**
 * The ground material: samples the sharp map where it covers and the coarse
 * one elsewhere, turns steep faces into stone walls instead of a stretched
 * map, and adds a fine grain so close-ups don't look like a scaled bitmap.
 */
export const groundMaterial = (maps: GroundMaps, extra: THREE.MeshStandardMaterialParameters = {}) => {
  const mat = new THREE.MeshStandardMaterial({ map: maps.base, roughness: 1, envMapIntensity: 0.5, ...extra });
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uDetail = { value: maps.detail };
    shader.uniforms.uDetailRect = { value: maps.rect };
    shader.uniforms.uNear = { value: maps.near.tex };
    shader.uniforms.uNearRect = { value: maps.near.rect };
    shader.uniforms.uNearOn = maps.near.on;
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vGWorld;\nvarying float vGUp;")
      .replace(
        "#include <worldpos_vertex>",
        `#include <worldpos_vertex>
        vGWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;
        vGUp = normalize(mat3(modelMatrix) * objectNormal).y;`
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
        uniform sampler2D uDetail;
        uniform vec4 uDetailRect;
        uniform sampler2D uNear;
        uniform vec4 uNearRect;
        uniform float uNearOn;
        varying vec3 vGWorld;
        varying float vGUp;
        ${NOISE}
        ${STONE}`
      )
      .replace(
        "#include <map_fragment>",
        `#ifdef USE_MAP
          vec2 dUv = (vMapUv - uDetailRect.xy) * uDetailRect.zw;
          vec4 cBase = texture2D(map, vMapUv);
          vec4 cNear = texture2D(uDetail, clamp(dUv, 0.0, 1.0));
          // fade between the two over the outer 3% of the sharp map
          vec2 edge = min(dUv, 1.0 - dUv);
          float wNear = smoothstep(0.0, 0.03, min(edge.x, edge.y));
          vec4 sampledDiffuseColor = mix(cBase, cNear, wNear);
          // and the sharpest map around the camera's focus
          vec2 nUv = (vMapUv - uNearRect.xy) * uNearRect.zw;
          vec4 cClose = texture2D(uNear, clamp(nUv, 0.0, 1.0));
          vec2 nEdge = min(nUv, 1.0 - nUv);
          float wClose = smoothstep(0.0, 0.14, min(nEdge.x, nEdge.y)) * uNearOn;
          sampledDiffuseColor = mix(sampledDiffuseColor, cClose, wClose);
          diffuseColor *= sampledDiffuseColor;
        #endif
        // steep faces become stone walls
        float gWall = 1.0 - smoothstep(0.42, 0.7, abs(vGUp));
        diffuseColor.rgb = mix(diffuseColor.rgb, gStone(vGWorld), gWall);
        // fine grain at two scales
        float gGrain = gNoise(vGWorld.xz * 1.7) * 0.6 + gNoise(vGWorld.xz * 7.0) * 0.4;
        diffuseColor.rgb *= 0.965 + 0.07 * gGrain;`
      );
  };
  mat.customProgramCacheKey = () => "monaco-ground";
  // three calls Material.onBeforeRender per draw (r160 types omit it)
  (mat as unknown as {
    onBeforeRender: (r: THREE.WebGLRenderer, s: THREE.Scene, c: THREE.Camera) => void;
  }).onBeforeRender = (renderer, _scene, camera) => maps.near.update(camera, renderer.info.render.frame);
  return mat;
};

/** the vertical skirts under the circuit's pavements, dressed as walls */
export const stoneMaterial = () => {
  const mat = new THREE.MeshStandardMaterial({ color: "#FFFFFF", roughness: 0.95, side: THREE.DoubleSide });
  mat.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vGWorld;")
      .replace("#include <worldpos_vertex>", "#include <worldpos_vertex>\nvGWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;");
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", `#include <common>\nvarying vec3 vGWorld;\n${NOISE}\n${STONE}`)
      .replace("#include <color_fragment>", "#include <color_fragment>\ndiffuseColor.rgb *= gStone(vGWorld);");
  };
  mat.customProgramCacheKey = () => "monaco-stone";
  return mat;
};
