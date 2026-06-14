import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  MutableRefObject,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";
import * as THREE from "three";

import {
  buildTrack,
  cityBlocks,
  kerbRibbon,
  kerbTexture,
  poolPlacement,
  ribbonGeometry,
  skirtGeometry,
  TrackData,
  yachts,
} from "./trackData";

export interface BannerInfo {
  name: string;
  logo?: string;
}

interface SceneProps {
  progressRef: MutableRefObject<number>;
  livery: string;
  glow: string;
  banners: BannerInfo[];
  onSelect: (i: number) => void;
}

// Monte Carlo facade palette
const TONES = ["#EFE4CE", "#E3CFAB", "#E0BE98", "#F2EDE0", "#D2B091"];
const CROWD = ["#E8C15A", "#5E9BD8", "#D86A6A", "#7CC487", "#B286D2", "#E89A55"];

// ——— a proper little F1 car ———
const F1Car = ({ livery }: { livery: string }) => {
  const body = <meshStandardMaterial color={livery} roughness={0.35} metalness={0.1} />;
  const dark = <meshStandardMaterial color="#17171C" roughness={0.5} />;
  return (
    <group>
      <mesh position={[0, 0.14, 0.1]}>
        <boxGeometry args={[1.9, 0.08, 4.6]} />
        {dark}
      </mesh>
      <mesh position={[0, 0.42, -0.4]}>
        <boxGeometry args={[1.05, 0.5, 2.6]} />
        {body}
      </mesh>
      <mesh position={[0, 0.38, 1.6]} rotation={[0.04, 0, 0]} scale={[0.62, 0.7, 1]}>
        <boxGeometry args={[1, 0.42, 1.8]} />
        {body}
      </mesh>
      <mesh position={[0, 0.34, 2.9]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.22, 1.1, 10]} />
        {body}
      </mesh>
      <mesh position={[0, 0.16, 3.05]}>
        <boxGeometry args={[2.6, 0.07, 0.85]} />
        {dark}
      </mesh>
      <mesh position={[0, 0.24, 3.2]}>
        <boxGeometry args={[2.3, 0.05, 0.45]} />
        {body}
      </mesh>
      {[-1.3, 1.3].map((x) => (
        <mesh key={x} position={[x, 0.3, 3.05]}>
          <boxGeometry args={[0.06, 0.34, 0.85]} />
          {dark}
        </mesh>
      ))}
      {[-0.78, 0.78].map((x) => (
        <mesh key={x} position={[x, 0.42, -0.5]}>
          <boxGeometry args={[0.55, 0.46, 2]} />
          {body}
        </mesh>
      ))}
      <mesh position={[0, 0.62, 0.55]}>
        <boxGeometry args={[0.66, 0.26, 1]} />
        {dark}
      </mesh>
      <mesh position={[0, 0.72, 0.55]}>
        <torusGeometry args={[0.34, 0.045, 6, 12, Math.PI]} />
        {dark}
      </mesh>
      <mesh position={[0, 0.62, 0.92]} rotation={[0.5, 0, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 0.5, 6]} />
        {dark}
      </mesh>
      <mesh position={[0, 0.68, 0.42]}>
        <sphereGeometry args={[0.16, 10, 8]} />
        <meshStandardMaterial color="#F2F2F4" roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.78, -0.15]}>
        <boxGeometry args={[0.4, 0.34, 0.7]} />
        {body}
      </mesh>
      <mesh position={[0, 0.6, -1.3]} rotation={[-0.1, 0, 0]}>
        <boxGeometry args={[0.5, 0.5, 1.7]} />
        {body}
      </mesh>
      <mesh position={[0, 0.86, -1.5]}>
        <boxGeometry args={[0.05, 0.34, 1.1]} />
        {body}
      </mesh>
      <mesh position={[0, 0.96, -2.18]}>
        <boxGeometry args={[2.1, 0.06, 0.5]} />
        {dark}
      </mesh>
      <mesh position={[0, 1.08, -2.3]}>
        <boxGeometry args={[2.1, 0.05, 0.34]} />
        {body}
      </mesh>
      {[-1.05, 1.05].map((x) => (
        <mesh key={x} position={[x, 0.86, -2.2]}>
          <boxGeometry args={[0.06, 0.52, 0.74]} />
          {dark}
        </mesh>
      ))}
      <mesh position={[0, 0.52, -2.25]}>
        <boxGeometry args={[1.4, 0.07, 0.2]} />
        {dark}
      </mesh>
      {[
        { x: -1.18, z: 1.62, r: 0.4 },
        { x: 1.18, z: 1.62, r: 0.4 },
        { x: -1.22, z: -1.55, r: 0.44 },
        { x: 1.22, z: -1.55, r: 0.44 },
      ].map((w, i) => (
        <group key={i} position={[w.x, w.r, w.z]} rotation={[0, 0, Math.PI / 2]}>
          <mesh>
            <cylinderGeometry args={[w.r, w.r, 0.42, 16]} />
            <meshStandardMaterial color="#101013" roughness={0.85} />
          </mesh>
          <mesh position={[0, w.x > 0 ? 0.215 : -0.215, 0]}>
            <cylinderGeometry args={[w.r * 0.55, w.r * 0.55, 0.012, 12]} />
            <meshStandardMaterial color="#6B7280" roughness={0.3} metalness={0.6} />
          </mesh>
        </group>
      ))}
    </group>
  );
};

