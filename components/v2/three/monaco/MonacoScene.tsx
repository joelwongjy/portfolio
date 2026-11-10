import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  MutableRefObject,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import * as THREE from "three";

import { project } from "@/data/projects";

import { CHAPTERS, LAP_LENGTH } from "../../lap";
import { PROJECT_ICONS } from "../../projectIcons";
import { distanceAt, DriverLap } from "../../telemetry";
import { BoardBrand, boardGeometry, boardTexture } from "./banners";
import { buildingsGeometry, buildingsMaterial, skylineGrid } from "./buildings";
import { City, HALF_ROAD, loadCity, trackPose } from "./city";
import { MapMode, PinInfo, SceneCtrl, Telemetry } from "./ctrl";
import { cutaway, withCutaway } from "./cutaway";
import { F1Car } from "./F1Car";
import {
  canopyGeometry,
  palmCrownGeometry,
  placeTrees,
  placeYachts,
  treeInstances,
  trunkGeometry,
  yachtGeometry,
} from "./flora";
import { groundMaps, groundMaterial, stoneMaterial } from "./ground";
import { projectGarages } from "./pit";
import { PitComplex } from "./PitComplex";
import {
  outerTerrainGeometry,
  rippleNormals,
  terrainGeometry,
} from "./terrain";
import {
  asphaltTexture,
  BARRIER,
  barrierTexture,
  fencePosts,
  fenceTexture,
  gridTexture,
  kerbTexture,
  raceLine,
  RaceLine,
  routeGeometry,
  routeTexture,
  trackGeometries,
} from "./track";

export interface BannerInfo {
  name: string;
  logo?: string;
  year?: string;
}

export interface SceneProps {
  ctrl: MutableRefObject<SceneCtrl>;
  /** the app calls this after changing ctrl, to wake the render loop */
  wakeRef: MutableRefObject<() => void>;
  livery: string;
  /** the lap the car drives, by time */
  lap: DriverLap | null;
  /** trackside board branding for each career corner */
  boards: BoardBrand[];
  chapterPins: PinInfo[];
  garagePins: PinInfo[];
  onChapterPin: (i: number) => void;
  onGaragePin: (i: number) => void;
  onTelemetry: (t: Telemetry) => void;
  /** the garage open in the pits, for its lights and highlight */
  pitSelected?: number | null;
  /** a compass needle the scene rotates with the camera */
  compassRef?: MutableRefObject<HTMLElement | null>;
  /** live content pinned in perspective onto the open garage's screen;
   * the scene sets its transform, opacity and pointer events each frame */
  garageScreenRef?: MutableRefObject<HTMLElement | null>;
  /** design size (px) of that content, matching the screen's aspect */
  garageScreenSize?: { w: number; h: number };
}

const PIT_PROJECTS = [...project.favoriteProjects.projects, ...project.otherProjects.projects].map(
  (p) => ({ title: p.title, color: p.color, icon: p.icon })
);

const SKY_TOP = new THREE.Color("#6FA8DC");
const SKY_HORIZON = new THREE.Color("#E4ECF1");
const FOG = "#DCE6EC";
const GANTRY_LEAD = 28; // metres before the apex
const GRID_SLOT = { back: 5, lateral: -(HALF_ROAD * 2 * 0.22) }; // pole position

const smooth = (a: number, b: number, v: number) => {
  const t = THREE.MathUtils.clamp((v - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

// ——— sky & environment ————————————————————————————————————————————

const skyMaterial = () =>
  new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms: { top: { value: SKY_TOP }, horizon: { value: SKY_HORIZON } },
    vertexShader: `varying vec3 vDir;
      void main() {
        vDir = normalize(position);
        vec4 p = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * p;
        gl_Position.z = gl_Position.w; // pin to the far plane
      }`,
    fragmentShader: `uniform vec3 top; uniform vec3 horizon; varying vec3 vDir;
      void main() {
        float h = clamp(vDir.y, 0.0, 1.0);
        vec3 c = mix(horizon, top, pow(smoothstep(0.0, 0.75, h), 0.65));
        gl_FragColor = vec4(c, 1.0);
        #include <colorspace_fragment>
      }`,
  });

const Sky = () => {
  const ref = useRef<THREE.Mesh>(null);
  const mat = useMemo(skyMaterial, []);
  const { gl, scene } = useThree();
  useLayoutEffect(() => {
    // a soft sky for image-based light and reflections
    const pmrem = new THREE.PMREMGenerator(gl);
    const env = new THREE.Scene();
    env.add(new THREE.Mesh(new THREE.SphereGeometry(10, 32, 16), skyMaterial()));
    const sun = new THREE.Mesh(
      new THREE.SphereGeometry(0.9, 16, 8),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(9, 8.4, 7.2) })
    );
    sun.position.set(-4.5, 7.5, 4);
    env.add(sun);
    const rt = pmrem.fromScene(env, 0.035);
    scene.environment = rt.texture;
    return () => {
      scene.environment = null;
      rt.dispose();
      pmrem.dispose();
    };
  }, [gl, scene]);
  useFrame(({ camera }) => ref.current?.position.copy(camera.position));
  return (
    <mesh ref={ref} material={mat} renderOrder={-1} frustumCulled={false}>
      <sphereGeometry args={[100, 32, 16]} />
    </mesh>
  );
};

// ——— career gantries ———————————————————————————————————————————————

const panelTexture = (info: BannerInfo, livery: string) => {
  const c = document.createElement("canvas");
  c.width = 640;
  c.height = 128;
  const ctx = c.getContext("2d")!;
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  const paint = (img?: HTMLImageElement) => {
    ctx.fillStyle = "#FBFAF7";
    ctx.fillRect(0, 0, 640, 128);
    ctx.fillStyle = livery;
    ctx.fillRect(0, 112, 640, 16);
    if (img) {
      const h = 70;
      const w = Math.min((img.width / img.height) * h, 420);
      ctx.drawImage(img, 36, 21, w, h);
    } else {
      ctx.fillStyle = "#16181E";
      ctx.font = "800 58px system-ui, sans-serif";
      ctx.textBaseline = "middle";
      ctx.fillText(info.name.toUpperCase(), 36, 58);
    }
    if (info.year) {
      ctx.fillStyle = "#16181E";
      ctx.font = "700 34px system-ui, sans-serif";
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      ctx.fillText(info.year, 604, 58);
      ctx.textAlign = "left";
    }
    tex.needsUpdate = true;
  };
  paint();
  if (info.logo) {
    const img = new Image();
    img.onload = () => paint(img);
    img.src = info.logo;
  }
  return tex;
};

