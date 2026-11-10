// Builds public/monaco/scene.json — the real-world data behind the 3D lap of
// Monaco: OpenStreetMap buildings, roads, harbour, parks and trees, terrain
// from the Mapzen/AWS Terrain Tiles, and the circuit centreline from
// bacinger/f1-circuits. Everything is projected into local metres
// (x = east, z = south, y = up) around the circuit.
//
//   node scripts/monaco/build.mjs [cacheDir]
//
// Raw downloads are cached in cacheDir (default .cache/monaco) so re-runs are
// offline and deterministic.

import fs from "node:fs";
import path from "node:path";
import { PNG } from "pngjs";

const CACHE = process.argv[2] || ".cache/monaco";
const OUT = "public/monaco/scene.json";

// query box: the circuit plus ~350 m of city around it
const BBOX = { s: 43.729, w: 7.4165, n: 43.7445, e: 7.435 };
// outer terrain for the hills and coast on the horizon
const OUTER = { s: 43.69, w: 7.36, n: 43.78, e: 7.5 };

const LAT0 = 43.7368;
const LON0 = 7.4258;
const MX = 80573; // metres per degree of longitude at LAT0
const MZ = 111108; // metres per degree of latitude

const px = (lon) => (lon - LON0) * MX;
const pz = (lat) => -(lat - LAT0) * MZ;
const P = (lat, lon) => [px(lon), pz(lat)];

// ——— fetch (cached) ———————————————————————————————————————————————

fs.mkdirSync(path.join(CACHE, "dem"), { recursive: true });

const UA = { "User-Agent": "portfolio-scene-builder/1.0" };

const cached = async (file, fetcher) => {
  const f = path.join(CACHE, file);
  if (!fs.existsSync(f)) {
    console.log("fetch", file);
    const buf = await fetcher();
    fs.writeFileSync(f, buf);
  }
  return fs.readFileSync(f);
};

const overpass = async () => {
  const b = `${BBOX.s},${BBOX.w},${BBOX.n},${BBOX.e}`;
  const q = `[out:json][timeout:180][bbox:${b}];(
    nwr["building"];nwr["building:part"];way["highway"];nwr["natural"];
    nwr["leisure"];nwr["landuse"];nwr["man_made"];nwr["water"];
    way["waterway"];nwr["amenity"="parking"];way["railway"];
    way["area:highway"];way["place"];
  );out geom;`;
  for (let attempt = 0; attempt < 6; attempt++) {
    const res = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      headers: { ...UA, "Content-Type": "application/x-www-form-urlencoded" },
      body: "data=" + encodeURIComponent(q),
    });
    const text = await res.text();
    if (text.trimStart().startsWith("{")) return Buffer.from(text);
    await new Promise((r) => setTimeout(r, 4000 * 2 ** attempt));
  }
  throw new Error("Overpass unavailable");
};

const osm = JSON.parse(await cached("osm.json", overpass));
const trackGeo = JSON.parse(
  await cached("track.geojson", async () =>
    Buffer.from(
      await (
        await fetch(
          "https://raw.githubusercontent.com/bacinger/f1-circuits/master/circuits/mc-1929.geojson",
          { headers: UA }
        )
      ).arrayBuffer()
    )
  )
);

// Terrarium tiles: h = R*256 + G + B/256 - 32768
const tileXY = (lat, lon, z) => {
  const n = 2 ** z;
  const r = (lat * Math.PI) / 180;
  return [
    ((lon + 180) / 360) * n,
    ((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * n,
  ];
};

const loadDem = async (box, z) => {
  const [x0, y0] = tileXY(box.n, box.w, z);
  const [x1, y1] = tileXY(box.s, box.e, z);
  const tiles = new Map();
  for (let x = Math.floor(x0); x <= Math.floor(x1); x++) {
    for (let y = Math.floor(y0); y <= Math.floor(y1); y++) {
      const buf = await cached(`dem/${z}_${x}_${y}.png`, async () =>
        Buffer.from(
          await (
            await fetch(
              `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${z}/${x}/${y}.png`,
              { headers: UA }
            )
          ).arrayBuffer()
        )
      );
      tiles.set(`${x}_${y}`, PNG.sync.read(buf));
    }
  }
  const px = (gx, gy) => {
    const tx = Math.floor(gx / 256);
    const ty = Math.floor(gy / 256);
    const t = tiles.get(`${tx}_${ty}`);
    if (!t) return 0;
    const i = ((gy - ty * 256) * 256 + (gx - tx * 256)) * 4;
    return t.data[i] * 256 + t.data[i + 1] + t.data[i + 2] / 256 - 32768;
  };
  // bilinear sample in global pixel space
  return (lat, lon) => {
    const [tx, ty] = tileXY(lat, lon, z);
    const gx = tx * 256 - 0.5;
    const gy = ty * 256 - 0.5;
    const ix = Math.floor(gx);
    const iy = Math.floor(gy);
    const fx = gx - ix;
    const fy = gy - iy;
    return (
      px(ix, iy) * (1 - fx) * (1 - fy) +
      px(ix + 1, iy) * fx * (1 - fy) +
      px(ix, iy + 1) * (1 - fx) * fy +
      px(ix + 1, iy + 1) * fx * fy
    );
  };
};

const demFine = await loadDem(BBOX, 15);
const demCoarse = await loadDem(OUTER, 12);

// ——— geometry helpers ————————————————————————————————————————————

const unproject = (x, z) => [LAT0 - z / MZ, LON0 + x / MX];

const area = (pts) => {
  let a = 0;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    a += (pts[j][0] + pts[i][0]) * (pts[j][1] - pts[i][1]);
  }
  return a / 2; // >0: clockwise in (x east, z south) == counter-clockwise on a map
};

const inPoly = (x, z, pts) => {
  let c = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, zi] = pts[i];
    const [xj, zj] = pts[j];
    if (zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) {
      c = !c;
    }
  }
  return c;
};

