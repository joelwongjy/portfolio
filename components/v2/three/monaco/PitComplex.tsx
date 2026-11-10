import { ThreeEvent, useThree } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import { project as projectData } from "@/data/projects";

import { PROJECT_ICONS, ProjectIcon } from "../../projectIcons";
import { City } from "./city";
import { withCutaway } from "./cutaway";
import {
  carGeometry,
  doorFrame,
  garageCars,
  garageGeometry,
  GROUND_FLOOR,
  PIT_HALF,
  pitBoxGeometry,
  pitLaneGeometry,
  pitLayout,
  SCREEN,
  UNIT_W,
  WORKING_LANE,
} from "./pit";
import { grandstandGeometry, parasolGeometry, poolside } from "./stands";
import { coralSurface } from "./track";

export interface PitProject {
  title: string;
  color: string;
  icon: ProjectIcon;
}

const CAR_SCALE = 1.25;
const ALL_PROJECTS = [...projectData.favoriteProjects.projects, ...projectData.otherProjects.projects];

const canvas = (w: number, h: number) => {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return [c, c.getContext("2d")!] as const;
};

// 9 m × 16 m of pit lane, after the real one: grey concrete on the working
// lane by the garages, red-brown on the fast lane, a double dashed yellow
// line between them and a white line along the pit wall
const laneTexture = (dividerU: number, garageRight: boolean) => {
  const W = 288;
  const H = 512;
  const [c, ctx] = canvas(W, H);
  const x = dividerU * W;
  const speckle = (x0: number, x1: number, base: string, light: string, dark: string) => {
    ctx.fillStyle = base;
    ctx.fillRect(x0, 0, x1 - x0, H);
    for (let i = 0; i < ((x1 - x0) * H) / 20; i++) {
      ctx.fillStyle = Math.random() < 0.5 ? light : dark;
      ctx.fillRect(x0 + Math.random() * (x1 - x0), Math.random() * H, 1.4, 1.4);
    }
  };
  const grey = ["#77777A", "rgba(255,255,255,0.08)", "rgba(0,0,0,0.12)"] as const;
  const red = ["#843A33", "rgba(255,220,210,0.07)", "rgba(40,0,0,0.14)"] as const;
  if (garageRight) {
    speckle(0, x, ...red);
    speckle(x, W, ...grey);
  } else {
    speckle(0, x, ...grey);
    speckle(x, W, ...red);
  }
  ctx.fillStyle = "#F2C230";
  for (let y = 0; y < H; y += 64) {
    ctx.fillRect(x - 9, y + 6, 5, 34);
    ctx.fillRect(x + 4, y + 6, 5, 34);
  }
  ctx.fillStyle = "#F4F1EC";
  if (garageRight) ctx.fillRect(4, 0, 5, H);
  else ctx.fillRect(W - 9, 0, 5, H);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  return tex;
};

// the merge lanes are road: the circuit's coral with a white edge line
const mergeTexture = () => {
  const [c, ctx] = canvas(288, 512);
  coralSurface(ctx, 288, 512);
  ctx.fillStyle = "#FBF8F6";
  ctx.fillRect(3, 0, 5, 512);
  ctx.fillRect(280, 0, 5, 512);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  return tex;
};

