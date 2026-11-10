import * as THREE from "three";

import { HALF_ROAD, Track } from "./city";
import { inPitGap, pitGapsFor } from "./pitLane";
import { BARRIER } from "./track";

// Trackside advertising boards: a run of boards on the barriers either side
// of each career corner, branded for that job, the way circuits sell the
// boards around every apex.

export interface BoardBrand {
  name: string;
  role: string;
  color: string;
  logo?: string;
  /** CSS font-family for the print (the app's broadcast face) */
  font?: string;
}

export const BOARD_LENGTH = 9; // metres per printed board
const BOARD_H = 1.25;

/** a board texture: a white logo plate, then the name and role on the brand colour */
export const boardTexture = (b: BoardBrand) => {
  const W = 1152;
  const H = 160;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d")!;
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  const face = b.font ?? "system-ui, sans-serif";
  let logo: HTMLImageElement | undefined;
  const paint = (img: HTMLImageElement | undefined = logo) => {
    ctx.fillStyle = b.color;
    ctx.fillRect(0, 0, W, H);
    // white logo plate
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(28, 22, 380, H - 44);
    if (img) {
      const h = H - 76;
      const w = Math.min((img.width / img.height) * h, 330);
      ctx.drawImage(img, 28 + (380 - w) / 2, 38, w, h);
    } else {
      ctx.fillStyle = b.color;
      ctx.font = `900 64px ${face}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(b.name.toUpperCase(), 28 + 190, H / 2 + 4);
    }
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#FFFFFF";
    ctx.font = `italic 900 70px ${face}`;
    ctx.fillText(b.name.toUpperCase(), 446, H / 2 - 16);
    ctx.globalAlpha = 0.8;
    ctx.font = `700 34px ${face}`;
    ctx.fillText(b.role.toUpperCase(), 450, H / 2 + 40);
    ctx.globalAlpha = 1;
    tex.needsUpdate = true;
  };
  paint();
  if (b.logo) {
    const img = new Image();
    img.onload = () => {
      logo = img;
      paint();
    };
    img.src = b.logo;
  }
  // repaint once the web font is ready
  document.fonts?.ready.then(() => paint());
  return tex;
};

/**
 * Boards facing the road on both sides between two lap distances (m).
 * Each side is built so its front faces the track and the print reads
 * left-to-right from the car.
 */
export const boardGeometry = (t: Track, fromM: number, toM: number) => {
  const pos: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  const [ta, tb] = t.tunnel;
  const n = t.n;
  const gaps = pitGapsFor(t);
  const s0 = Math.round(fromM / t.step);
  const s1 = Math.round(toM / t.step);
  ([1, -1] as const).forEach((side) => {
    // walk so the board's front faces the road: on the right-hand side,
    // run against the lap direction
    const order: number[] = [];
    for (let s = s0; s <= s1; s++) order.push(s);
    if (side === 1) order.reverse();
    let arc = 0;
    const base = pos.length / 3;
    order.forEach((s, k) => {
      const i = ((s % n) + n) % n;
      const inTunnel = i >= ta && i <= tb;
      const lat = side * (inTunnel ? HALF_ROAD + 1.15 : BARRIER - 0.06);
      const x = t.pos[i * 3];
      const y = t.pos[i * 3 + 1];
      const z = t.pos[i * 3 + 2];
      const rx = -t.tan[i * 2 + 1];
      const rz = t.tan[i * 2];
      const px = x + rx * lat;
      const pz = z + rz * lat;
      if (k > 0) arc += t.step;
      pos.push(px, y + 0.08, pz, px, y + 0.08 + BOARD_H, pz);
      const u = arc / BOARD_LENGTH;
      uv.push(u, 0, u, 1);
      // leave the boards open where the pit lane crosses the barrier line
      const open = inPitGap(gaps, side, i) || inPitGap(gaps, side, (((order[k - 1] ?? s) % n) + n) % n);
      if (k > 0 && !open) {
        const a = base + (k - 1) * 2;
        idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
      }
    });
  });
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
};