const Gantry = ({
  city,
  at,
  texture,
  frame,
}: {
  city: City;
  at: number;
  texture?: THREE.Texture;
  frame: THREE.Material;
}) => {
  const p = trackPose(city.track, at, { x: 0, y: 0, z: 0, tx: 0, tz: 0 });
  const yaw = Math.atan2(-p.tx, -p.tz); // panel faces the oncoming car
  const span = BARRIER + 0.5;
  // underground the sign hangs from the tunnel roof instead
  const [ta, tb] = city.track.tunnel;
  const si = at / city.track.step;
  const low = si > ta - 3 && si < tb + 3;
  const top = low ? 5.7 : 7.6;
  return (
    <group position={[p.x, p.y, p.z]} rotation={[0, yaw, 0]}>
      {!low &&
        [-span, span].map((x) => (
          <mesh key={x} position={[x, top / 2, 0]} material={frame} castShadow>
            <boxGeometry args={[0.45, top, 0.45]} />
          </mesh>
        ))}
      <mesh position={[0, top - 0.25, 0]} material={frame} castShadow>
        <boxGeometry args={[low ? 10.4 : span * 2 + 0.6, 0.55, 0.7]} />
      </mesh>
      {texture && (
        <>
          <mesh position={[0, top - 1.6, 0.13]} castShadow>
            <planeGeometry args={[10, 2]} />
            <meshStandardMaterial map={texture} roughness={0.6} />
          </mesh>
          <mesh position={[0, top - 1.6, 0]} material={frame}>
            <boxGeometry args={[10.1, 2.1, 0.22]} />
          </mesh>
        </>
      )}
    </group>
  );
};

const LIGHT_ON = new THREE.Color("#FF2A12");
const LIGHT_OFF = new THREE.Color("#2A1513");

const StartGantry = ({
  city,
  frame,
  ctrl,
}: {
  city: City;
  frame: THREE.Material;
  ctrl: MutableRefObject<SceneCtrl>;
}) => {
  const lamps = useMemo(
    () => [0, 1, 2, 3, 4].map(() => new THREE.MeshBasicMaterial({ color: LIGHT_OFF, toneMapped: false })),
    []
  );
  useFrame(() => {
    const lit = ctrl.current.lights;
    lamps.forEach((m, i) => m.color.copy(i < lit ? LIGHT_ON : LIGHT_OFF));
  });
  const p = trackPose(city.track, 0, { x: 0, y: 0, z: 0, tx: 0, tz: 0 });
  const yaw = Math.atan2(-p.tx, -p.tz);
  const span = BARRIER + 0.5;
  return (
    <group position={[p.x, p.y, p.z]} rotation={[0, yaw, 0]}>
      {[-span, span].map((x) => (
        <mesh key={x} position={[x, 3.8, 0]} material={frame} castShadow>
          <boxGeometry args={[0.5, 7.6, 0.5]} />
        </mesh>
      ))}
      <mesh position={[0, 7.0, 0]} material={frame} castShadow>
        <boxGeometry args={[span * 2 + 0.6, 1.1, 0.8]} />
      </mesh>
      {[-2.4, -1.2, 0, 1.2, 2.4].map((x, i) => (
        <mesh key={x} position={[x, 7.0, 0.42]} material={lamps[i]}>
          <circleGeometry args={[0.32, 16]} />
        </mesh>
      ))}
    </group>
  );
};

// ——— the world ————————————————————————————————————————————————————

interface WorldProps extends SceneProps {
  city: City;
  chapterPinRefs: MutableRefObject<(HTMLElement | null)[]>;
  garagePinRefs: MutableRefObject<(HTMLElement | null)[]>;
}