// the project's screen on the garage's back wall: its screenshot, name,
// tagline and stack, like the timing screens teams hang in their garages
const screenTexture = (p: PitProject, invalidate: () => void) => {
  const W = 1520;
  const H = Math.round((W * SCREEN.h) / SCREEN.w);
  const [c, ctx] = canvas(W, H);
  const data = ALL_PROJECTS.find((q) => q.title === p.title);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  const font = (w: number, px: number) => `${w} ${px}px system-ui, -apple-system, "Segoe UI", sans-serif`;
  const paint = (img?: HTMLImageElement) => {
    ctx.fillStyle = "#0C0E13";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = p.color;
    ctx.fillRect(0, 0, W, 14);
    // screenshot panel
    const sx = 36;
    const sy = 50;
    const sw = Math.round(W * 0.47);
    const sh = H - 86;
    ctx.fillStyle = "#1A1D24";
    ctx.fillRect(sx, sy, sw, sh);
    if (img) {
      const k = Math.min(sw / img.width, sh / img.height);
      const w = img.width * k;
      const h = img.height * k;
      ctx.drawImage(img, sx + (sw - w) / 2, sy + (sh - h) / 2, w, h);
    } else {
      ctx.fillStyle = "rgba(255,255,255,0.25)";
      ctx.font = font(700, 34);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(p.title.toUpperCase(), sx + sw / 2, sy + sh / 2);
      ctx.textAlign = "left";
    }
    // copy
    const x = sx + sw + 52;
    const maxW = W - x - 40;
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = p.color;
    ctx.font = font(800, 30);
    ctx.fillText("GARAGE · SIDE PROJECT", x, 104);
    ctx.fillStyle = "#FFFFFF";
    let size = 108;
    ctx.font = font(900, size);
    while (ctx.measureText(p.title.toUpperCase()).width > maxW && size > 48) {
      size -= 4;
      ctx.font = font(900, size);
    }
    ctx.fillText(p.title.toUpperCase(), x, 104 + size + 6);
    // tagline, wrapped
    ctx.fillStyle = "rgba(255,255,255,0.82)";
    ctx.font = font(500, 40);
    const words = (data?.tagline ?? "").split(" ");
    let line = "";
    let y = 104 + size + 70;
    words.forEach((w) => {
      const next = line ? `${line} ${w}` : w;
      if (ctx.measureText(next).width > maxW && line) {
        ctx.fillText(line, x, y);
        line = w;
        y += 50;
      } else line = next;
    });
    if (line) ctx.fillText(line, x, y);
    // the stack as chips
    let cx = x;
    let cy = H - 92;
    ctx.font = font(700, 26);
    (data?.skills ?? []).slice(0, 8).forEach((skill) => {
      const label = String(skill).toUpperCase();
      const w = ctx.measureText(label).width + 32;
      if (cx + w > W - 40) {
        cx = x;
        cy -= 52;
      }
      ctx.fillStyle = "rgba(255,255,255,0.1)";
      ctx.fillRect(cx, cy, w, 40);
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.fillText(label, cx + 16, cy + 29);
      cx += w + 12;
    });
    tex.needsUpdate = true;
    invalidate();
  };
  paint();
  if (data?.image) {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        paint(img);
      } catch {
        paint();
      }
    };
    img.src = data.image;
  }
  return tex;
};

// the sign over a project's garage: its icon on a tile in its colour, and
// its name, white on near-black, like a team's fascia board
const fasciaTexture = (p: PitProject, H = 120, W = 1024) => {
  const [c, ctx] = canvas(W, H);
  const pad = Math.round(H * 0.14);
  const tile = H - pad * 2 - Math.round(H * 0.08);
  ctx.fillStyle = "#121318";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = p.color;
  ctx.fillRect(0, H - Math.round(H * 0.1), W, Math.round(H * 0.1));
  // icon tile
  ctx.beginPath();
  ctx.roundRect(pad, pad, tile, tile, tile * 0.2);
  ctx.fill();
  ctx.save();
  const k = (tile * 0.62) / 24;
  ctx.translate(pad + (tile - 24 * k) / 2, pad + (tile - 24 * k) / 2);
  ctx.scale(k, k);
  ctx.strokeStyle = "#FFFFFF";
  ctx.lineWidth = 2.2;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.stroke(new Path2D(PROJECT_ICONS[p.icon]));
  ctx.restore();
  ctx.fillStyle = "#FFFFFF";
  const title = p.title.toUpperCase();
  let size = Math.round(tile * 0.78);
  const x = pad * 2 + tile;
  ctx.font = `800 ${size}px system-ui, -apple-system, sans-serif`;
  while (ctx.measureText(title).width > W - x - pad && size > 20) {
    size -= 2;
    ctx.font = `800 ${size}px system-ui, -apple-system, sans-serif`;
  }
  ctx.textBaseline = "middle";
  ctx.fillText(title, x, pad + tile / 2 + size * 0.04);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
};