// banner with the company logo and a tap hint
const bannerTexture = (info: BannerInfo, livery: string) => {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 84;
  const ctx = c.getContext("2d")!;
  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 4;

  const chrome = () => {
    ctx.fillStyle = "#FCFAF4";
    ctx.fillRect(0, 0, 512, 84);
    ctx.fillStyle = livery;
    ctx.fillRect(0, 0, 14, 84);
    ctx.fillRect(0, 74, 512, 10);
    // tap hint
    ctx.fillStyle = "#9A958A";
    ctx.font = "700 17px system-ui, sans-serif";
    ctx.textBaseline = "middle";
    ctx.textAlign = "right";
    ctx.fillText("TAP FOR DETAILS ▸", 496, 40);
    ctx.textAlign = "left";
  };
  chrome();
  ctx.fillStyle = "#16181E";
  ctx.font = "800 42px system-ui, sans-serif";
  ctx.textBaseline = "middle";
  ctx.fillText(info.name.toUpperCase(), 34, 38);

  if (info.logo) {
    const img = new Image();
    img.onload = () => {
      chrome();
      const h = 52;
      const w = (img.width / img.height) * h;
      ctx.drawImage(img, 34, 16, Math.min(w, 300), h);
      tex.needsUpdate = true;
    };
    img.src = info.logo;
  }
  return tex;
};

const AdBridge = ({
  position,
  rotationY,
  texture,
  onClick,
}: {
  position: THREE.Vector3;
  rotationY: number;
  texture: THREE.Texture;
  onClick: () => void;
}) => (
  <group position={position} rotation={[0, rotationY, 0]}>
    {[-5.6, 5.6].map((x) => (
      <mesh key={x} position={[x, 2.5, 0]} castShadow>
        <boxGeometry args={[0.4, 5, 0.4]} />
        <meshStandardMaterial color="#3A3F4C" roughness={0.6} />
      </mesh>
    ))}
    <mesh
      position={[0, 5.4, 0]}
      castShadow
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onPointerOver={() => (document.body.style.cursor = "pointer")}
      onPointerOut={() => (document.body.style.cursor = "")}
    >
      <boxGeometry args={[12, 1.9, 0.25]} />
      <meshStandardMaterial color="#FFFFFF" map={texture} roughness={0.55} />
    </mesh>
  </group>
);