const centroid = (pts) => {
  let x = 0;
  let z = 0;
  pts.forEach((p) => {
    x += p[0];
    z += p[1];
  });
  return [x / pts.length, z / pts.length];
};

const distSeg = (x, z, a, b) => {
  const dx = b[0] - a[0];
  const dz = b[1] - a[1];
  const l2 = dx * dx + dz * dz || 1;
  let t = ((x - a[0]) * dx + (z - a[1]) * dz) / l2;
  t = Math.max(0, Math.min(1, t));
  const qx = a[0] + dx * t;
  const qz = a[1] + dz * t;
  return [Math.hypot(x - qx, z - qz), t];
};

const hash = (n) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

const q = (v) => Math.round(v * 10); // decimetres

const ring = (geom) => geom.map((g) => P(g.lat, g.lon));
const closed = (r) =>
  r.length > 3 &&
  Math.abs(r[0][0] - r[r.length - 1][0]) < 0.01 &&
  Math.abs(r[0][1] - r[r.length - 1][1]) < 0.01;

// world bounds of the detailed area
const X0 = px(BBOX.w);
const X1 = px(BBOX.e);
const Z0 = pz(BBOX.n);
const Z1 = pz(BBOX.s);

// ——— circuit centreline —————————————————————————————————————————

let track = trackGeo.features[0].geometry.coordinates.map(([lon, lat]) =>
  P(lat, lon)
);
if (closed(track)) track.pop();

// rotate so the lap starts on the start/finish line on Boulevard Albert 1er.
// The pit lane ("Voie des stands") sits between the start straight and the
// harbour, so the line is the nearest point of the circuit west of its middle.
const pitWay = osm.elements.find((e) => e.tags?.name === "Voie des stands");
const pitMid = pitWay
  ? P(
      pitWay.geometry[Math.floor(pitWay.geometry.length * 0.5)].lat,
      pitWay.geometry[Math.floor(pitWay.geometry.length * 0.5)].lon
    )
  : P(43.7352, 7.4214);
let sfi = 0;
let sfd = Infinity;
track.forEach((p, i) => {
  if (p[0] > pitMid[0]) return;
  const d = Math.hypot(p[0] - pitMid[0], p[1] - pitMid[1]);
  if (d < sfd) {
    sfd = d;
    sfi = i;
  }
});
track = [...track.slice(sfi), ...track.slice(0, sfi)];
// racing direction: the start straight runs north (−z) toward Ste Dévote
if (track[1][1] > track[0][1]) track = [track[0], ...track.slice(1).reverse()];

// resample to an even 2 m spacing along a centripetal Catmull-Rom spline
const catmull = (pts, step) => {
  const n = pts.length;
  const out = [];
  const get = (i) => pts[((i % n) + n) % n];
  for (let i = 0; i < n; i++) {
    const p0 = get(i - 1);
    const p1 = get(i);
    const p2 = get(i + 1);
    const p3 = get(i + 2);
    const seg = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
    const steps = Math.max(1, Math.ceil(seg / (step / 4)));
    // centripetal parametrisation
    const tj = (a, b) => Math.pow(Math.hypot(b[0] - a[0], b[1] - a[1]), 0.5) || 1e-4;
    const t0 = 0;
    const t1 = t0 + tj(p0, p1);
    const t2 = t1 + tj(p1, p2);
    const t3 = t2 + tj(p2, p3);
    for (let s = 0; s < steps; s++) {
      const t = t1 + ((t2 - t1) * s) / steps;
      const L = (a, b, ta, tb) => [
        ((tb - t) / (tb - ta)) * a[0] + ((t - ta) / (tb - ta)) * b[0],
        ((tb - t) / (tb - ta)) * a[1] + ((t - ta) / (tb - ta)) * b[1],
      ];
      const A1 = L(p0, p1, t0, t1);
      const A2 = L(p1, p2, t1, t2);
      const A3 = L(p2, p3, t2, t3);
      const B1 = L(A1, A2, t0, t2);
      const B2 = L(A2, A3, t1, t3);
      out.push(L(B1, B2, t1, t2));
    }
  }
  // even arc-length resample
  const res = [out[0]];
  let acc = 0;
  for (let i = 1; i <= out.length; i++) {
    const a = out[i - 1];
    const b = out[i % out.length];
    let d = Math.hypot(b[0] - a[0], b[1] - a[1]);
    let start = a;
    while (acc + d >= step) {
      const t = (step - acc) / d;
      const p = [start[0] + (b[0] - start[0]) * t, start[1] + (b[1] - start[1]) * t];
      res.push(p);
      d -= step - acc;
      start = p;
      acc = 0;
    }
    acc += d;
  }
  if (Math.hypot(res[0][0] - res[res.length - 1][0], res[0][1] - res[res.length - 1][1]) < step * 0.5) res.pop();
  return res;
};

// a light Gaussian pass irons the kinks out of the surveyed polyline so the
// road edges and kerbs run true, without rounding off the hairpin
const centre = (() => {
  let c = catmull(track, 2);
  const W = [0.06, 0.24, 0.4, 0.24, 0.06];
  for (let pass = 0; pass < 3; pass++) {
    c = c.map((_, i) => {
      let x = 0;
      let z = 0;
      W.forEach((w, k) => {
        const p = c[(i + k - 2 + c.length) % c.length];
        x += p[0] * w;
        z += p[1] * w;
      });
      return [x, z];
    });
  }
  return c;
})();
// half the drawn road width — wider than the real street, the way map apps
// widen roads so the route reads; keep in step with HALF_ROAD in city.ts
const HALF = 6;
const CORRIDOR = HALF + 2.2; // road + kerb + barrier
const lapLength = centre.length * 2;
// The surveyed line starts near the pit lane's middle; the real timing line
// is 262 m further up the straight (matched against the 2023 qualifying
// telemetry, where Ste Dévote is 205 m in). Start the lap there.
const LINE_OFFSET = 262;
{
  const k = Math.round(LINE_OFFSET / 2);
  const rotated = [...centre.slice(k), ...centre.slice(0, k)];
  centre.length = 0;
  centre.push(...rotated);
}

