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
  kerbSlabs,
  ribbonGeometry,
  TrackData,
  yachts,
} from "./trackData";

interface SceneProps {
  progressRef: MutableRefObject<number>;
  livery: string;
  glow: string;
  banners: string[];
  onSelect: (i: number) => void;
}

// Monte Carlo facade palette
const TONES = ["#E9DFCC", "#DECBAA", "#D9BA97", "#EDE8DC", "#CBAB8E"];

// ——— a proper little F1 car ———
const F1Car = ({ livery }: { livery: string }) => {
  const body = <meshStandardMaterial color={livery} roughness={0.35} metalness={0.1} />;
  const dark = <meshStandardMaterial color="#17171C" roughness={0.5} />;
  return (
    <group>
      {/* floor */}
      <mesh position={[0, 0.14, 0.1]}>
        <boxGeometry args={[1.9, 0.08, 4.6]} />
        {dark}
      </mesh>
      {/* monocoque, tapering to the nose */}
      <mesh position={[0, 0.42, -0.4]}>
        <boxGeometry args={[1.05, 0.5, 2.6]} />
        {body}
      </mesh>
      <mesh position={[0, 0.38, 1.6]} rotation={[0.04, 0, 0]} scale={[0.62, 0.7, 1]}>
        <boxGeometry args={[1, 0.42, 1.8]} />
        {body}
      </mesh>
      {/* nose cone */}
      <mesh position={[0, 0.34, 2.9]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.22, 1.1, 10]} />
        {body}
      </mesh>
      {/* front wing + endplates */}
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
      {/* sidepods */}
      {[-0.78, 0.78].map((x) => (
        <mesh key={x} position={[x, 0.42, -0.5]} scale={[1, 1, 1]}>
          <boxGeometry args={[0.55, 0.46, 2]} />
          {body}
        </mesh>
      ))}
      {/* cockpit + halo */}
      <mesh position={[0, 0.62, 0.55]}>
        <boxGeometry args={[0.66, 0.26, 1]} />
        {dark}
      </mesh>
      <mesh position={[0, 0.72, 0.55]} rotation={[0, 0, 0]}>
        <torusGeometry args={[0.34, 0.045, 6, 12, Math.PI]} />
        {dark}
      </mesh>
      <mesh position={[0, 0.62, 0.92]} rotation={[0.5, 0, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 0.5, 6]} />
        {dark}
      </mesh>
      {/* helmet */}
      <mesh position={[0, 0.68, 0.42]}>
        <sphereGeometry args={[0.16, 10, 8]} />
        <meshStandardMaterial color="#F2F2F4" roughness={0.3} />
      </mesh>
      {/* airbox + engine cover + fin */}
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
      {/* rear wing: main, flap, endplates, beam */}
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
      {/* wheels: tyre + rim face */}
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

// overhead advertising bridge carrying a career entry
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
      <mesh key={x} position={[x, 2.5, 0]}>
        <boxGeometry args={[0.4, 5, 0.4]} />
        <meshStandardMaterial color="#3A3F4C" roughness={0.6} />
      </mesh>
    ))}
    <mesh
      position={[0, 5.4, 0]}
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
  const sm = useRef({ t: 0 });
  const look = useRef(new THREE.Vector3());
  const tmp = useMemo(
    () => ({
      pos: new THREE.Vector3(),
      tan: new THREE.Vector3(),
      cam: new THREE.Vector3(),
      target: new THREE.Vector3(),
    }),
    []
  );

  useFrame((_, dt) => {
    const target = THREE.MathUtils.clamp(progressRef.current, 0, 1) * 0.985;
    const k = 1 - Math.exp(-5.5 * Math.min(dt, 0.05));
    sm.current.t += (target - sm.current.t) * k;
    const t = THREE.MathUtils.clamp(sm.current.t, 0.0001, 0.9999);

    track.curve.getPointAt(t, tmp.pos);
    track.curve.getTangentAt(t, tmp.tan);

    if (carRef.current) {
      carRef.current.position.copy(tmp.pos);
      tmp.target.copy(tmp.pos).add(tmp.tan);
      carRef.current.lookAt(tmp.target);
    }
    if (lineRef.current) {
      const segs = Math.floor(t * (track.samples.length - 2));
      lineRef.current.setDrawRange(0, segs * 6);
    }

    // drop low through the tunnel, fly high everywhere else
    const [t0, t1] = track.tunnelFractions;
    const inTunnel = t > t0 - 0.012 && t < t1 + 0.004;
    const back = inTunnel ? -9 : -17;
    const lift = inTunnel ? 2.4 : 11;
    tmp.cam.copy(tmp.pos).addScaledVector(tmp.tan, back);
    tmp.cam.y = tmp.pos.y + lift;
    camera.position.lerp(tmp.cam, k);
    tmp.target.copy(tmp.pos).addScaledVector(tmp.tan, 9);
    look.current.lerp(tmp.target, k);
    camera.lookAt(look.current);
  });
  return null;
};