const Rig = ({
  progressRef,
  track,
  carRef,
  lineRef,
}: {
  progressRef: MutableRefObject<number>;
  track: TrackData;
  carRef: MutableRefObject<THREE.Group | null>;
  lineRef: MutableRefObject<THREE.BufferGeometry | null>;
}) => {
  const { camera } = useThree();
  const sm = useRef({ t: 0, roll: 0, speed: 0 });
  const heading = useRef(new THREE.Vector3(0, 0, 1));
  const aim = useRef(new THREE.Vector3());
  const tmp = useMemo(
    () => ({
      pos: new THREE.Vector3(),
      tan: new THREE.Vector3(),
      tan2: new THREE.Vector3(),
      flat: new THREE.Vector3(),
      cam: new THREE.Vector3(),
      target: new THREE.Vector3(),
    }),
    []
  );

  useFrame((state, dt) => {
    const target = THREE.MathUtils.clamp(progressRef.current, 0, 1) * 0.985;
    const k = 1 - Math.exp(-5.5 * Math.min(dt, 0.05));
    const prevT = sm.current.t;
    sm.current.t += (target - sm.current.t) * k;
    const t = THREE.MathUtils.clamp(sm.current.t, 0.0001, 0.9999);
    const speed = Math.abs(sm.current.t - prevT) / Math.max(dt, 0.001);
    sm.current.speed += (speed - sm.current.speed) * Math.min(1, dt * 3);

    track.raceCurve.getPointAt(t, tmp.pos);
    track.raceCurve.getTangentAt(t, tmp.tan);

    if (carRef.current) {
      carRef.current.position.copy(tmp.pos);
      tmp.target.copy(tmp.pos).add(tmp.tan);
      carRef.current.lookAt(tmp.target);
      track.raceCurve.getTangentAt(Math.min(t + 0.004, 1), tmp.tan2);
      const steer = Math.atan2(
        tmp.tan.x * tmp.tan2.z - tmp.tan.z * tmp.tan2.x,
        tmp.tan.x * tmp.tan2.x + tmp.tan.z * tmp.tan2.z
      );
      const targetRoll = THREE.MathUtils.clamp(steer * 5, -0.16, 0.16);
      sm.current.roll += (targetRoll - sm.current.roll) * k;
      carRef.current.rotateZ(sm.current.roll);
    }

    if (lineRef.current) {
      const segs = Math.floor(t * (track.raceSamples.length - 2));
      lineRef.current.setDrawRange(0, segs * 6);
    }

    // The camera sits behind the car along a smoothed, flattened heading and
    // always aims just ahead of it. Smoothing the heading (not the aim) keeps
    // the framing calm through chicanes and elevation without ever pointing
    // at the ground.
    tmp.flat.set(tmp.tan.x, 0, tmp.tan.z).normalize();
    const kHead = 1 - Math.exp(-4 * Math.min(dt, 0.05));
    heading.current.lerp(tmp.flat, kHead).normalize();

    // ramp the camera down into the tunnel and back up on exit so the lift
    // never snaps (which clipped the roof and flashed empty ground)
    const [t0, t1] = track.tunnelFractions;
    const ramp = 0.03;
    let tf = 0;
    if (t > t0 - ramp && t < t1 + ramp) {
      if (t < t0) tf = (t - (t0 - ramp)) / ramp;
      else if (t > t1) tf = 1 - (t - t1) / ramp;
      else tf = 1;
      tf = THREE.MathUtils.clamp(tf, 0, 1);
    }
    const back = 15 - tf * 6;
    const lift = 8.5 - tf * 5.9;
    tmp.cam.copy(tmp.pos).addScaledVector(heading.current, -back);
    tmp.cam.y = tmp.pos.y + lift;
    camera.position.lerp(tmp.cam, k);

    aim.current.copy(tmp.pos).addScaledVector(heading.current, 7);
    aim.current.y = tmp.pos.y + 1.2;
    camera.lookAt(aim.current);

    // speed feel: gently widen the view at pace — no camera shake, and the
    // pace itself is heavily smoothed so bursty scroll input doesn't make the
    // framing jitter
    const pace = THREE.MathUtils.clamp(sm.current.speed * 22, 0, 1);
    const cam = camera as THREE.PerspectiveCamera;
    const fovTarget = 52 + pace * 5;
    if (Math.abs(cam.fov - fovTarget) > 0.02) {
      cam.fov += (fovTarget - cam.fov) * Math.min(1, dt * 2.5);
      cam.updateProjectionMatrix();
    }
  });
  return null;
};