// ——— land and sea from the OSM coastline ————————————————————————————

const elements = osm.elements;
const coastWays = elements.filter(
  (e) => e.type === "way" && e.tags?.natural === "coastline"
);

// stitch ways into chains by shared end nodes
const chains = coastWays.map((w) => ({
  nodes: [...w.nodes],
  pts: ring(w.geometry),
}));
let merged = true;
while (merged) {
  merged = false;
  outer: for (let i = 0; i < chains.length; i++) {
    for (let j = 0; j < chains.length; j++) {
      if (i === j) continue;
      const a = chains[i];
      const b = chains[j];
      if (a.nodes[a.nodes.length - 1] === b.nodes[0]) {
        a.nodes = [...a.nodes, ...b.nodes.slice(1)];
        a.pts = [...a.pts, ...b.pts.slice(1)];
        chains.splice(j, 1);
        merged = true;
        break outer;
      }
    }
  }
}

// clip a polyline to the detail box; returns pieces that enter and leave it
const insideBox = (p) => p[0] >= X0 && p[0] <= X1 && p[1] >= Z0 && p[1] <= Z1;
const boxCross = (a, b) => {
  // intersection of segment a->b with the box boundary (a inside, b outside or vice versa)
  let best = null;
  const tryT = (t) => {
    if (t < 0 || t > 1) return;
    const x = a[0] + (b[0] - a[0]) * t;
    const z = a[1] + (b[1] - a[1]) * t;
    if (x < X0 - 1e-6 || x > X1 + 1e-6 || z < Z0 - 1e-6 || z > Z1 + 1e-6) return;
    if (!best || t < best.t) best = { t, p: [x, z] };
  };
  if (b[0] !== a[0]) {
    tryT((X0 - a[0]) / (b[0] - a[0]));
    tryT((X1 - a[0]) / (b[0] - a[0]));
  }
  if (b[1] !== a[1]) {
    tryT((Z0 - a[1]) / (b[1] - a[1]));
    tryT((Z1 - a[1]) / (b[1] - a[1]));
  }
  return best?.p;
};

const landRings = [];
const pieces = [];
chains.forEach((c) => {
  const isRing = c.nodes[0] === c.nodes[c.nodes.length - 1];
  if (isRing && c.pts.every(insideBox)) {
    landRings.push(c.pts);
    return;
  }
  let cur = null;
  for (let i = 0; i < c.pts.length; i++) {
    const p = c.pts[i];
    const inside = insideBox(p);
    if (inside) {
      if (!cur) {
        cur = [];
        if (i > 0) {
          // entering: find where the previous segment crosses the boundary
          const prev = c.pts[i - 1];
          const enter = boxCross(p, prev);
          if (enter) cur.push(enter);
        }
      }
      cur.push(p);
    } else if (cur) {
      const exit = boxCross(c.pts[i - 1], p);
      if (exit) cur.push(exit);
      pieces.push(cur);
      cur = null;
    }
  }
  if (cur) pieces.push(cur);
});

// perimeter parameter running clockwise on the map: along the top edge
// (north, z = Z0) eastward, down the east edge, west along the south, up the west
const W = X1 - X0;
const H = Z1 - Z0;
const perim = (p) => {
  const [x, z] = p;
  const e = 0.5;
  if (Math.abs(z - Z0) < e) return x - X0;
  if (Math.abs(x - X1) < e) return W + (z - Z0);
  if (Math.abs(z - Z1) < e) return W + H + (X1 - x);
  return 2 * W + H + (Z1 - z);
};
const perimPoint = (s) => {
  const L = 2 * (W + H);
  s = ((s % L) + L) % L;
  if (s < W) return [X0 + s, Z0];
  if (s < W + H) return [X1, Z0 + (s - W)];
  if (s < 2 * W + H) return [X1 - (s - W - H), Z1];
  return [X0, Z1 - (s - 2 * W - H)];
};
const corners = [0, W, W + H, 2 * W + H];

// Water lies to the right of the coastline, so the sea polygon follows each
// piece and then walks the box clockwise to the next piece's entry.
const seaRings = [];
const open = pieces.filter((p) => p.length > 1);
const used = new Set();
const L = 2 * (W + H);
open.forEach((_, startIdx) => {
  if (used.has(startIdx)) return;
  const poly = [];
  let idx = startIdx;
  for (let guard = 0; guard < 50; guard++) {
    used.add(idx);
    const pc = open[idx];
    poly.push(...pc);
    const exitS = perim(pc[pc.length - 1]);
    // next entry clockwise from the exit
    let best = -1;
    let bestGap = Infinity;
    open.forEach((o, k) => {
      const gap = (((perim(o[0]) - exitS) % L) + L) % L;
      if (gap < bestGap) {
        bestGap = gap;
        best = k;
      }
    });
    // walk the corners in between
    corners
      .map((c) => ({ c, gap: (((c - exitS) % L) + L) % L }))
      .filter((c) => c.gap > 0 && c.gap < bestGap)
      .sort((a, b) => a.gap - b.gap)
      .forEach((c) => poly.push(perimPoint(c.c)));
    if (best === startIdx || used.has(best)) break;
    idx = best;
  }
  seaRings.push(poly);
});

const isSea = (x, z) => {
  if (!insideBox([x, z])) return null;
  let sea = seaRings.some((r) => inPoly(x, z, r));
  if (sea && landRings.some((r) => inPoly(x, z, r))) sea = false;
  return sea;
};

// ——— terrain ———————————————————————————————————————————————————

const STEP = 6;
const GW = Math.floor(W / STEP) + 1;
const GH = Math.floor(H / STEP) + 1;

// the circuit's elevation comes from the DEM along the centreline, smoothed
// hard so building noise in the surface model can't put bumps in the road
const raw = centre.map(([x, z]) => {
  const [lat, lon] = unproject(x, z);
  return demFine(lat, lon);
});