export const PitComplex = ({
  city,
  projects,
  selected = null,
  onSelect,
}: {
  city: City;
  livery: string;
  projects: PitProject[];
  /** the project garage that's open, if any */
  selected?: number | null;
  /** tap a project garage */
  onSelect?: (i: number) => void;
}) => {
  const { invalidate } = useThree();
  const layout = useMemo(() => pitLayout(city), [city]);
  const lane = useMemo(() => pitLaneGeometry(city), [city]);
  const garages = useMemo(() => garageGeometry(city), [city]);
  const boxes = useMemo(() => pitBoxGeometry(city), [city]);
  const car = useMemo(carGeometry, []);
  const parked = useMemo(() => garageCars(city), [city]);
  const stands = useMemo(() => grandstandGeometry(city), [city]);
  const parasols = useMemo(() => poolside(city), [city]);
  const poolGeo = useMemo(
    () => ({
      red: parasolGeometry("#D93B30"),
      yellow: parasolGeometry("#F2B632"),
      pole: new THREE.CylinderGeometry(0.04, 0.04, 2.3, 5).translate(0, 1.15, 0),
      lounger: new THREE.BoxGeometry(0.7, 0.3, 1.9).translate(0, 0.25, 0),
    }),
    []
  );

  const mats = useMemo(() => {
    // u runs left → right of travel; the divider sits on the garage side
    const divLat = layout.side * (PIT_HALF - WORKING_LANE);
    return {
      lane: new THREE.MeshStandardMaterial({
        map: laneTexture((divLat + PIT_HALF) / (2 * PIT_HALF), layout.side > 0),
        roughness: 0.92,
        polygonOffset: true,
        polygonOffsetFactor: -3,
        polygonOffsetUnits: -3,
      }),
      merge: new THREE.MeshStandardMaterial({
        map: mergeTexture(),
        roughness: 0.92,
        polygonOffset: true,
        polygonOffsetFactor: -3,
        polygonOffsetUnits: -3,
      }),
      skirt: new THREE.MeshStandardMaterial({ color: "#CFC9BD", roughness: 1, side: THREE.DoubleSide }),
      garages: withCutaway(
        new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.6, metalness: 0.05, envMapIntensity: 0.6 })
      ),
      boxes: new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: 0.8,
        polygonOffset: true,
        polygonOffsetFactor: -5,
        polygonOffsetUnits: -5,
      }),
      car: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.38, metalness: 0.1 }),
      stands: withCutaway(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.75 })),
      parasol: withCutaway(
        new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8, side: THREE.DoubleSide })
      ),
      pole: new THREE.MeshStandardMaterial({ color: "#8E939B", roughness: 0.5 }),
      lounger: new THREE.MeshStandardMaterial({ color: "#F6F5F1", roughness: 0.7 }),
      lightOn: new THREE.MeshBasicMaterial({ color: new THREE.Color(1.6, 1.55, 1.4), toneMapped: false }),
      lightOff: new THREE.MeshBasicMaterial({ color: "#C9CCD1" }),
      hit: new THREE.MeshBasicMaterial({ visible: false }),
    };
  }, [layout]);

  // each project garage: its frame, the fascia sign and the back-wall screen
  const bays = useMemo(
    () =>
      layout.teams
        .filter((t) => t.project >= 0 && projects[t.project])
        .map((t) => {
          const o = doorFrame(layout.at(t.d), layout.side);
          return {
            key: t.project,
            depth: t.depth,
            position: [o.x, o.y, o.z] as THREE.Vector3Tuple,
            // local +z points out of the door
            yaw: Math.atan2(o.nx, o.nz),
            fascia: fasciaTexture(projects[t.project], 128, Math.round((128 * (UNIT_W - 0.5)) / 0.62)),
            screen: screenTexture(projects[t.project], invalidate),
          };
        }),
    [layout, projects, invalidate]
  );

  const carRef = useRef<THREE.InstancedMesh>(null);
  const redRef = useRef<THREE.InstancedMesh>(null);
  const yellowRef = useRef<THREE.InstancedMesh>(null);
  const poleRef = useRef<THREE.InstancedMesh>(null);
  const loungerRef = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const o = new THREE.Object3D();
    const counts = { red: 0, yellow: 0 };
    parasols.forEach((p, i) => {
      const m = p.tone ? redRef.current : yellowRef.current;
      const key = p.tone ? "red" : "yellow";
      o.position.set(p.x, p.y + 2.3, p.z);
      o.rotation.set(0, p.yaw, 0);
      o.scale.set(1.35, 1, 1.35);
      o.updateMatrix();
      m?.setMatrixAt(counts[key]++, o.matrix);
      o.position.set(p.x, p.y, p.z);
      o.scale.setScalar(1);
      o.updateMatrix();
      poleRef.current?.setMatrixAt(i, o.matrix);
      // two loungers in its shade, facing the pool
      [-0.55, 0.55].forEach((u, k) => {
        const cx = Math.cos(p.yaw);
        const sx = Math.sin(p.yaw);
        o.position.set(p.x + cx * u - sx * 0.6, p.y, p.z - sx * u - cx * 0.6);
        o.updateMatrix();
        loungerRef.current?.setMatrixAt(i * 2 + k, o.matrix);
      });
    });
    if (redRef.current) redRef.current.count = counts.red;
    if (yellowRef.current) yellowRef.current.count = counts.yellow;
    [redRef, yellowRef, poleRef, loungerRef].forEach((r) => {
      if (!r.current) return;
      r.current.instanceMatrix.needsUpdate = true;
      r.current.computeBoundingSphere();
    });
  }, [parasols]);
  useLayoutEffect(() => {
    const m = carRef.current;
    if (!m) return;
    const o = new THREE.Object3D();
    const c = new THREE.Color();
    parked.forEach((p, i) => {
      o.position.set(p.x, p.y + 0.06, p.z);
      o.rotation.set(0, p.yaw, 0);
      o.scale.setScalar(CAR_SCALE);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
      const color = p.project >= 0 && projects[p.project] ? projects[p.project].color : p.color;
      m.setColorAt(i, c.set(color));
    });
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
    m.computeBoundingSphere();
  }, [parked, projects]);

  useEffect(
    () => () => {
      [lane.main, lane.merges, lane.skirt, garages, boxes, car, stands, ...Object.values(poolGeo)].forEach((g) =>
        g?.dispose()
      );
      Object.values(mats).forEach((m) => {
        (m as THREE.MeshStandardMaterial).map?.dispose();
        m.dispose();
      });
      bays.forEach((b) => {
        b.fascia.dispose();
        b.screen.dispose();
      });
    },
    [lane, garages, boxes, car, stands, poolGeo, mats, bays]
  );

  const sel = bays.find((b) => b.key === selected);
  const lightAt: THREE.Vector3Tuple = sel
    ? [
        sel.position[0] - Math.sin(sel.yaw) * sel.depth * 0.45,
        sel.position[1] + GROUND_FLOOR - 0.9,
        sel.position[2] - Math.cos(sel.yaw) * sel.depth * 0.45,
      ]
    : [0, -100, 0];

  if (!layout.teams.length) return null;

  const H = GROUND_FLOOR;
  const tap = (i: number) => (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onSelect?.(i);
  };
  const over = (e: ThreeEvent<PointerEvent>) => {
    if (!onSelect) return;
    e.stopPropagation();
    document.body.style.cursor = "pointer";
  };
  const out = () => {
    document.body.style.cursor = "";
  };

  return (
    <group>
      <mesh geometry={lane.merges} material={mats.merge} receiveShadow />
      <mesh geometry={lane.main} material={mats.lane} receiveShadow />
      <mesh geometry={lane.skirt} material={mats.skirt} />
      <mesh geometry={boxes} material={mats.boxes} receiveShadow />
      <mesh geometry={garages} material={mats.garages} castShadow receiveShadow />
      {bays.map((b) => {
        const on = selected === b.key;
        const D = b.depth;
        return (
          <group key={b.key} position={b.position} rotation={[0, b.yaw, 0]}>
            {/* the project's name over the door */}
            <mesh position={[0, H - 0.4, 0.17]}>
              <planeGeometry args={[UNIT_W - 0.5, 0.62]} />
              <meshBasicMaterial map={b.fascia} toneMapped={false} />
            </mesh>
            {/* its screen on the back wall */}
            <mesh position={[0, SCREEN.y, -D + SCREEN.inset]}>
              <planeGeometry args={[SCREEN.w, SCREEN.h]} />
              <meshBasicMaterial map={b.screen} toneMapped={false} />
            </mesh>
            <mesh position={[0, SCREEN.y, -D + SCREEN.inset - 0.03]}>
              <boxGeometry args={[SCREEN.w + 0.24, SCREEN.h + 0.24, 0.06]} />
              <meshStandardMaterial color="#0A0B0E" roughness={0.4} />
            </mesh>
            {/* ceiling lights, bright when the garage is open */}
            {[-2.4, 2.4].map((u) => (
              <mesh key={u} position={[u, H - 0.33, -D / 2]} material={on ? mats.lightOn : mats.lightOff}>
                <boxGeometry args={[0.35, 0.05, D * 0.7]} />
              </mesh>
            ))}
            {/* tap target: a plane over the door opening and the fascia */}
            <mesh
              position={[0, H / 2, 0.25]}
              material={mats.hit}
              onClick={tap(b.key)}
              onPointerOver={over}
              onPointerOut={out}
            >
              <planeGeometry args={[UNIT_W - 0.4, H]} />
            </mesh>
          </group>
        );
      })}
      {/* one light that follows the open garage, so the light count (and
          every material's shader) never changes */}
      <pointLight
        position={lightAt}
        intensity={selected != null && bays.some((b) => b.key === selected) ? 70 : 0}
        distance={18}
        decay={2}
        color="#FFF4E0"
      />
      <instancedMesh ref={carRef} args={[car, mats.car, parked.length]} castShadow receiveShadow />
      {stands && <mesh geometry={stands} material={mats.stands} castShadow receiveShadow />}
      {parasols.length > 0 && (
        <>
          <instancedMesh ref={redRef} args={[poolGeo.red, mats.parasol, parasols.length]} castShadow />
          <instancedMesh ref={yellowRef} args={[poolGeo.yellow, mats.parasol, parasols.length]} castShadow />
          <instancedMesh ref={poleRef} args={[poolGeo.pole, mats.pole, parasols.length]} />
          <instancedMesh ref={loungerRef} args={[poolGeo.lounger, mats.lounger, parasols.length * 2]} receiveShadow />
        </>
      )}
    </group>
  );
};