const World = (props: WorldProps) => {
  const { city, livery, chapterPins, ctrl } = props;
  const pitSelected = props.pitSelected ?? null;
  const { gl, size } = useThree();
  const small = size.width < 768;

  // a coarse map for the whole tile and a sharp one over the circuit
  const ground = useMemo(() => {
    const max = gl.capabilities.maxTextureSize;
    return groundMaps(city, {
      base: Math.min(max, small ? 2048 : 3072),
      detail: Math.min(max, small ? 3072 : 4096),
      near: Math.min(max, small ? 1024 : 2048),
      nearSize: small ? 130 : 180,
      anisotropy: gl.capabilities.getMaxAnisotropy(),
    });
  }, [city, gl, small]);
  const terrainGeo = useMemo(() => terrainGeometry(city), [city]);
  const outerGeo = useMemo(() => outerTerrainGeometry(city), [city]);
  const buildingGeo = useMemo(() => buildingsGeometry(city), [city]);
  const tg = useMemo(() => trackGeometries(city), [city]);
  const line = useMemo(() => raceLine(city.track), [city]);
  const routeGeo = useMemo(() => routeGeometry(line), [line]);
  const trees = useMemo(() => treeInstances(city), [city]);
  const posts = useMemo(() => fencePosts(city.track), [city]);

  const mats = useMemo(() => {
    const asphalt = asphaltTexture();
    const kerb = kerbTexture();
    const barrier = barrierTexture();
    const fence = fenceTexture();
    fence.repeat.set(1, 8);
    const ripples = rippleNormals();
    ripples.repeat.set(900, 900);
    return {
      ground: withCutaway(groundMaterial(ground)),
      shoulder: groundMaterial(ground, {
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1,
      }),
      skirt: stoneMaterial(),
      road: new THREE.MeshStandardMaterial({
        map: asphalt,
        roughness: 0.92,
        polygonOffset: true,
        polygonOffsetFactor: -2,
        polygonOffsetUnits: -2,
      }),
      kerb: new THREE.MeshStandardMaterial({
        map: kerb,
        roughness: 0.7,
        polygonOffset: true,
        polygonOffsetFactor: -3,
        polygonOffsetUnits: -3,
      }),
      grid: new THREE.MeshStandardMaterial({
        map: gridTexture(),
        transparent: true,
        depthWrite: false,
        roughness: 0.8,
        polygonOffset: true,
        polygonOffsetFactor: -4,
        polygonOffsetUnits: -4,
      }),
      route: new THREE.MeshBasicMaterial({
        map: routeTexture(livery),
        polygonOffset: true,
        polygonOffsetFactor: -6,
        polygonOffsetUnits: -6,
      }),
      barrier: new THREE.MeshStandardMaterial({
        map: barrier,
        roughness: 0.45,
        metalness: 0.15,
        side: THREE.DoubleSide,
      }),
      fence: withCutaway(
        new THREE.MeshStandardMaterial({
          color: "#E6E9ED",
          alphaMap: fence,
          transparent: true,
          opacity: 0.75,
          depthWrite: false,
          side: THREE.DoubleSide,
          roughness: 0.6,
        })
      ),
      post: withCutaway(new THREE.MeshStandardMaterial({ color: "#8A9099", roughness: 0.5, metalness: 0.4 })),
      tunnelWall: withCutaway(
        new THREE.MeshStandardMaterial({ color: "#A39C90", roughness: 0.85, side: THREE.DoubleSide })
      ),
      ceiling: withCutaway(new THREE.MeshStandardMaterial({ color: "#4F4C48", roughness: 0.95 })),
      lights: withCutaway(new THREE.MeshBasicMaterial({ color: "#FFE3AE", toneMapped: false })),
      portal: withCutaway(
        new THREE.MeshStandardMaterial({ color: "#D6CDBC", roughness: 0.9, side: THREE.DoubleSide })
      ),
      water: new THREE.MeshStandardMaterial({
        color: "#4FA3D3",
        roughness: 0.12,
        metalness: 0.0,
        normalMap: ripples,
        normalScale: new THREE.Vector2(0.22, 0.22),
      }),
      outer: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 }),
      buildings: buildingsMaterial(),
      canopy: withCutaway(new THREE.MeshStandardMaterial({ roughness: 0.92, flatShading: true, envMapIntensity: 0.6 })),
      trunk: withCutaway(new THREE.MeshStandardMaterial({ color: "#7A6650", roughness: 1 })),
      palm: withCutaway(
        new THREE.MeshStandardMaterial({ roughness: 0.85, side: THREE.DoubleSide, flatShading: true })
      ),
      palmTrunk: withCutaway(new THREE.MeshStandardMaterial({ color: "#A38D6E", roughness: 1 })),
      yacht: withCutaway(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.3, metalness: 0.05 })),
      frame: new THREE.MeshStandardMaterial({ color: "#2E333D", roughness: 0.55, metalness: 0.3 }),
    };
  }, [ground, livery]);

  const geos = useMemo(
    () => ({
      canopy: canopyGeometry(),
      trunk: trunkGeometry(),
      crown: palmCrownGeometry(),
      palmTrunk: (() => {
        const g = new THREE.CylinderGeometry(0.11, 0.16, 1, 6);
        g.translate(0, 0.5, 0);
        return g;
      })(),
      yacht: yachtGeometry(),
      post: (() => {
        const g = new THREE.BoxGeometry(0.09, 3.9, 0.09);
        g.translate(0, 1.95, 0);
        return g;
      })(),
    }),
    []
  );

  const canopyRef = useRef<THREE.InstancedMesh>(null);
  const trunkRef = useRef<THREE.InstancedMesh>(null);
  const crownRef = useRef<THREE.InstancedMesh>(null);
  const palmTrunkRef = useRef<THREE.InstancedMesh>(null);
  const yachtRef = useRef<THREE.InstancedMesh>(null);
  const postRef = useRef<THREE.InstancedMesh>(null);

  useLayoutEffect(() => {
    if (canopyRef.current && trunkRef.current && crownRef.current && palmTrunkRef.current) {
      placeTrees(trees, canopyRef.current, trunkRef.current, crownRef.current, palmTrunkRef.current);
    }
    if (yachtRef.current) placeYachts(city, yachtRef.current);
    const m = postRef.current;
    if (m) {
      const o = new THREE.Object3D();
      posts.forEach((p, i) => {
        o.position.set(p.x, p.y, p.z);
        o.updateMatrix();
        m.setMatrixAt(i, o.matrix);
      });
      m.instanceMatrix.needsUpdate = true;
      m.computeBoundingSphere();
    }
  }, [trees, city, posts]);

  const boardGeos = useMemo(
    () => CHAPTERS.map((c) => boardGeometry(city.track, c.at - 210, c.at + 110)),
    [city]
  );
  const boardMats = useMemo(
    () =>
      props.boards.map((b) => {
        const m = new THREE.MeshStandardMaterial({
          map: boardTexture(b),
          roughness: 0.55,
          polygonOffset: true,
          polygonOffsetFactor: -2,
          polygonOffsetUnits: -2,
        });
        return m;
      }),
    [props.boards]
  );

  useEffect(
    () => () => {
      ground.dispose();
      Object.values(mats).forEach((m) => m.dispose());
    },
    [ground, mats]
  );

  const carRef = useRef<THREE.Group>(null);
  const sunRef = useRef<THREE.DirectionalLight>(null);
  const routeRef = useRef<THREE.Mesh>(null);

  const treeCount = trees.length;

  return (
    <>
      <fog attach="fog" args={[FOG, 900, 5200]} />
      <Sky />
      <hemisphereLight args={["#E7EEF5", "#C2B396", 0.35]} />
      <directionalLight
        ref={sunRef}
        intensity={3.2}
        color="#FFF3DF"
        castShadow
        shadow-mapSize={small ? [2048, 2048] : [4096, 4096]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.5}
      />

      {/* sea, the Riviera beyond, and the detailed tile of Monaco */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.15, 0]} material={mats.water}>
        <planeGeometry args={[40000, 40000]} />
      </mesh>
      <mesh geometry={outerGeo} material={mats.outer} receiveShadow />
      <mesh geometry={terrainGeo} material={mats.ground} receiveShadow castShadow />
      <mesh geometry={buildingGeo} material={mats.buildings} castShadow receiveShadow />

      {/* the circuit */}
      {tg.shoulders.map((g, i) => (
        <mesh key={`sh${i}`} geometry={g} material={mats.shoulder} receiveShadow />
      ))}
      {tg.skirts.map((g, i) => (
        <mesh key={`sk${i}`} geometry={g} material={mats.skirt} />
      ))}
      <mesh geometry={tg.road} material={mats.road} receiveShadow />
      {tg.kerbs.map((g, i) => (
        <mesh key={`k${i}`} geometry={g} material={mats.kerb} receiveShadow />
      ))}
      <mesh geometry={tg.grid} material={mats.grid} receiveShadow />
      <mesh
        ref={routeRef}
        geometry={routeGeo}
        material={mats.route}
        onUpdate={(m) => m.geometry.setDrawRange(0, 0)}
      />
      {tg.barriers.map((g, i) => (
        <mesh key={`b${i}`} geometry={g} material={mats.barrier} castShadow receiveShadow />
      ))}
      {tg.fences.map((g, i) => (
        <mesh key={`f${i}`} geometry={g} material={mats.fence} />
      ))}
      <instancedMesh
        ref={postRef}
        args={[geos.post, mats.post, posts.length]}
        castShadow
      />

      {/* the tunnel under the Fairmont */}
      {tg.tunnel.walls.map((g, i) => (
        <mesh key={`tw${i}`} geometry={g} material={mats.tunnelWall} />
      ))}
      <mesh geometry={tg.tunnel.ceiling} material={mats.ceiling} />
      {tg.tunnel.lights.map((g, i) => (
        <mesh key={`tl${i}`} geometry={g} material={mats.lights} />
      ))}
      <mesh geometry={tg.tunnel.cover} material={mats.ground} castShadow receiveShadow />
      {tg.tunnel.portals.map((g, i) => (
        <mesh key={`tp${i}`} geometry={g} material={mats.portal} castShadow />
      ))}

      {/* greenery and the harbour */}
      <instancedMesh ref={canopyRef} args={[geos.canopy, mats.canopy, treeCount]} castShadow receiveShadow />
      <instancedMesh ref={trunkRef} args={[geos.trunk, mats.trunk, treeCount]} castShadow />
      <instancedMesh ref={crownRef} args={[geos.crown, mats.palm, treeCount]} castShadow />
      <instancedMesh ref={palmTrunkRef} args={[geos.palmTrunk, mats.palmTrunk, treeCount]} castShadow />
      <instancedMesh
        ref={yachtRef}
        args={[geos.yacht, mats.yacht, city.raw.yachts.length]}
        castShadow
        receiveShadow
      />

      {/* trackside boards around each career corner */}
      {boardGeos.map((g, i) =>
        boardMats[i] ? <mesh key={`bd${i}`} geometry={g} material={boardMats[i]} receiveShadow /> : null
      )}
      <StartGantry city={city} frame={mats.frame} ctrl={ctrl} />
      <PitComplex
        city={city}
        livery={livery}
        projects={PIT_PROJECTS}
        selected={pitSelected}
        onSelect={props.onGaragePin}
      />

      <group ref={carRef} scale={1.5}>
        <F1Car livery={livery} />
      </group>

      <Rig
        {...props}
        line={line}
        carRef={carRef}
        sunRef={sunRef}
        routeRef={routeRef}
        waterMap={mats.water.normalMap}
      />
    </>
  );
};