// tunnel: the circuit runs underground from Portier along Boulevard Louis II,
// under the Fairmont, until it surfaces before the Nouvelle Chicane
const nearestIdx = (p) => {
  let bi = 0;
  let bd = Infinity;
  centre.forEach((c, i) => {
    const d = (c[0] - p[0]) ** 2 + (c[1] - p[1]) ** 2;
    if (d < bd) {
      bd = d;
      bi = i;
    }
  });
  return { i: bi, d: Math.sqrt(bd) };
};
const tunnelIdx = [];
elements
  .filter(
    (e) =>
      e.type === "way" &&
      e.tags?.tunnel === "yes" &&
      ["Boulevard Louis II", "Circuit de Monaco"].includes(e.tags.name) &&
      e.geometry
  )
  .forEach((e) =>
    ring(e.geometry).forEach((p) => {
      const n = nearestIdx(p);
      if (n.d < 14) tunnelIdx.push(n.i);
    })
  );
let tunnel = tunnelIdx.length
  ? [Math.min(...tunnelIdx), Math.max(...tunnelIdx)]
  : [0, 0];

const smooth = (arr, r) =>
  arr.map((_, i) => {
    let s = 0;
    let w = 0;
    for (let k = -r; k <= r; k++) {
      const wk = 1 - Math.abs(k) / (r + 1);
      s += arr[(i + k + arr.length) % arr.length] * wk;
      w += wk;
    }
    return s / w;
  });

// The surface model is polluted by buildings in a city this dense, so the
// circuit follows its published profile instead, keyed by lap distance
// (metres from the line): flat to Ste Dévote, the Beau Rivage climb to
// Casino Square, down through Mirabeau, the hairpin and Portier, then the
// tunnel's descent to the harbour front.
const PROFILE = [
  [0, 6.5],
  [380, 7],
  [480, 8],
  [600, 13],
  [760, 23],
  [900, 32],
  [1050, 39.5],
  [1160, 43],
  [1260, 42],
  [1360, 36],
  [1430, 31],
  [1500, 26],
  [1570, 20],
  [1640, 12],
  [1700, 9.5],
  [1900, 6.5],
  [2144, 4],
  [2260, 3],
  [2420, 2.4],
  [2600, 2.2],
  [3000, 2.3],
  [3180, 3],
  [3280, 5],
  [3332, 6.5],
];
const profileAt = (d) => {
  for (let k = 1; k < PROFILE.length; k++) {
    const [d1, h1] = PROFILE[k];
    const [d0, h0] = PROFILE[k - 1];
    if (d <= d1) {
      const t = (d - d0) / (d1 - d0);
      const e = t * t * (3 - 2 * t);
      return h0 + (h1 - h0) * e;
    }
  }
  return PROFILE[PROFILE.length - 1][1];
};
let elev = centre.map((_, i) => profileAt(((i / centre.length) * lapLength + LINE_OFFSET) % lapLength));
elev = smooth(elev, 10);
void raw;
const trackY = elev;

// coarse spatial hash of the centreline for fast distance queries
const CELL = 40;
const grid = new Map();
centre.forEach((p, i) => {
  const k = `${Math.floor(p[0] / CELL)},${Math.floor(p[1] / CELL)}`;
  if (!grid.has(k)) grid.set(k, []);
  grid.get(k).push(i);
});
const nearTrack = (x, z, r = 1) => {
  const cx = Math.floor(x / CELL);
  const cz = Math.floor(z / CELL);
  let best = Infinity;
  let bi = -1;
  for (let a = -r; a <= r; a++) {
    for (let b = -r; b <= r; b++) {
      const list = grid.get(`${cx + a},${cz + b}`);
      if (!list) continue;
      for (const i of list) {
        const d = Math.hypot(centre[i][0] - x, centre[i][1] - z);
        if (d < best) {
          best = d;
          bi = i;
        }
      }
    }
  }
  return { d: best, i: bi };
};

const inTunnel = (i) => i >= tunnel[0] - 4 && i <= tunnel[1] + 4;

// ——— the pit lane ———————————————————————————————————————————————

// "Voie des stands" leaves the circuit after La Rascasse and runs up beside
// the start straight; resample it to 2 m and give it the circuit's height.
const pitLane = (() => {
  const w = elements.find((e) => e.type === "way" && e.tags?.name === "Voie des stands");
  if (!w) return [];
  const pts = ring(w.geometry);
  const out = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    const d = Math.hypot(b[0] - a[0], b[1] - a[1]);
    for (let s = 2; s <= d; s += 2) out.push([a[0] + ((b[0] - a[0]) * s) / d, a[1] + ((b[1] - a[1]) * s) / d]);
  }
  // soften the polyline's corners
  let c = out;
  for (let pass = 0; pass < 4; pass++) {
    c = c.map((p, i) => {
      if (i === 0 || i === c.length - 1) return p;
      return [(c[i - 1][0] + p[0] * 2 + c[i + 1][0]) / 4, (c[i - 1][1] + p[1] * 2 + c[i + 1][1]) / 4];
    });
  }
  // heights from the nearest circuit point step where the nearest line
  // changes, so smooth them into a gentle ramp
  const raw = c.map(([x, z]) => trackY[nearTrack(x, z, 2).i] ?? 3);
  const ys = raw.map((_, i) => {
    let t = 0;
    let n = 0;
    for (let k = -30; k <= 30; k++) {
      const j = Math.max(0, Math.min(raw.length - 1, i + k));
      t += raw[j];
      n++;
    }
    return t / n;
  });
  return c.map(([x, z], i) => [x, z, ys[i]]);
})();
const nearPit = (x, z) => {
  let best = Infinity;
  for (const p of pitLane) best = Math.min(best, Math.hypot(p[0] - x, p[1] - z));
  return best;
};
const pitAt = (x, z) => {
  let best = Infinity;
  let y = 0;
  for (const p of pitLane) {
    const d = Math.hypot(p[0] - x, p[1] - z);
    if (d < best) {
      best = d;
      y = p[2];
    }
  }
  return { d: best, y };
};

