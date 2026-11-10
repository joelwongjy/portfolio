import * as THREE from "three";

import { City } from "./city";

// Trees as soft, faceted canopies (the map-app look), and Riviera palms
// wherever a tree stands near the water.

const hash = (n: number) => {
  const s = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
  return s - Math.floor(s);
};

export interface TreeInstance {
  x: number;
  y: number;
  z: number;
  s: number;
  palm: boolean;
  tone: number;
}

export const treeInstances = (city: City): TreeInstance[] => {
  const out: TreeInstance[] = [];
  city.raw.trees.forEach(([qx, qz, qs], i) => {
    const x = qx / 10;
    const z = qz / 10;
    // palms line the harbour front
    let nearWater = false;
    for (let k = 0; k < 8 && !nearWater; k++) {
      const a = (k / 8) * Math.PI * 2;
      nearWater = city.isSea(x + Math.cos(a) * 34, z + Math.sin(a) * 34);
    }
    out.push({
      x,
      y: city.groundAt(x, z),
      z,
      s: qs / 10,
      palm: nearWater && hash(i) < 0.75,
      tone: hash(i + 0.37),
    });
  });
  return out;
};

// a lumpy low-poly canopy, normalised to a unit radius
export const canopyGeometry = () => {
  const g = new THREE.IcosahedronGeometry(1, 1);
  const p = g.getAttribute("position");
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const n = 1 + 0.12 * Math.sin(v.x * 5.1 + v.y * 3.3) * Math.cos(v.z * 4.7);
    v.multiplyScalar(n);
    v.y *= 0.82;
    p.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  return g;
};

export const trunkGeometry = () => {
  const g = new THREE.CylinderGeometry(0.09, 0.14, 1, 5);
  g.translate(0, 0.5, 0);
  return g;
};