const Kerbs = ({ track }: { track: TrackData }) => {
  const geo = useMemo(() => kerbRibbon(track), [track]);
  const tex = useMemo(() => {
    const t = kerbTexture();
    t.repeat.set(1, 1);
    return t;
  }, []);
  return (
    <mesh geometry={geo} receiveShadow renderOrder={1}>
      <meshStandardMaterial
        map={tex}
        roughness={0.65}
        polygonOffset
        polygonOffsetFactor={-2}
        polygonOffsetUnits={-2}
      />
    </mesh>
  );
};

const City = ({ track }: { track: TrackData }) => {
  const blocks = useMemo(() => cityBlocks(track), [track]);
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    const o = new THREE.Object3D();
    const col = new THREE.Color();
    blocks.forEach((b, i) => {
      o.position.set(b.x, b.base + b.h / 2, b.z);
      o.scale.set(b.w, b.h, b.d);
      o.rotation.set(0, 0, 0);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
      m.setColorAt(i, col.set(TONES[b.tone]));
    });
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [blocks]);
  return (
    <instancedMesh
      ref={ref}
      args={[undefined, undefined, blocks.length]}
      castShadow
      receiveShadow
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial roughness={0.85} />
    </instancedMesh>
  );
};

// spectators packing the stands
const Crowd = ({
  stands,
}: {
  stands: { x: number; z: number; len: number; face: number }[];
}) => {
  const ref = useRef<THREE.InstancedMesh>(null);
  const seats = useMemo(() => {
    const out: { x: number; y: number; z: number; tone: number }[] = [];
    let n = 0;
    stands.forEach((s) => {
      for (let row = 0; row < 3; row++) {
        for (let zz = -s.len / 2 + 1; zz < s.len / 2 - 0.5; zz += 1.15) {
          n++;
          const r = Math.sin(n * 12.9898) * 43758.5453;
          if (r - Math.floor(r) < 0.18) continue;
          out.push({
            x: s.x + s.face * (0.9 - row * 0.8),
            y: 1.3 + row * 0.75,
            z: s.z + zz,
            tone: n % CROWD.length,
          });
        }
      }
    });
    return out;
  }, [stands]);

  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    const o = new THREE.Object3D();
    const col = new THREE.Color();
    seats.forEach((s, i) => {
      o.position.set(s.x, s.y, s.z);
      o.scale.setScalar(1);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
      m.setColorAt(i, col.set(CROWD[s.tone]));
    });
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [seats]);

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, seats.length]}>
      <sphereGeometry args={[0.26, 6, 5]} />
      <meshStandardMaterial roughness={0.9} />
    </instancedMesh>
  );
};

const STANDS = [
  { x: -7, z: 0, len: 26, face: 1 },
  { x: 8, z: -2, len: 18, face: -1 },
  { x: 60, z: -46.5, len: 20, face: -1 },
];