const SEA_DEPTH = -1.6;
const TUNNEL_COVER = 7.5; // ground above the tunnel road
const terrainRaw = new Float32Array(GW * GH);
for (let j = 0; j < GH; j++) {
  for (let i = 0; i < GW; i++) {
    const x = X0 + i * STEP;
    const z = Z0 + j * STEP;
    const [lat, lon] = unproject(x, z);
    terrainRaw[j * GW + i] = demFine(lat, lon);
  }
}
// blur the surface model to knock down building spikes
const blur = (src, r) => {
  const out = new Float32Array(src.length);
  for (let j = 0; j < GH; j++) {
    for (let i = 0; i < GW; i++) {
      let s = 0;
      let w = 0;
      for (let b = -r; b <= r; b++) {
        for (let a = -r; a <= r; a++) {
          const ii = i + a;
          const jj = j + b;
          if (ii < 0 || jj < 0 || ii >= GW || jj >= GH) continue;
          const wk = 1 / (1 + a * a + b * b);
          s += src[jj * GW + ii] * wk;
          w += wk;
        }
      }
      out[j * GW + i] = s / w;
    }
  }
  return out;
};
const demSmooth = blur(terrainRaw, 3);

const smoothstep = (a, b, v) => {
  const t = Math.max(0, Math.min(1, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

const terrain = new Float32Array(GW * GH);
const seaMask = new Uint8Array(GW * GH);
for (let j = 0; j < GH; j++) {
  for (let i = 0; i < GW; i++) {
    const x = X0 + i * STEP;
    const z = Z0 + j * STEP;
    const k = j * GW + i;
    const sea = isSea(x, z);
    seaMask[k] = sea ? 1 : 0;
    let h = Math.max(demSmooth[k], 1.2);
    // pull the ground to the road around the circuit; over the tunnel it
    // becomes the cover the road runs beneath
    const nt = nearTrack(x, z, 1);
    if (nt.i >= 0) {
      if (inTunnel(nt.i)) {
        const w = 1 - smoothstep(CORRIDOR + 3, CORRIDOR + 20, nt.d);
        h = Math.max(h, h * (1 - w) + (trackY[nt.i] + TUNNEL_COVER) * w);
      } else {
        const w = 1 - smoothstep(CORRIDOR + 7, CORRIDOR + 34, nt.d);
        h = h * (1 - w) + (trackY[nt.i] - 0.25) * w;
      }
    }
    // level the pit lane and the garages beside it
    if (pitLane.length && !sea) {
      const pa = pitAt(x, z);
      if (pa.d < 26) {
        const w = 1 - smoothstep(18, 26, pa.d);
        const trackW = nt.i >= 0 ? 1 - smoothstep(CORRIDOR + 2, CORRIDOR + 8, nt.d) : 0;
        const wp = w * (1 - trackW);
        h = h * (1 - wp) + (pa.y - 0.2) * wp;
      }
    }
    const covered = nt.i >= 0 && inTunnel(nt.i) && nt.d < CORRIDOR + 6;
    if (covered) seaMask[k] = 0;
    terrain[k] = sea && !covered ? SEA_DEPTH : h;
  }
}
// shoreline: let land cells next to the sea drop to a quay edge, not a slope
const terrainFinal = Float32Array.from(terrain);
for (let j = 0; j < GH; j++) {
  for (let i = 0; i < GW; i++) {
    const k = j * GW + i;
    if (seaMask[k]) continue;
    terrainFinal[k] = Math.max(terrain[k], 1.4);
  }
}

const groundAt = (x, z) => {
  const gx = (x - X0) / STEP;
  const gz = (z - Z0) / STEP;
  const i = Math.max(0, Math.min(GW - 2, Math.floor(gx)));
  const j = Math.max(0, Math.min(GH - 2, Math.floor(gz)));
  const fx = Math.max(0, Math.min(1, gx - i));
  const fz = Math.max(0, Math.min(1, gz - j));
  const t = terrainFinal;
  return (
    t[j * GW + i] * (1 - fx) * (1 - fz) +
    t[j * GW + i + 1] * fx * (1 - fz) +
    t[(j + 1) * GW + i] * (1 - fx) * fz +
    t[(j + 1) * GW + i + 1] * fx * fz
  );
};

// outer terrain (hills on the horizon), 60 m grid
const OSTEP = 60;
const OX0 = px(OUTER.w);
const OX1 = px(OUTER.e);
const OZ0 = pz(OUTER.n);
const OZ1 = pz(OUTER.s);
const OW = Math.floor((OX1 - OX0) / OSTEP) + 1;
const OH = Math.floor((OZ1 - OZ0) / OSTEP) + 1;
const outer = new Int16Array(OW * OH);
for (let j = 0; j < OH; j++) {
  for (let i = 0; i < OW; i++) {
    const x = OX0 + i * OSTEP;
    const z = OZ0 + j * OSTEP;
    const [lat, lon] = unproject(x, z);
    let h = demCoarse(lat, lon);
    if (h < 0.5) h = -20; // sea
    outer[j * OW + i] = Math.round(h);
  }
}

// ——— buildings ————————————————————————————————————————————————

const parseH = (v) => {
  if (!v) return null;
  const m = String(v).match(/-?[\d.]+/);
  return m ? parseFloat(m[0]) : null;
};

const outerRingsOf = (e) => {
  if (e.type === "way") return e.geometry ? [ring(e.geometry)] : [];
  if (e.type === "relation") {
    // stitch outer member ways into rings
    const segs = e.members
      .filter((m) => m.type === "way" && m.role !== "inner" && m.geometry)
      .map((m) => ring(m.geometry));
    const rings = [];
    while (segs.length) {
      let cur = segs.shift();
      let grew = true;
      while (!closed(cur) && grew) {
        grew = false;
        for (let k = 0; k < segs.length; k++) {
          const s = segs[k];
          const end = cur[cur.length - 1];
          const near = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]) < 0.05;
          if (near(end, s[0])) cur = [...cur, ...s.slice(1)];
          else if (near(end, s[s.length - 1])) cur = [...cur, ...s.slice(0, -1).reverse()];
          else continue;
          segs.splice(k, 1);
          grew = true;
          break;
        }
      }
      if (cur.length > 3) rings.push(cur);
    }
    return rings;
  }
  return [];
};

const isUnderground = (t) =>
  t.location === "underground" ||
  (t.layer && parseInt(t.layer, 10) < 0 && !t.height && !t["building:levels"]) ||
  t.building === "underground";

const parts = elements.filter((e) => e.tags?.["building:part"] && !isUnderground(e.tags));
const outlines = elements.filter(
  (e) => e.tags?.building && !e.tags["building:part"] && !isUnderground(e.tags)
);

const partRings = parts.flatMap((p) =>
  outerRingsOf(p).map((r) => ({ r, t: p.tags, id: p.id }))
);

const buildings = [];
const pushBuilding = (r, t, id) => {
  if (r.length < 4) return;
  if (closed(r)) r = r.slice(0, -1);
  const a = Math.abs(area(r));
  if (a < 6) return;
  const [cx, cz] = centroid(r);
  if (!insideBox([cx, cz])) return;
  // keep buildings off the circuit itself
  const nt = nearTrack(cx, cz, 1);
  if (nt.d < HALF && !inTunnel(nt.i)) return;
  // the pit garages are built by the scene; clear whatever OSM has there
  if (pitLane.length && nearPit(cx, cz) < 16 && nt.d < 34) return;
  // drop footprints that span the open circuit (canopies, bridges, bad joins)
  {
    let x0 = Infinity;
    let x1 = -Infinity;
    let z0 = Infinity;
    let z1 = -Infinity;
    r.forEach(([x, z]) => {
      x0 = Math.min(x0, x);
      x1 = Math.max(x1, x);
      z0 = Math.min(z0, z);
      z1 = Math.max(z1, z);
    });
    for (let i = 0; i < centre.length; i++) {
      const [x, z] = centre[i];
      if (x < x0 || x > x1 || z < z0 || z > z1 || inTunnel(i)) continue;
      if (inPoly(x, z, r)) {
        console.log("dropped building over the track", id, t.name ?? t.building);
        return;
      }
    }
  }
  // trim facades that overhang the widened road back to the barrier line
  r = r.map(([x, z]) => {
    const n3 = nearTrack(x, z, 1);
    if (n3.i < 0 || inTunnel(n3.i) || n3.d >= CORRIDOR) return [x, z];
    const [tx, tz] = centre[n3.i];
    const dx = x - tx;
    const dz = z - tz;
    const l = Math.hypot(dx, dz) || 1;
    return [tx + (dx / l) * CORRIDOR, tz + (dz / l) * CORRIDOR];
  });

  const levels = parseH(t["building:levels"]);
  const minLevel = parseH(t["building:min_level"]);
  let h = parseH(t.height);
  let minH = parseH(t.min_height);
  const kind = t.building || t["building:part"];
  if (h == null && levels != null) h = levels * 3.2 + 1.5;
  if (minH == null && minLevel != null) minH = minLevel * 3.2;
  if (h == null) {
    // Monte Carlo is mostly 5–12 storey apartment blocks; scale the guess
    // with footprint so villas stay low and big blocks stand tall.
    const r1 = hash(id);
    if (kind === "roof" || kind === "canopy" || kind === "carport") h = 4;
    else if (kind === "kiosk" || kind === "hut" || kind === "shed") h = 3.2;
    else if (kind === "garage" || kind === "garages") h = 3.5;
    else if (kind === "house" || kind === "detached") h = 7 + r1 * 4;
    else if (kind === "church" || kind === "chapel") h = 14;
    else if (a < 50) h = 6 + r1 * 6;
    else if (a < 200) h = 10 + r1 * 14;
    else if (a < 800) h = 16 + r1 * 18;
    else h = 14 + r1 * 22;
  }
  if (kind === "roof" || kind === "canopy") minH = minH ?? Math.max(0, h - 1);

  // ground under the footprint
  let gmin = Infinity;
  let gmax = -Infinity;
  [...r, [cx, cz]].forEach(([x, z]) => {
    const g = groundAt(x, z);
    gmin = Math.min(gmin, g);
    gmax = Math.max(gmax, g);
  });
  if (gmin < 0.5) gmin = Math.max(gmin, 0.8);
  let base = minH ? gmin + minH : gmin - 1.5;
  // nothing may hang down into the tunnel bore
  for (const [x, z] of [...r, [cx, cz]]) {
    const n2 = nearTrack(x, z, 1);
    if (n2.i >= 0 && inTunnel(n2.i) && n2.d < CORRIDOR + 1) {
      base = Math.max(base, trackY[n2.i] + TUNNEL_COVER - 1);
    }
  }
  const top = Math.max(gmin + h, gmax + Math.min(h, 3));
  const topFinal = Math.max(top, base + Math.min(h, 4));

  // ensure a consistent winding (counter-clockwise on the map)
  if (area(r) < 0) r = r.slice().reverse();

  const roofShape = t["roof:shape"];
  buildings.push({
    p: r.flatMap(([x, z]) => [q(x), q(z)]),
    b: q(base),
    t: q(topFinal),
    k:
      kind === "church" || kind === "chapel" || kind === "cathedral"
        ? 2
        : kind === "roof" || kind === "canopy"
        ? 3
        : kind === "hotel" || t.tourism === "hotel"
        ? 1
        : 0,
    ...(roofShape === "dome" ? { d: 1 } : {}),
    ...(t["building:colour"] ? { c: t["building:colour"] } : {}),
  });
};

// outlines that are fully described by parts are skipped
const replaced = new Set();
outlines.forEach((o) => {
  const rs = outerRingsOf(o);
  if (!rs.length) return;
  const has = partRings.some((p) => {
    const [cx, cz] = centroid(p.r);
    return rs.some((r) => inPoly(cx, cz, r));
  });
  if (has) replaced.add(o.id);
});
outlines.forEach((o) => {
  if (replaced.has(o.id)) return;
  outerRingsOf(o).forEach((r) => pushBuilding(r, o.tags, o.id));
});
partRings.forEach((p) => pushBuilding(p.r, p.t, p.id));

// ——— roads & areas for the ground texture ——————————————————————————

const ROAD_W = {
  motorway: 14,
  trunk: 12,
  primary: 11,
  primary_link: 7,
  secondary: 9.5,
  secondary_link: 6.5,
  tertiary: 8,
  tertiary_link: 6,
  unclassified: 6.5,
  residential: 6.5,
  living_street: 5,
  service: 4.5,
  pedestrian: 5,
  raceway: 10,
  footway: 2.2,
  path: 1.6,
  steps: 2,
  cycleway: 2.2,
  platform: 3,
};
const roads = [];
elements.forEach((e) => {
  if (e.type !== "way" || !e.tags?.highway || !e.geometry) return;
  const t = e.tags;
  const cls = t.highway;
  if (!(cls in ROAD_W)) return;
  if (t.tunnel === "yes" || t.tunnel === "building_passage") return;
  if (t.indoor === "yes" || t.level?.startsWith("-")) return;
  if (t.layer && parseInt(t.layer, 10) < 0) return;
  if (t.area === "yes") return;
  const pts = ring(e.geometry);
  if (!pts.some(insideBox)) return;
  const width = parseH(t.width) ?? ROAD_W[cls];
  const c =
    cls === "footway" || cls === "path" || cls === "cycleway" || cls === "platform"
      ? 3
      : cls === "steps"
      ? 4
      : cls === "pedestrian" || cls === "living_street"
      ? 2
      : cls === "service"
      ? 1
      : 0;
  roads.push({ c, w: Math.round(width * 10) / 10, p: pts.flatMap(([x, z]) => [q(x), q(z)]) });
});

// area kinds: 0 park/grass, 1 wood, 2 plaza, 3 pier/quay, 4 pool, 5 water,
// 6 parking, 7 pitch, 8 beach/sand, 9 rock
const areas = [];
const pushArea = (e, k) => {
  outerRingsOf(e).forEach((r) => {
    if (r.length < 4) return;
    if (!r.some(insideBox)) return;
    areas.push({ k, p: r.flatMap(([x, z]) => [q(x), q(z)]) });
  });
};
elements.forEach((e) => {
  const t = e.tags;
  if (!t || e.type === "node") return;
  if (t.building) return;
  if (t.tunnel === "yes" || (t.layer && parseInt(t.layer, 10) < 0)) return;
  if (["park", "garden"].includes(t.leisure)) pushArea(e, 0);
  else if (["grass", "flowerbed", "meadow", "village_green", "recreation_ground"].includes(t.landuse)) pushArea(e, 0);
  else if (["forest", "orchard"].includes(t.landuse) || ["wood", "scrub", "heath"].includes(t.natural)) pushArea(e, 1);
  else if (t.man_made === "pier" && t.area === "yes") pushArea(e, 3);
  else if (t.man_made === "breakwater" || t.man_made === "quay") pushArea(e, 3);
  else if (t.leisure === "swimming_pool") pushArea(e, 4);
  else if (t.natural === "water" && t.water !== "reservoir") pushArea(e, 5);
  else if (t.amenity === "parking" && t.parking !== "underground" && t.parking !== "multi-storey") pushArea(e, 6);
  else if (t.leisure === "pitch") pushArea(e, 7);
  else if (t.natural === "beach" || t.natural === "sand") pushArea(e, 8);
  else if (t.natural === "bare_rock") pushArea(e, 9);
  else if ((t.highway === "pedestrian" && t.area === "yes") || t.place === "square" || t["area:highway"]) pushArea(e, 2);
});
// pier lines (pontoons) drawn as thin quays
const pierLines = elements
  .filter((e) => e.type === "way" && e.tags?.man_made === "pier" && e.tags.area !== "yes" && e.geometry)
  .map((e) => ({ w: parseH(e.tags.width) ?? 3, p: ring(e.geometry).flatMap(([x, z]) => [q(x), q(z)]) }));

// ——— trees ————————————————————————————————————————————————————

const trees = [];
const addTree = (x, z, s) => {
  if (!insideBox([x, z])) return;
  if (isSea(x, z)) return;
  const nt = nearTrack(x, z, 1);
  if (nt.d < CORRIDOR + 2) return;
  if (pitLane.length && nearPit(x, z) < 19) return;
  if (buildings.length && insideAnyBuilding(x, z)) return;
  trees.push([q(x), q(z), Math.round(s * 10)]);
};
// building footprint test via a coarse bucket
const BB = new Map();
buildings.forEach((b, bi) => {
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
  for (let gx = Math.floor(x0 / 30); gx <= Math.floor(x1 / 30); gx++) {
    for (let gz = Math.floor(z0 / 30); gz <= Math.floor(z1 / 30); gz++) {
      const k = `${gx},${gz}`;
      if (!BB.has(k)) BB.set(k, []);
      BB.get(k).push(bi);
    }
  }
});
function insideAnyBuilding(x, z) {
  const list = BB.get(`${Math.floor(x / 30)},${Math.floor(z / 30)}`) || [];
  return list.some((bi) => {
    const b = buildings[bi];
    const pts = [];
    for (let k = 0; k < b.p.length; k += 2) pts.push([b.p[k] / 10, b.p[k + 1] / 10]);
    if (b.k === 3) return false;
    return inPoly(x, z, pts);
  });
}

elements.forEach((e) => {
  if (e.type === "node" && e.tags?.natural === "tree") {
    const [x, z] = P(e.lat, e.lon);
    addTree(x, z, 4 + hash(e.id) * 3);
  }
  if (e.type === "way" && e.tags?.natural === "tree_row" && e.geometry) {
    const pts = ring(e.geometry);
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1];
      const b = pts[i];
      const d = Math.hypot(b[0] - a[0], b[1] - a[1]);
      for (let s = 0; s < d; s += 8) {
        addTree(a[0] + ((b[0] - a[0]) * s) / d, a[1] + ((b[1] - a[1]) * s) / d, 4.5);
      }
    }
  }
});
// fill parks and woods with canopy
let seed = 1;
areas.forEach((a) => {
  if (a.k !== 0 && a.k !== 1) return;
  const pts = [];
  for (let k = 0; k < a.p.length; k += 2) pts.push([a.p[k] / 10, a.p[k + 1] / 10]);
  const ar = Math.abs(area(pts));
  if (ar < 40) return;
  const dens = a.k === 1 ? 45 : 110; // m² per tree
  const n = Math.min(400, Math.floor(ar / dens));
  let x0 = Infinity;
  let x1 = -Infinity;
  let z0 = Infinity;
  let z1 = -Infinity;
  pts.forEach(([x, z]) => {
    x0 = Math.min(x0, x);
    x1 = Math.max(x1, x);
    z0 = Math.min(z0, z);
    z1 = Math.max(z1, z);
  });
  let placed = 0;
  for (let tries = 0; tries < n * 6 && placed < n; tries++) {
    const x = x0 + hash(seed++) * (x1 - x0);
    const z = z0 + hash(seed++) * (z1 - z0);
    if (!inPoly(x, z, pts)) continue;
    const before = trees.length;
    addTree(x, z, (a.k === 1 ? 4.5 : 3.5) + hash(seed++) * 3);
    if (trees.length > before) placed++;
  }
});