// ——— camera, car and pins ——————————————————————————————————————————



interface Shot {
  cam: THREE.Vector3;
  look: THREE.Vector3;
  fov: number;
}

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

const Rig = ({
  city,
  line,
  ctrl,
  wakeRef,
  carRef,
  sunRef,
  routeRef,
  chapterPinRefs,
  garagePinRefs,
  onTelemetry,
  compassRef,
  garageScreenRef,
  garageScreenSize,
  waterMap,
  lap,
}: WorldProps & {
  line: RaceLine;
  carRef: MutableRefObject<THREE.Group | null>;
  sunRef: MutableRefObject<THREE.DirectionalLight | null>;
  routeRef: MutableRefObject<THREE.Mesh | null>;
  waterMap: THREE.Texture | null;
}) => {
  const { camera, invalidate, size } = useThree();

  useEffect(() => {
    wakeRef.current = () => invalidate();
  }, [invalidate, wakeRef]);

  const st = useRef({
    t: 0,
    d: 0,
    roll: 0,
    shot: -1,
    flight: 1,
    dur: 1,
    bump: 0,
    lastTele: 0,
    lastD: NaN,
    wasPlaying: false,
    wasGarage: false,
    slide: false,
  });
  const heading = useRef(new THREE.Vector3(0, 0, -1));
  const tp = useRef({ x: 0, y: 0, z: 0, tx: 0, tz: 0 });
  const skyline = useMemo(() => skylineGrid(city), [city]);
  const lift = useRef(-1);
  const orbit = useRef(0);
  const reduced = useMemo(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    []
  );
  const v = useMemo(
    () => ({
      car: new THREE.Vector3(),
      a: new THREE.Vector3(),
      b: new THREE.Vector3(),
      ahead: new THREE.Vector3(),
      tan: new THREE.Vector3(),
      flat: new THREE.Vector3(),
      dir: new THREE.Vector3(),
      pin: new THREE.Vector3(),
      fromCam: new THREE.Vector3(),
      fromLook: new THREE.Vector3(),
      look: new THREE.Vector3(),
      sun: new THREE.Vector3(-0.42, 0.78, 0.46).normalize(),
      shot: { cam: new THREE.Vector3(), look: new THREE.Vector3(), fov: 40 } as Shot,
      fromFov: 40,
    }),
    []
  );

  const garages = useMemo(() => projectGarages(city, garagePinRefs.current.length || 4), [city, garagePinRefs]);

  // the postcard: from out over the sea, looking back at the harbour and
  // the city climbing the hill
  const overview = useMemo(() => {
    let x = 0;
    let z = 0;
    const t = city.track;
    for (let i = 0; i < t.n; i++) {
      x += t.pos[i * 3];
      z += t.pos[i * 3 + 2];
    }
    x /= t.n;
    z /= t.n;
    return {
      look: new THREE.Vector3(x - 75, 10, z + 10),
      cam: new THREE.Vector3(x + 430, 940, z + 1080),
      lookTall: new THREE.Vector3(x + 10, 10, z + 30),
      camTall: new THREE.Vector3(x + 150, 2500, z + 980),
    };
  }, [city]);

  const chapterAnchors = useMemo(
    () =>
      CHAPTERS.map((c) => {
        const p = trackPose(city.track, c.at - GANTRY_LEAD, { x: 0, y: 0, z: 0, tx: 0, tz: 0 });
        return new THREE.Vector3(p.x, p.y + 9.5, p.z);
      }),
    [city]
  );
  const garageAnchors = useMemo(
    () => garages.map((g) => new THREE.Vector3(g.x, g.y + 11, g.z)),
    [garages]
  );

  const L = line.n * city.track.step;
  const lineAt = (d: number, out: THREE.Vector3) => {
    const sIdx = (((d % L) + L) % L) / city.track.step;
    const i = Math.floor(sIdx);
    const f = sIdx - i;
    const a = (i % line.n) * 3;
    const b = ((i + 1) % line.n) * 3;
    const p = line.pos;
    return out.set(
      p[a] + (p[b] - p[a]) * f,
      p[a + 1] + (p[b + 1] - p[a + 1]) * f,
      p[a + 2] + (p[b + 2] - p[a + 2]) * f
    );
  };
  // the car's path: off pole position and onto the racing line
  const carAt = (d: number, out: THREE.Vector3) => {
    lineAt(d, out);
    const w = 1 - smooth(0, 90, d);
    if (w > 0) {
      trackPose(city.track, d - GRID_SLOT.back, tp.current);
      const gx = tp.current.x - tp.current.tz * GRID_SLOT.lateral;
      const gz = tp.current.z + tp.current.tx * GRID_SLOT.lateral;
      out.set(out.x + (gx - out.x) * w, out.y + (tp.current.y - out.y) * w, out.z + (gz - out.z) * w);
    }
    return out;
  };

  const portrait = size.height > size.width;

  // where the camera wants to be for each mode
  const shotFor = (mode: MapMode, c: SceneCtrl, dt: number, out: Shot) => {
    if (mode === "overview") {
      out.cam.copy(portrait ? overview.camTall : overview.cam);
      out.look.copy(portrait ? overview.lookTall : overview.look);
      out.fov = portrait ? 44 : 30;
      return 0;
    }
    if (mode === "pits" && garages.length) {
      const j = c.project;
      const g0 = garages[0];
      if (j != null && garages[j]) {
        // stand in the pit lane just outside the door, looking into the
        // garage at the screen on its back wall
        const g = garages[j] as (typeof garages)[number] & { depth?: number; screenY?: number };
        const depth = g.depth ?? 8;
        const screenY = g.screenY ?? 3;
        // a long lens from just outside the door (the pit-wall stands sit
        // farther out), with the back-wall screen filling most of the frame
        const out_ = portrait ? 7 : 5.5;
        const back = depth - (g.screenInset ?? 0.33);
        const dist = out_ + back;
        const hw = (g.screenW ?? 7.4) / 2;
        const aspect = size.width / size.height;
        // fit ~78% of the width (or the height on narrow screens)
        const fitW = (2 * Math.atan(hw / 0.78 / dist) * 180) / Math.PI;
        const vFromW = (2 * Math.atan(Math.tan((fitW * Math.PI) / 360) / aspect) * 180) / Math.PI;
        const vFromH = (2 * Math.atan(((g.screenH ?? 2.85) / 2 / 0.62) / dist) * 180) / Math.PI;
        out.cam.set(g.x + g.nx * out_, g.y + screenY + 0.6, g.z + g.nz * out_);
        out.look.set(g.x - g.nx * back, g.y + screenY, g.z - g.nz * back);
        out.fov = portrait ? 62 : Math.max(vFromW, vFromH);
        return 0;
      }
      // along the row, slid by dragging
      let gx = 0;
      let gz = 0;
      garages.forEach((a) => {
        gx += a.x / garages.length;
        gz += a.z / garages.length;
      });
      const half = Math.hypot(garages[garages.length - 1].x - g0.x, garages[garages.length - 1].z - g0.z) / 2 + 60;
      const pan = THREE.MathUtils.clamp(c.pitPan, -half, half);
      c.pitPan = pan;
      // pitPan is in screen-right metres: the camera looks along −n, so
      // screen right is (nz, −nx); slide along the lane in that sense
      const sense = Math.sign(g0.nz * g0.tx - g0.nx * g0.tz) || 1;
      gx += g0.tx * pan * sense;
      gz += g0.tz * pan * sense;
      // low across the lane so you can see in under the balconies
      const back = portrait ? 58 : 44;
      const up = portrait ? 16 : 10;
      out.cam.set(gx + g0.nx * back - g0.tx * 10, g0.y + up, gz + g0.nz * back - g0.tz * 10);
      out.look.set(gx, g0.y + 4, gz);
      out.fov = portrait ? 56 : 44;
      return 0;
    }
    // grid and race both frame the car
    v.flat.set(v.tan.x, 0, v.tan.z).normalize();
    if (mode === "grid") {
      const rx = -v.flat.z;
      const rz = v.flat.x;
      // from over the pit wall, behind and to the right of pole, so the
      // grid, the gantry and the run to Ste Dévote fill the frame
      const back = portrait ? 40 : 32;
      const side = portrait ? 8 : 13;
      out.cam.set(v.car.x - v.flat.x * back + rx * side, v.car.y + (portrait ? 30 : 21), v.car.z - v.flat.z * back + rz * side);
      out.look.set(v.car.x + v.flat.x * 22, v.car.y + 1, v.car.z + v.flat.z * 22);
      out.fov = portrait ? 54 : 44;
      heading.current.copy(v.flat);
      lift.current = -1;
      return 0;
    }

    // race: high and behind like a map flyover, on a smoothed heading so
    // chicanes don't whip the view around
    const kh = 1 - Math.exp(-2.6 * dt);
    heading.current.lerp(v.flat, kh).normalize();
    const back = portrait ? 92 : 80;
    const up = portrait ? 74 : 56;
    // how high must a camera at this bearing sit to see the car? Walk the
    // sight line over the skyline, and stay clear of nearby rooftops
    const needAt = (yaw: number) => {
      const cs = Math.cos(yaw);
      const sn = Math.sin(yaw);
      const hx = heading.current.x * cs - heading.current.z * sn;
      const hz = heading.current.x * sn + heading.current.z * cs;
      const cx = v.car.x - hx * back;
      const cz = v.car.z - hz * back;
      let n = up;
      for (let k = 1; k <= 16; k++) {
        const f = k / 16;
        if (f * back < 12) continue;
        const clear = skyline(v.car.x + (cx - v.car.x) * f, v.car.z + (cz - v.car.z) * f) + 3 - (v.car.y + 1);
        n = Math.max(n, clear / f);
      }
      for (let k = 0; k < 9; k++) {
        const a = (k / 8) * Math.PI * 2;
        const r = k === 8 ? 0 : 22;
        n = Math.max(n, skyline(cx + Math.cos(a) * r, cz + Math.sin(a) * r) + 10 - v.car.y);
      }
      return n;
    };
    // swing to whichever bearing has the clearest view, preferring behind
    let bestYaw = 0;
    let bestCost = Infinity;
    for (const deg of [-60, -35, -15, 0, 15, 35, 60]) {
      const yaw = (deg * Math.PI) / 180;
      const cost = needAt(yaw) + Math.abs(deg) * 0.35;
      if (cost < bestCost) {
        bestCost = cost;
        bestYaw = yaw;
      }
    }
    orbit.current += (bestYaw - orbit.current) * (1 - Math.exp(-1.4 * dt));
    const cs = Math.cos(orbit.current);
    const sn = Math.sin(orbit.current);
    v.dir.set(heading.current.x * cs - heading.current.z * sn, 0, heading.current.x * sn + heading.current.z * cs);
    const need = Math.min(needAt(orbit.current), 160);
    if (lift.current < 0) lift.current = need;
    lift.current += (need - lift.current) * (1 - Math.exp(-(need > lift.current ? 3.5 : 1.2) * dt));
    out.cam.copy(v.car).addScaledVector(v.dir, -back);
    out.cam.y = v.car.y + lift.current;
    out.look.copy(v.car).addScaledVector(v.dir, portrait ? 12 : 22);
    out.look.y = v.car.y + 1;
    out.fov = portrait ? 50 : 38;

    // underground, drop into the bore and follow low along the centreline
    const [ta, tb] = city.track.tunnel;
    const si = st.current.d / city.track.step;
    const under = smooth(ta - 26, ta - 1, si) * (1 - smooth(tb + 1, tb + 26, si));
    if (under > 0) {
      trackPose(city.track, st.current.d - 15, tp.current);
      v.pin.set(tp.current.x, tp.current.y + 3.3, tp.current.z);
      out.cam.lerp(v.pin, under);
      v.pin.copy(v.car).addScaledVector(v.tan, 14);
      v.pin.y = v.car.y + 1.4;
      out.look.lerp(v.pin, under);
      out.fov = THREE.MathUtils.lerp(out.fov, portrait ? 68 : 58, under);
    }
    const busy =
      Math.abs(bestYaw - orbit.current) > 0.002 || Math.abs(need - lift.current) > 0.05;
    return under + (busy ? 2 : 0);
  };

  useFrame((state, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const c = ctrl.current;
    const s = st.current;
    let awake = false;

    // ——— the car ———
    if (c.jump != null) {
      s.t = c.jump;
      c.target = c.jump;
      c.jump = null;
      lift.current = -1;
    }
    if (c.mode === "race" && lap) {
      if (c.playing) {
        c.target = Math.min(lap.lapTime + 1.5, c.target + dt * c.rate);
        if (c.target >= lap.lapTime + 1.5) c.playing = false;
        awake = true;
      }
      // the car follows the scroll closely and stops the moment it does
      const err = c.target - s.t;
      s.t += err * (c.playing ? 1 : 1 - Math.exp(-7 * dt));
      if (Math.abs(err) > 0.0005) awake = true;
      else s.t = c.target;
      s.d = s.t <= lap.lapTime ? distanceAt(lap, s.t) : LAP_LENGTH + (s.t - lap.lapTime) * 70;
    } else if (c.mode === "grid") {
      s.t = 0;
      s.d = 0;
    }
    const d = s.d;
    carAt(d, v.car);
    carAt(d + 2, v.ahead);
    v.tan.subVectors(v.ahead, v.car).normalize();
    const car = carRef.current;
    if (car) {
      car.position.copy(v.car);
      car.lookAt(v.ahead);
      carAt(d + 11, v.b);
      v.dir.subVectors(v.b, v.ahead).normalize();
      const steer = Math.atan2(v.tan.x * v.dir.z - v.tan.z * v.dir.x, v.tan.x * v.dir.x + v.tan.z * v.dir.z);
      const k = 1 - Math.exp(-5 * dt);
      s.roll += (THREE.MathUtils.clamp(steer * 0.5, -0.07, 0.07) - s.roll) * k;
      car.rotateZ(s.roll);
    }
    const route = routeRef.current;
    if (route) {
      const n = Math.min(line.n, Math.floor(Math.max(0, Math.min(d, LAP_LENGTH)) / city.track.step));
      route.geometry.setDrawRange(0, n * 6);
    }

    // ——— the camera ———
    const extra = shotFor(c.mode, c, dt, v.shot);
    const under = c.mode === "race" ? Math.min(extra, 1) : 0;
    if (extra >= 2) awake = true;
    if (c.shot !== s.shot) {
      // a new destination: fly there from wherever we are
      const first = s.shot < 0;
      s.shot = c.shot;
      v.fromCam.copy(camera.position);
      v.fromLook.copy(first ? v.shot.look : v.look);
      v.fromFov = (camera as THREE.PerspectiveCamera).fov;
      const dist = v.fromCam.distanceTo(v.shot.cam);
      s.flight = first ? 1 : 0;
      s.dur = reduced ? 0.01 : THREE.MathUtils.clamp(1 + dist / 650, 1.1, 3);
      s.bump = Math.min(dist * 0.22, 160);
      // garage to garage: slide straight along the pit lane at door height,
      // never arcing up through the balconies overhead
      const inGarage = c.mode === "pits" && c.project != null;
      s.slide = inGarage && s.wasGarage;
      if (s.slide) {
        s.bump = 0;
        s.dur = reduced ? 0.01 : 0.85;
      }
      s.wasGarage = inGarage;
    }
    if (s.flight < 1) {
      s.flight = Math.min(1, s.flight + dt / s.dur);
      const e = easeInOut(s.flight);
      camera.position.lerpVectors(v.fromCam, v.shot.cam, e);
      camera.position.y += Math.sin(Math.PI * e) * s.bump;
      v.look.lerpVectors(v.fromLook, v.shot.look, e);
      setFov(THREE.MathUtils.lerp(v.fromFov, v.shot.fov, e));
      awake = true;
    } else {
      camera.position.copy(v.shot.cam);
      v.look.copy(v.shot.look);
      setFov(v.shot.fov);
    }
    camera.lookAt(v.look);

    // centre the picture in the part of the screen the place card leaves free
    {
      const cam = camera as THREE.PerspectiveCamera;
      // keep the car clear of the lower-third graphics
      const ox = 0;
      // (in an open garage the screen is the picture, so keep it centred)
      const inGarage = c.mode === "pits" && c.project != null && size.width >= 768;
      const oy = inGarage ? 0 : Math.round(size.height * (size.width < 768 ? 0.14 : 0.06));
      const view = cam.view;
      if (!view || view.offsetX !== ox || view.offsetY !== oy || view.fullWidth !== size.width || view.fullHeight !== size.height) {
        cam.setViewOffset(size.width, size.height, ox, oy, size.width, size.height);
      }
    }

    cutaway.uCutCar.value.copy(v.car);
    cutaway.uCutCam.value.copy(camera.position);
    cutaway.uCutOn.value = c.mode === "race" && s.flight >= 1 ? 1 - under : 0;

    // the sun follows the action so the shadow map stays sharp around it
    const sun = sunRef.current;
    if (sun) {
      const span = c.mode === "overview" ? 900 : 150;
      sun.position.copy(v.look).addScaledVector(v.sun, 900);
      sun.target.position.copy(v.look);
      sun.target.updateMatrixWorld();
      const sc = sun.shadow.camera;
      const cur = sc.right;
      const next = s.flight < 1 ? THREE.MathUtils.lerp(cur, span, 0.2) : span;
      if (Math.abs(cur - next) > 0.5 || cur !== next) {
        sc.left = -next;
        sc.right = next;
        sc.top = next;
        sc.bottom = -next;
        sc.near = 100;
        sc.far = 1900;
        sc.updateProjectionMatrix();
      }
    }
    if (waterMap) {
      waterMap.offset.x = (state.clock.elapsedTime * 0.004) % 1;
      waterMap.offset.y = (state.clock.elapsedTime * 0.0025) % 1;
    }

    // compass needle
    // ——— the live garage screen ———
    const screenEl = garageScreenRef?.current;
    if (screenEl && garageScreenSize) {
      const g = c.mode === "pits" && c.project != null ? garages[c.project] : undefined;
      let shown = false;
      if (g && (s.flight >= 1 || s.slide)) {
        // the screen's corners: top-left, top-right, bottom-right, bottom-left
        const back = g.depth - g.screenInset;
        const cx = g.x - g.nx * back;
        const cz = g.z - g.nz * back;
        // seen from the lane (looking along −n), screen-right is (nz, −nx)
        const rx = g.nz;
        const rz = -g.nx;
        const hw = g.screenW / 2;
        const top = g.y + g.screenY + g.screenH / 2;
        const bot = g.y + g.screenY - g.screenH / 2;
        const pts = [
          [cx - rx * hw, top, cz - rz * hw],
          [cx + rx * hw, top, cz + rz * hw],
          [cx + rx * hw, bot, cz + rz * hw],
          [cx - rx * hw, bot, cz - rz * hw],
        ].map(([x, y, z]) => {
          v.pin.set(x, y, z).project(camera);
          return { x: ((v.pin.x + 1) / 2) * size.width, y: ((1 - v.pin.y) / 2) * size.height, z: v.pin.z };
        });
        if (pts.every((p) => p.z < 1)) {
          // only touch the transform when it really changes, so the layer
          // isn't re-rasterised every frame
          // the camera faces the screen square-on, so a flat scale and
          // translate fits it: no perspective layer for the browser to
          // re-tile, and the text rasterises at its final size
          const x0 = Math.min(...pts.map((p) => p.x));
          const x1 = Math.max(...pts.map((p) => p.x));
          const y0 = Math.min(...pts.map((p) => p.y));
          const y1 = Math.max(...pts.map((p) => p.y));
          const m = `translate(${x0.toFixed(1)}px, ${y0.toFixed(1)}px) scale(${((x1 - x0) / garageScreenSize.w).toFixed(4)}, ${((y1 - y0) / garageScreenSize.h).toFixed(4)})`;
          if (screenEl.dataset.m !== m) {
            screenEl.dataset.m = m;
            screenEl.style.transform = m;
          }
          shown = true;
        }
      }
      // hidden for the whole flight; fades in (CSS) once the camera settles
      if (screenEl.dataset.shown !== String(shown)) {
        screenEl.dataset.shown = String(shown);
        // (opacity only: hiding with visibility drops the rastered layer,
        // and the browser then repaints it tile by tile when it returns)
        screenEl.style.transition = shown ? "opacity 260ms ease-out" : "none";
        screenEl.style.opacity = shown ? "1" : "0.001";
        screenEl.style.pointerEvents = shown ? "auto" : "none";
      }
    }

    if (compassRef?.current) {
      camera.getWorldDirection(v.dir);
      const yaw = Math.atan2(v.dir.x, -v.dir.z);
      compassRef.current.style.transform = `rotate(${(-yaw * 180) / Math.PI}deg)`;
    }

    // ——— map pins ———
    const place = (
      el: HTMLElement | null,
      p: THREE.Vector3,
      visible: boolean,
      reach: number
    ) => {
      if (!el) return;
      v.pin.copy(p).project(camera);
      const dist = camera.position.distanceTo(p);
      const o = !visible || v.pin.z > 1 ? 0 : 1 - smooth(reach * 0.7, reach, dist);
      const x = ((v.pin.x + 1) / 2) * size.width;
      const y = ((1 - v.pin.y) / 2) * size.height;
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -100%)`;
      el.style.opacity = o.toFixed(3);
      el.style.pointerEvents = o > 0.4 ? "auto" : "none";
      el.tabIndex = o > 0.4 ? 0 : -1;
    };
    const settled = s.flight >= 1;
    chapterAnchors.forEach((p, i) =>
      place(
        chapterPinRefs.current[i],
        p,
        settled && (c.mode === "overview" || (c.mode === "race" && under < 0.5)),
        c.mode === "overview" ? 4000 : 520
      )
    );
    garageAnchors.forEach((p, i) =>
      place(
        garagePinRefs.current[i],
        p,
        // in the overview the four garages would stack into one blob
        settled && c.mode === "pits" && c.project == null,
        4000
      )
    );

    // ——— report back ———
    const now = state.clock.elapsedTime;
    if (now - s.lastTele > 0.05 && (d !== s.lastD || c.playing !== s.wasPlaying)) {
      s.lastTele = now;
      s.lastD = d;
      s.wasPlaying = c.playing;
      onTelemetry({ t: s.t, d, playing: c.playing });
    }

    if (awake) invalidate();
  });

  function setFov(f: number) {
    const cam = camera as THREE.PerspectiveCamera;
    if (Math.abs(cam.fov - f) > 0.01) {
      cam.fov = f;
      cam.updateProjectionMatrix();
    }
  }

  return null;
};

// ——— the canvas, pins and loading state ——————————————————————————————

const Pin = ({
  pin,
  onClick,
  setRef,
}: {
  pin: PinInfo;
  onClick: () => void;
  setRef: (el: HTMLButtonElement | null) => void;
}) => (
  <button
    ref={setRef}
    onClick={onClick}
    className="group absolute left-0 top-0 flex origin-bottom flex-col items-center opacity-0 will-change-transform"
    aria-label={`${pin.label}${pin.sub ? `, ${pin.sub}` : ""}`}
  >
    <span className="flex items-center gap-2 rounded-full bg-white py-1.5 pl-1.5 pr-3 shadow-[0_6px_18px_rgba(15,23,42,0.25)] ring-1 ring-black/5 transition-transform duration-200 group-hover:scale-105 group-active:scale-95">
      {pin.icon ? (
        <span
          className="flex h-6 w-6 items-center justify-center rounded-full text-white"
          style={{ backgroundColor: pin.color }}
        >
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
            <path d={PROJECT_ICONS[pin.icon]} />
          </svg>
        </span>
      ) : pin.logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={pin.logo} alt="" className="ml-1 h-[18px] w-auto max-w-[84px] object-contain" />
      ) : null}
      <span className="whitespace-nowrap text-[12px] font-bold text-zinc-900">
        {pin.icon || !pin.logo ? pin.label : null}
        {pin.sub && <span className="ml-1.5 font-medium tabular-nums text-zinc-500">{pin.sub}</span>}
      </span>
    </span>
    <span className="-mt-[5px] block h-2.5 w-2.5 rotate-45 bg-white shadow-[2px_2px_3px_rgba(15,23,42,0.12)]" />
  </button>
);

const MonacoScene = (props: SceneProps) => {
  const { chapterPins, garagePins, onChapterPin, onGaragePin } = props;
  const [city, setCity] = useState<City | null>(null);
  const [failed, setFailed] = useState(false);
  const chapterPinRefs = useRef<(HTMLElement | null)[]>([]);
  const garagePinRefs = useRef<(HTMLElement | null)[]>(garagePins.map(() => null));

  useEffect(() => {
    let live = true;
    loadCity()
      .then((c) => live && setCity(c))
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
  }, []);

  return (
    <div className="absolute inset-0" style={{ background: "#DCE6EC" }}>
      <Canvas
        frameloop="demand"
        dpr={[1, 1.75]}
        shadows
        camera={{ fov: 40, near: 2, far: 12000, position: [600, 760, 800] }}
        gl={{
          antialias: true,
          powerPreference: "high-performance",
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 0.92,
        }}
        style={{ opacity: city ? 1 : 0, transition: "opacity 700ms ease" }}
      >
        {city && (
          <World
            {...props}
            city={city}
            chapterPinRefs={chapterPinRefs}
            garagePinRefs={garagePinRefs}
          />
        )}
      </Canvas>

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {city &&
          chapterPins.map((p, i) => (
            <Pin
              key={`c${i}`}
              pin={p}
              onClick={() => onChapterPin(i)}
              setRef={(el) => {
                chapterPinRefs.current[i] = el;
              }}
            />
          ))}
        {city &&
          garagePins.map((p, i) => (
            <Pin
              key={`g${i}`}
              pin={p}
              onClick={() => onGaragePin(i)}
              setRef={(el) => {
                garagePinRefs.current[i] = el;
              }}
            />
          ))}
      </div>

      {!city && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-[13px] font-medium text-slate-500">
            {failed ? "The map didn't load. Refresh to try again." : "Loading Monaco…"}
          </p>
        </div>
      )}
    </div>
  );
};

export default MonacoScene;