// seven drooping fronds radiating from the crown
export const palmCrownGeometry = () => {
  const pos: number[] = [];
  const idx: number[] = [];
  const FRONDS = 8;
  const SEG = 5;
  for (let f = 0; f < FRONDS; f++) {
    const a = (f / FRONDS) * Math.PI * 2 + (f % 2) * 0.2;
    const ca = Math.cos(a);
    const sa = Math.sin(a);
    const base = pos.length / 3;
    for (let s = 0; s <= SEG; s++) {
      const t = s / SEG;
      const r = t * 1;
      const y = Math.sin(t * Math.PI * 0.85) * 0.28 - t * t * 0.55;
      const w = Math.sin(t * Math.PI) * 0.22 + 0.02;
      const cx = ca * r;
      const cz = sa * r;
      pos.push(cx - sa * w, y, cz + ca * w, cx + sa * w, y, cz - ca * w);
      if (s < SEG) {
        const A = base + s * 2;
        idx.push(A, A + 2, A + 1, A + 1, A + 2, A + 3);
      }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
};

export const TREE_TONES = ["#6FA85B", "#5F9C4F", "#7DB466", "#86BA6C", "#679F55", "#93C177"];
export const PALM_TONES = ["#7FA956", "#8CB35E", "#739F4E"];

export const placeTrees = (
  trees: TreeInstance[],
  canopy: THREE.InstancedMesh,
  trunk: THREE.InstancedMesh,
  crown: THREE.InstancedMesh,
  palmTrunk: THREE.InstancedMesh
) => {
  const o = new THREE.Object3D();
  const c = new THREE.Color();
  let ti = 0;
  let pi = 0;
  trees.forEach((t, i) => {
    if (t.palm) {
      const h = 7 + t.tone * 5;
      o.position.set(t.x, t.y, t.z);
      o.rotation.set((t.tone - 0.5) * 0.12, 0, (hash(i) - 0.5) * 0.12);
      o.scale.set(1.6, h, 1.6);
      o.updateMatrix();
      palmTrunk.setMatrixAt(pi, o.matrix);
      o.position.set(t.x, t.y + h, t.z);
      o.rotation.set(0, t.tone * 6.28, 0);
      o.scale.setScalar(3.4 + t.tone * 1.4);
      o.updateMatrix();
      crown.setMatrixAt(pi, o.matrix);
      crown.setColorAt(pi, c.set(PALM_TONES[i % PALM_TONES.length]));
      pi++;
    } else {
      const r = t.s * 0.55;
      const trunkH = 1.6 + r * 0.5;
      o.position.set(t.x, t.y, t.z);
      o.rotation.set(0, 0, 0);
      o.scale.set(r * 1.4, trunkH, r * 1.4);
      o.updateMatrix();
      trunk.setMatrixAt(ti, o.matrix);
      o.position.set(t.x, t.y + trunkH + r * 0.7, t.z);
      o.rotation.set(0, t.tone * 6.28, 0);
      o.scale.set(r, r * (0.9 + t.tone * 0.25), r);
      o.updateMatrix();
      canopy.setMatrixAt(ti, o.matrix);
      canopy.setColorAt(ti, c.set(TREE_TONES[Math.floor(t.tone * TREE_TONES.length)]));
      ti++;
    }
  });
  canopy.count = trunk.count = ti;
  crown.count = palmTrunk.count = pi;
  [canopy, trunk, crown, palmTrunk].forEach((m) => {
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
    m.computeBoundingSphere();
  });
};

// ——— superyachts ————————————————————————————————————————————————

// A unit-length motor yacht (bow toward +z): a pointed white hull, a dark
// boot stripe, two stepped decks of tinted glass and a teak aft deck.
export const yachtGeometry = () => {
  const parts: { geo: THREE.BufferGeometry; color: string }[] = [];
  const hullShape = new THREE.Shape();
  hullShape.moveTo(-0.1, -0.5);
  hullShape.lineTo(0.1, -0.5);
  hullShape.quadraticCurveTo(0.11, 0.15, 0.0, 0.5);
  hullShape.quadraticCurveTo(-0.11, 0.15, -0.1, -0.5);
  const extrude = (shape: THREE.Shape, depth: number, y: number, color: string, scale = 1) => {
    const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 6 });
    // shape y (the bow) → +z, extrusion → +y
    g.rotateX(Math.PI / 2);
    g.scale(scale, 1, scale);
    g.translate(0, y + depth, 0);
    parts.push({ geo: g, color });
  };
  extrude(hullShape, 0.03, -0.01, "#20252E");
  extrude(hullShape, 0.07, 0.02, "#FBFBF8");
  // teak deck
  extrude(hullShape, 0.004, 0.09, "#C9A57A", 0.92);
  const deck = (w: number, l: number, y: number, z: number, h: number, color: string) => {
    const g = new THREE.BoxGeometry(w, h, l);
    g.translate(0, y + h / 2, z);
    parts.push({ geo: g, color });
  };
  deck(0.15, 0.5, 0.09, -0.04, 0.05, "#F7F7F3");
  deck(0.152, 0.46, 0.105, -0.03, 0.018, "#2B3440");
  deck(0.12, 0.32, 0.14, -0.06, 0.045, "#F7F7F3");
  deck(0.122, 0.28, 0.152, -0.05, 0.016, "#2B3440");
  deck(0.08, 0.14, 0.185, -0.08, 0.03, "#F2F2EE");

  const pos: number[] = [];
  const nor: number[] = [];
  const col: number[] = [];
  const c = new THREE.Color();
  parts.forEach(({ geo, color }) => {
    const g = geo.index ? geo.toNonIndexed() : geo;
    const p = g.getAttribute("position");
    g.computeVertexNormals();
    const n = g.getAttribute("normal");
    c.set(color);
    for (let i = 0; i < p.count; i++) {
      pos.push(p.getX(i), p.getY(i), p.getZ(i));
      nor.push(n.getX(i), n.getY(i), n.getZ(i));
      col.push(c.r, c.g, c.b);
    }
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  return g;
};

export const placeYachts = (city: City, mesh: THREE.InstancedMesh) => {
  const o = new THREE.Object3D();
  city.raw.yachts.forEach(([qx, qz, ql, qr], i) => {
    const l = ql / 10;
    o.position.set(qx / 10, 0.25, qz / 10);
    o.rotation.set(0, qr / 1000, 0);
    o.scale.setScalar(l);
    o.updateMatrix();
    mesh.setMatrixAt(i, o.matrix);
  });
  mesh.count = city.raw.yachts.length;
  mesh.instanceMatrix.needsUpdate = true;
  mesh.computeBoundingSphere();
};