// ——— superyachts in Port Hercule ———————————————————————————————————

const marina = elements.find((e) => e.tags?.name === "Port Hercule de Monaco");
const marinaRings = marina ? outerRingsOf(marina) : [];
const inMarina = (x, z) => marinaRings.some((r) => inPoly(x, z, r));
const yachts = [];
const occupied = (x, z, r) => yachts.some((y) => Math.hypot(y[0] / 10 - x, y[1] / 10 - z) < r + y[2] / 25);
const berth = (a, b, outward, maxLen) => {
  const dx = b[0] - a[0];
  const dz = b[1] - a[1];
  const d = Math.hypot(dx, dz);
  if (d < 10) return;
  const ux = dx / d;
  const uz = dz / d;
  const nx = -uz * outward;
  const nz = ux * outward;
  for (let s = 6; s < d - 6; ) {
    const len = Math.min(maxLen, 12 + hash(seed++) * hash(seed++) * 48);
    const beam = len * 0.2 + 1.5;
    const cx = a[0] + ux * s + nx * (len / 2 + 1);
    const cz = a[1] + uz * s + nz * (len / 2 + 1);
    s += beam + 1.2;
    if (!isSea(cx, cz) || !inMarina(cx, cz)) continue;
    if (!isSea(cx + nx * len * 0.45, cz + nz * len * 0.45)) continue;
    if (occupied(cx, cz, len * 0.35)) continue;
    // moored stern-to: the bow points out into the basin
    yachts.push([q(cx), q(cz), q(len), Math.round(Math.atan2(nx, nz) * 1000)]);
  }
};
areas
  .filter((a) => a.k === 3)
  .forEach((a) => {
    const pts = [];
    for (let k = 0; k < a.p.length; k += 2) pts.push([a.p[k] / 10, a.p[k + 1] / 10]);
    const cw = area(pts) > 0 ? 1 : -1;
    for (let i = 0; i < pts.length - 1; i++) {
      berth(pts[i], pts[i + 1], cw, 55);
    }
  });