const Scene = ({ progressRef, livery, banners, onSelect }: SceneProps) => {
  const track = useMemo(buildTrack, []);
  const asphalt = useMemo(() => ribbonGeometry(track, 5.6, 0.02), [track]);
  const line = useMemo(
    () => ribbonGeometry(track, 0.7, 0.07, 0, 1, 0, 0, true),
    [track]
  );
  const armcoL = useMemo(() => ribbonGeometry(track, 0, 0, 0, 1, 4.1, 0.55), [track]);
  const armcoR = useMemo(() => ribbonGeometry(track, 0, 0, 0, 1, -4.1, 0.55), [track]);
  const skirtL = useMemo(() => skirtGeometry(track, 2.82), [track]);
  const skirtR = useMemo(() => skirtGeometry(track, -2.82), [track]);
  // greenery only where it cannot touch the asphalt
  const trees = useMemo(() => {
    const spots = [
      [58, 50],
      [63, 47],
      [55, 54],
      [18, 36],
      [26, 46],
      [12, 30],
      [70, -36],
      [44, -48],
      [30, 38],
      [76, -34],
    ];
    return spots.filter(([x, z]) => {
      for (let s = 0; s < track.samples.length; s += 8) {
        const p = track.samples[s];
        if ((p.x - x) ** 2 + (p.z - z) ** 2 < 9 * 9) return false;
      }
      return true;
    });
  }, [track]);
  const [tun0, tun1] = track.tunnelFractions;
  const tunnelRoof = useMemo(
    () => ribbonGeometry(track, 8, 4.4, tun0, tun1),
    [track, tun0, tun1]
  );
  const tunnelL = useMemo(
    () => ribbonGeometry(track, 0, 0, tun0, tun1, 3.7, 4.4),
    [track, tun0, tun1]
  );
  const tunnelR = useMemo(
    () => ribbonGeometry(track, 0, 0, tun0, tun1, -3.7, 4.4),
    [track, tun0, tun1]
  );
  // a solid floor spanning the full tunnel width — the road is only 5.6 wide
  // but the walls sit at ±3.7, so without this the elevated tunnel left a slot
  // either side of the asphalt that looked straight down onto the water
  const tunnelFloor = useMemo(
    () => ribbonGeometry(track, 8.2, -0.05, tun0, tun1),
    [track, tun0, tun1]
  );
  const boats = useMemo(yachts, []);
  const pool = useMemo(() => poolPlacement(track), [track]);
  const textures = useMemo(
    () => banners.map((b) => bannerTexture(b, livery)),
    [banners, livery]
  );
  const carRef = useRef<THREE.Group | null>(null);
  const lineGeoRef = useRef<THREE.BufferGeometry | null>(null);

  const tunnelMid = track.curve.getPointAt((tun0 + tun1) / 2);

  useLayoutEffect(() => {
    carRef.current?.traverse((o) => {
      o.castShadow = true;
    });
  }, []);

  return (
    <>
      <color attach="background" args={["#9FD0F2"]} />
      <fog attach="fog" args={["#BCDcf2", 130, 340]} />
      <hemisphereLight args={["#D8ECFC", "#998F77", 1.0]} />
      <directionalLight
        position={[70, 110, 40]}
        intensity={2.4}
        color="#FFF6E0"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-120}
        shadow-camera-right={120}
        shadow-camera-top={120}
        shadow-camera-bottom={-120}
        shadow-camera-far={320}
        shadow-bias={-0.0004}
      />

      {/* the rock and the sea */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[30, -0.1, 10]} receiveShadow>
        <planeGeometry args={[500, 500]} />
        <meshStandardMaterial color="#CFC8B4" roughness={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[62, 0.02, -6]}>
        <planeGeometry args={[46, 36]} />
        <meshStandardMaterial color="#2D9BC9" roughness={0.2} metalness={0.1} />
      </mesh>
      {boats.map((b, i) => (
        <group key={i} position={[b.x, 0.25, b.z]} rotation={[0, b.rot, 0]}>
          <mesh castShadow>
            <boxGeometry args={[b.l * 0.36, 0.4, b.l]} />
            <meshStandardMaterial color="#F8FAFC" roughness={0.4} />
          </mesh>
          <mesh position={[0, 0.34, -b.l * 0.1]}>
            <boxGeometry args={[b.l * 0.22, 0.26, b.l * 0.42]} />
            <meshStandardMaterial color="#DDE3E8" roughness={0.4} />
          </mesh>
        </group>
      ))}
      {[
        [-30, 26, 90, 60],
        [10, 30, 120, 76],
        [60, 24, 110, 90],
      ].map(([x, h, z, w], i) => (
        <mesh key={i} position={[x, 0, z]}>
          <coneGeometry args={[w as number, (h as number) * 2, 7]} />
          <meshStandardMaterial color="#86A06B" roughness={1} flatShading />
        </mesh>
      ))}

      <City track={track} />

      {/* the Piscine pool, dropped into the clearest infield spot */}
      <group position={[pool.x, 0, pool.z]} rotation={[0, pool.rot, 0]}>
        <mesh position={[0, 0.05, 0]} receiveShadow>
          <boxGeometry args={[pool.w + 2, 0.14, pool.d + 2]} />
          <meshStandardMaterial color="#E8E4D8" roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.13, 0]}>
          <boxGeometry args={[pool.w, 0.1, pool.d]} />
          <meshStandardMaterial color="#3EC1D6" roughness={0.2} metalness={0.1} />
        </mesh>
      </group>

      {/* embankments, road, kerbs, armco */}
      <mesh geometry={skirtL}>
        <meshStandardMaterial color="#B5AC97" roughness={1} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={skirtR}>
        <meshStandardMaterial color="#B5AC97" roughness={1} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={asphalt} receiveShadow>
        <meshStandardMaterial color="#5C6068" roughness={0.95} />
      </mesh>
      <Kerbs track={track} />
      <mesh geometry={armcoL}>
        <meshStandardMaterial color="#CDD2DA" roughness={0.4} metalness={0.4} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={armcoR}>
        <meshStandardMaterial color="#CDD2DA" roughness={0.4} metalness={0.4} side={THREE.DoubleSide} />
      </mesh>
      <mesh
        geometry={line}
        ref={(m) => {
          lineGeoRef.current = m ? (m.geometry as THREE.BufferGeometry) : null;
          if (m) (m.geometry as THREE.BufferGeometry).setDrawRange(0, 0);
        }}
      >
        <meshStandardMaterial color={livery} emissive={livery} emissiveIntensity={0.55} />
      </mesh>

      {/* the tunnel under the Fairmont */}
      <mesh geometry={tunnelFloor} receiveShadow>
        <meshStandardMaterial color="#4C5058" roughness={0.95} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={tunnelRoof}>
        <meshStandardMaterial color="#C2B8A4" roughness={0.9} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={tunnelL}>
        <meshStandardMaterial color="#958C7A" roughness={0.9} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={tunnelR}>
        <meshStandardMaterial color="#958C7A" roughness={0.9} side={THREE.DoubleSide} />
      </mesh>
      {[0.2, 0.5, 0.8].map((f, i) => {
        const p = track.curve.getPointAt(tun0 + (tun1 - tun0) * f);
        return (
          <pointLight
            key={`tl-${i}`}
            position={[p.x, p.y + 3.4, p.z]}
            intensity={70}
            distance={22}
            color="#FFB36B"
          />
        );
      })}
      {[0.16, 0.46, 0.78].map((f, i) => {
        const t = tun0 + (tun1 - tun0) * f;
        const p = track.curve.getPointAt(t);
        const tan = track.curve.getTangentAt(t);
        return (
          <mesh
            key={`hotel-${i}`}
            position={[p.x, p.y + 6.4, p.z]}
            rotation={[0, Math.atan2(tan.x, tan.z), 0]}
            castShadow
          >
            <boxGeometry args={[17, 5.2, 16]} />
            <meshStandardMaterial color="#EADFC6" roughness={0.85} />
          </mesh>
        );
      })}

      {/* career ad bridges */}
      {track.cornerPositions.map((c, i) => {
        const fi = Math.round(track.cornerFractions[i] * (track.samples.length - 1));
        const tan = track.tangents[fi];
        return (
          <AdBridge
            key={i}
            position={new THREE.Vector3(c.x, c.y, c.z)}
            rotationY={Math.atan2(tan.x, tan.z)}
            texture={textures[i % textures.length]}
            onClick={() => onSelect(i)}
          />
        );
      })}

      {/* marshal posts at every career corner */}
      {track.cornerPositions.map((c, i) => (
        <group key={`marshal-${i}`} position={[c.x + 5.4, c.y, c.z + 2]}>
          <mesh position={[0, 0.55, 0]} castShadow>
            <boxGeometry args={[0.9, 1.1, 0.9]} />
            <meshStandardMaterial color="#E8762C" roughness={0.8} />
          </mesh>
          <mesh position={[0, 1.15, 0]}>
            <boxGeometry args={[0.95, 0.1, 0.95]} />
            <meshStandardMaterial color="#F4F4F2" roughness={0.8} />
          </mesh>
        </group>
      ))}

      {/* greenery */}
      {trees.map(([x, z], i) => (
        <group key={`tree-${i}`} position={[x, 0, z]}>
          <mesh position={[0, 1.1, 0]} castShadow>
            <cylinderGeometry args={[0.12, 0.16, 2.2, 5]} />
            <meshStandardMaterial color="#6B5A44" roughness={1} />
          </mesh>
          <mesh position={[0, 2.6, 0]} castShadow>
            <icosahedronGeometry args={[1.4 + (i % 3) * 0.4, 0]} />
            <meshStandardMaterial color="#4E8A47" roughness={1} flatShading />
          </mesh>
        </group>
      ))}

      {/* grandstands, crowd, flags */}
      {STANDS.map((g, i) => (
        <group key={`stand-${i}`} position={[g.x, 0, g.z]}>
          <mesh position={[0, 1.4, 0]} castShadow>
            <boxGeometry args={[4, 2.8, g.len]} />
            <meshStandardMaterial color="#DCD6C6" roughness={0.85} />
          </mesh>
          <mesh
            position={[g.face * -0.6, 3.2, 0]}
            rotation={[0, 0, g.face * 0.18]}
            castShadow
          >
            <boxGeometry args={[4.6, 0.18, g.len + 1]} />
            <meshStandardMaterial color="#F7F5EF" roughness={0.7} />
          </mesh>
          {[-1, 0, 1].map((f) => (
            <group key={f} position={[g.face * -1.6, 0, f * (g.len / 2 - 2)]}>
              <mesh position={[0, 2.6, 0]}>
                <cylinderGeometry args={[0.05, 0.05, 5.2, 5]} />
                <meshStandardMaterial color="#8A8FA0" roughness={0.5} />
              </mesh>
              <mesh position={[0.45, 4.9, 0]}>
                <boxGeometry args={[0.9, 0.55, 0.04]} />
                <meshStandardMaterial
                  color={f === 0 ? livery : CROWD[(i + f + 3) % CROWD.length]}
                  roughness={0.7}
                  side={THREE.DoubleSide}
                />
              </mesh>
            </group>
          ))}
        </group>
      ))}
      <Crowd stands={STANDS} />

      {/* start gantry */}
      <group
        position={[track.samples[0].x, track.samples[0].y, track.samples[0].z]}
        rotation={[0, Math.atan2(track.tangents[0].x, track.tangents[0].z), 0]}
      >
        <mesh position={[0, 4.6, 0]} castShadow>
          <boxGeometry args={[11, 0.6, 0.6]} />
          <meshStandardMaterial color="#3A3F4C" roughness={0.6} />
        </mesh>
        {[-4.4, 4.4].map((x) => (
          <mesh key={x} position={[x, 2.3, 0]} castShadow>
            <boxGeometry args={[0.45, 4.6, 0.45]} />
            <meshStandardMaterial color="#3A3F4C" roughness={0.6} />
          </mesh>
        ))}
        {[-2.4, -1.2, 0, 1.2, 2.4].map((x) => (
          <mesh key={`l-${x}`} position={[x, 4.2, 0.34]}>
            <sphereGeometry args={[0.18, 8, 8]} />
            <meshStandardMaterial color="#FF1801" emissive="#FF1801" emissiveIntensity={1.2} />
          </mesh>
        ))}
      </group>

      <group ref={carRef}>
        <F1Car livery={livery} />
      </group>

      <Rig progressRef={progressRef} track={track} carRef={carRef} lineRef={lineGeoRef} />
    </>
  );
};

const CircuitScene = (props: SceneProps) => (
  <Canvas
    dpr={[1, 1.6]}
    shadows
    camera={{ fov: 52, near: 0.5, far: 380, position: [0, 12, -40] }}
    gl={{
      antialias: true,
      powerPreference: "high-performance",
      toneMapping: THREE.ACESFilmicToneMapping,
      toneMappingExposure: 1.12,
    }}
  >
    <Scene {...props} />
  </Canvas>
);

export default CircuitScene;