const bannerTexture = (text: string, livery: string) => {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 84;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#FBF8F1";
  ctx.fillRect(0, 0, 512, 84);
  ctx.fillStyle = livery;
  ctx.fillRect(0, 0, 18, 84);
  ctx.fillRect(0, 70, 512, 14);
  ctx.fillStyle = "#16181E";
  ctx.font = "800 44px system-ui, sans-serif";
  ctx.textBaseline = "middle";
  ctx.fillText(text.toUpperCase(), 40, 36);
  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 4;
  return tex;
};

const Kerbs = ({ track }: { track: TrackData }) => {
  const slabs = useMemo(() => kerbSlabs(track), [track]);
  const redRef = useRef<THREE.InstancedMesh>(null);
  const whiteRef = useRef<THREE.InstancedMesh>(null);
  const red = useMemo(() => slabs.filter((s) => s.red), [slabs]);
  const white = useMemo(() => slabs.filter((s) => !s.red), [slabs]);

  useLayoutEffect(() => {
    const o = new THREE.Object3D();
    [
      [redRef.current, red],
      [whiteRef.current, white],
    ].forEach(([mesh, list]) => {
      const m = mesh as THREE.InstancedMesh | null;
      if (!m) return;
      (list as typeof red).forEach((s, i) => {
        o.position.copy(s.position);
        o.rotation.set(0, s.rotationY, 0);
        o.updateMatrix();
        m.setMatrixAt(i, o.matrix);
      });
      m.instanceMatrix.needsUpdate = true;
    });
  }, [red, white]);

  return (
    <>
      <instancedMesh ref={redRef} args={[undefined, undefined, red.length]}>
        <boxGeometry args={[1.15, 0.08, 1.7]} />
        <meshStandardMaterial color="#C8322E" roughness={0.7} />
      </instancedMesh>
      <instancedMesh ref={whiteRef} args={[undefined, undefined, white.length]}>
        <boxGeometry args={[1.15, 0.08, 1.7]} />
        <meshStandardMaterial color="#EDEDED" roughness={0.7} />
      </instancedMesh>
    </>
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
      o.position.set(b.x, b.h / 2, b.z);
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
    <instancedMesh ref={ref} args={[undefined, undefined, blocks.length]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial roughness={0.85} />
    </instancedMesh>
  );
};

const Scene = ({ progressRef, livery, banners, onSelect }: SceneProps) => {
  const track = useMemo(buildTrack, []);
  const asphalt = useMemo(() => ribbonGeometry(track, 7.2, 0.02), [track]);
  const line = useMemo(() => ribbonGeometry(track, 0.7, 0.07), [track]);
  const armcoL = useMemo(
    () => ribbonGeometry(track, 0, 0, 0, 1, 4.2, 0.55),
    [track]
  );
  const armcoR = useMemo(
    () => ribbonGeometry(track, 0, 0, 0, 1, -4.2, 0.55),
    [track]
  );
  const [tun0, tun1] = track.tunnelFractions;
  const tunnelRoof = useMemo(
    () => ribbonGeometry(track, 10, 4.4, tun0, tun1),
    [track, tun0, tun1]
  );
  const tunnelL = useMemo(
    () => ribbonGeometry(track, 0, 0, tun0, tun1, 4.8, 4.4),
    [track, tun0, tun1]
  );
  const tunnelR = useMemo(
    () => ribbonGeometry(track, 0, 0, tun0, tun1, -4.8, 4.4),
    [track, tun0, tun1]
  );
  const boats = useMemo(yachts, []);
  const textures = useMemo(
    () => banners.map((b) => bannerTexture(b, livery)),
    [banners, livery]
  );
  const carRef = useRef<THREE.Group | null>(null);
  const lineGeoRef = useRef<THREE.BufferGeometry | null>(null);

  const tunnelMid = track.curve.getPointAt((tun0 + tun1) / 2);

  return (
    <>
      <color attach="background" args={["#A8CDE8"]} />
      <fog attach="fog" args={["#BBD5EA", 120, 320]} />
      <hemisphereLight args={["#CFE4F7", "#8E8A77", 1.15]} />
      <directionalLight position={[60, 90, 30]} intensity={2} color="#FFF3DC" />

      {/* the rock and the sea */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[30, -0.1, 10]}>
        <planeGeometry args={[500, 500]} />
        <meshStandardMaterial color="#C9C2B0" roughness={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[62, 0.02, -6]}>
        <planeGeometry args={[46, 36]} />
        <meshStandardMaterial color="#2D7CB8" roughness={0.25} metalness={0.1} />
      </mesh>
      {/* yachts */}
      {boats.map((b, i) => (
        <group key={i} position={[b.x, 0.25, b.z]} rotation={[0, b.rot, 0]}>
          <mesh>
            <boxGeometry args={[b.l * 0.36, 0.4, b.l]} />
            <meshStandardMaterial color="#F4F6F8" roughness={0.4} />
          </mesh>
          <mesh position={[0, 0.34, -b.l * 0.1]}>
            <boxGeometry args={[b.l * 0.22, 0.26, b.l * 0.42]} />
            <meshStandardMaterial color="#DDE3E8" roughness={0.4} />
          </mesh>
        </group>
      ))}
      {/* hills behind the principality */}
      {[
        [-30, 26, 90, 60],
        [10, 30, 120, 76],
        [60, 24, 110, 90],
      ].map(([x, h, z, w], i) => (
        <mesh key={i} position={[x, 0, z]}>
          <coneGeometry args={[w as number, (h as number) * 2, 7]} />
          <meshStandardMaterial color="#8B9876" roughness={1} flatShading />
        </mesh>
      ))}

      <City track={track} />

      <mesh geometry={asphalt}>
        <meshStandardMaterial color="#5A5E66" roughness={0.95} />
      </mesh>
      <Kerbs track={track} />
      {/* armco */}
      <mesh geometry={armcoL}>
        <meshStandardMaterial color="#C6CBD4" roughness={0.4} metalness={0.4} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={armcoR}>
        <meshStandardMaterial color="#C6CBD4" roughness={0.4} metalness={0.4} side={THREE.DoubleSide} />
      </mesh>
      {/* racing line */}
      <mesh
        geometry={line}
        ref={(m) => {
          lineGeoRef.current = m ? (m.geometry as THREE.BufferGeometry) : null;
          if (m) (m.geometry as THREE.BufferGeometry).setDrawRange(0, 0);
        }}
      >
        <meshStandardMaterial
          color={livery}
          emissive={livery}
          emissiveIntensity={0.55}
        />
      </mesh>

      {/* the tunnel under the Fairmont */}
      <mesh geometry={tunnelRoof} position={[0, 0, 0]}>
        <meshStandardMaterial color="#B8AE9C" roughness={0.9} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={tunnelL}>
        <meshStandardMaterial color="#8F8675" roughness={0.9} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={tunnelR}>
        <meshStandardMaterial color="#8F8675" roughness={0.9} side={THREE.DoubleSide} />
      </mesh>
      {/* the Fairmont sits over the tunnel */}
      {[0.18, 0.5, 0.82].map((f, i) => {
        const t = tun0 + (tun1 - tun0) * f;
        const p = track.curve.getPointAt(t);
        const tan = track.curve.getTangentAt(t);
        return (
          <mesh
            key={`hotel-${i}`}
            position={[p.x, p.y + 6.4, p.z]}
            rotation={[0, Math.atan2(tan.x, tan.z), 0]}
          >
            <boxGeometry args={[17, 5.2, 15]} />
            <meshStandardMaterial color="#E3D7BE" roughness={0.85} />
          </mesh>
        );
      })}
      {/* sodium glow inside */}
      <pointLight
        position={[tunnelMid.x, tunnelMid.y + 3, tunnelMid.z]}
        intensity={120}
        distance={34}
        color="#FFB36B"
      />

      {/* career ad bridges */}
      {track.cornerPositions.map((c, i) => {
        const fi = Math.round(
          track.cornerFractions[i] * (track.samples.length - 1)
        );
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

      {/* start gantry */}
      <group
        position={[track.samples[0].x, track.samples[0].y, track.samples[0].z]}
        rotation={[0, Math.atan2(track.tangents[0].x, track.tangents[0].z), 0]}
      >
        <mesh position={[0, 4.6, 0]}>
          <boxGeometry args={[11, 0.6, 0.6]} />
          <meshStandardMaterial color="#3A3F4C" roughness={0.6} />
        </mesh>
        {[-4.4, 4.4].map((x) => (
          <mesh key={x} position={[x, 2.3, 0]}>
            <boxGeometry args={[0.45, 4.6, 0.45]} />
            <meshStandardMaterial color="#3A3F4C" roughness={0.6} />
          </mesh>
        ))}
        {[-2.4, -1.2, 0, 1.2, 2.4].map((x) => (
          <mesh key={`l-${x}`} position={[x, 4.2, 0.34]}>
            <sphereGeometry args={[0.18, 8, 8]} />
            <meshStandardMaterial
              color="#FF1801"
              emissive="#FF1801"
              emissiveIntensity={1.2}
            />
          </mesh>
        ))}
      </group>

      <group ref={carRef}>
        <F1Car livery={livery} />
      </group>

      <Rig
        progressRef={progressRef}
        track={track}
        carRef={carRef}
        lineRef={lineGeoRef}
      />
    </>
  );
};

const CircuitScene = (props: SceneProps) => (
  <Canvas
    dpr={[1, 1.6]}
    camera={{ fov: 52, near: 0.5, far: 360, position: [0, 12, -40] }}
    gl={{ antialias: true, powerPreference: "high-performance" }}
  >
    <Scene {...props} />
  </Canvas>
);

export default CircuitScene;