pierLines.forEach((pl) => {
  const pts = [];
  for (let k = 0; k < pl.p.length; k += 2) pts.push([pl.p[k] / 10, pl.p[k + 1] / 10]);
  for (let i = 0; i < pts.length - 1; i++) {
    berth(pts[i], pts[i + 1], 1, 34);
    berth(pts[i], pts[i + 1], -1, 34);
  }
});

// ——— encode ————————————————————————————————————————————————————

const b64i16 = (arr, scale) => {
  const buf = Buffer.alloc(arr.length * 2);
  arr.forEach((v, i) => buf.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(v * scale))), i * 2));
  return buf.toString("base64");
};

const scene = {
  attribution:
    "© OpenStreetMap contributors (ODbL) · Terrain: Mapzen/AWS Terrain Tiles · Track: bacinger/f1-circuits",
  origin: { lat: LAT0, lon: LON0 },
  bounds: { x0: X0, x1: X1, z0: Z0, z1: Z1 },
  track: {
    step: 2,
    length: lapLength,
    p: centre.flatMap(([x, z]) => [q(x), q(z)]),
    y: trackY.map((v) => q(v)),
    tunnel,
  },
  terrain: { x0: X0, z0: Z0, step: STEP, w: GW, h: GH, data: b64i16(terrainFinal, 10) },
  outer: { x0: OX0, z0: OZ0, step: OSTEP, w: OW, h: OH, data: b64i16(outer, 1) },
  sea: seaRings.map((r) => r.flatMap(([x, z]) => [q(x), q(z)])),
  land: landRings.map((r) => r.flatMap(([x, z]) => [q(x), q(z)])),
  buildings,
  roads,
  areas,
  piers: pierLines,
  pit: pitLane.flatMap(([x, z, y]) => [q(x), q(z), q(y)]),
  trees,
  yachts,
};

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(scene));
console.log(
  `lap ${lapLength.toFixed(0)} m · tunnel ${tunnel} · ${buildings.length} buildings · ${roads.length} roads · ${areas.length} areas · ${trees.length} trees · ${yachts.length} yachts · sea rings ${seaRings.length} (${pieces.length} pieces) · land rings ${landRings.length}`
);
console.log("track y range", Math.min(...trackY).toFixed(1), Math.max(...trackY).toFixed(1));
console.log("size", (fs.statSync(OUT).size / 1024).toFixed(0), "KB");
