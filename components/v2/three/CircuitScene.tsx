import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { MutableRefObject, useMemo, useRef } from "react";
import * as THREE from "three";

import {
  buildTrack,
  cityBlocks,
  kerbSlabs,
  ribbonGeometry,
  TrackData,
  windowTexture,
} from "./trackData";

const YAS_TEAL = "#27C4D6";

interface SceneProps {
  progressRef: MutableRefObject<number>;
  livery: string;
  glow: string;
}

const Car = ({ livery }: { livery: string }) => (
  <group>
    {/* monocoque */}
    <mesh position={[0, 0.42, 0]}>
      <boxGeometry args={[1.5, 0.55, 4.6]} />
      <meshStandardMaterial color={livery} roughness={0.4} />
    </mesh>
    {/* nose */}
    <mesh position={[0, 0.34, 2.8]}>
      <boxGeometry args={[0.8, 0.36, 1.6]} />
      <meshStandardMaterial color={livery} roughness={0.4} />
    </mesh>
    {/* front wing */}
    <mesh position={[0, 0.18, 3.6]}>
      <boxGeometry args={[3, 0.12, 0.7]} />
      <meshStandardMaterial color="#16161B" roughness={0.6} />
    </mesh>
    {/* rear wing */}
    <mesh position={[0, 0.95, -2.2]}>
      <boxGeometry args={[2.6, 0.5, 0.45]} />
      <meshStandardMaterial color="#16161B" roughness={0.6} />
    </mesh>
    {/* halo + cockpit */}
    <mesh position={[0, 0.78, 0.4]}>
      <boxGeometry args={[0.9, 0.3, 1.3]} />
      <meshStandardMaterial color="#0C0C10" roughness={0.5} />
    </mesh>
    {/* wheels */}
    {[
      [-1.25, 1.55],
      [1.25, 1.55],
      [-1.35, -1.7],
      [1.35, -1.7],
    ].map(([x, z], i) => (
      <mesh key={i} position={[x, 0.42, z]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.46, 0.46, 0.5, 14]} />
        <meshStandardMaterial color="#121215" roughness={0.85} />
      </mesh>
    ))}
  </group>
);

const Landmarks = ({
  track,
  livery,
  windows,
}: {
  track: TrackData;
  livery: string;
  windows: THREE.Texture;
}) => {
  const slate = "#2A2D45";
  const purple = "#3E3963";
  return (
    <group>
      {track.cornerPositions.map((c, i) => {
        const side = c.x < 0 ? -1 : 1; // landmark outside the anchor
        const lx = c.x + side * 22;
        switch (i % 7) {
          case 0: // Marina Bay Sands
            return (
              <group key={i} position={[lx, 0, c.z]}>
                {[-5, 0, 5].map((dx) => (
                  <mesh key={dx} position={[dx, 7, 0]}>
                    <boxGeometry args={[3.4, 14, 2.6]} />
                    <meshStandardMaterial
                      color={purple}
                      emissive="#FFD98A"
                      emissiveMap={windows}
                      emissiveIntensity={0.55}
                    />
                  </mesh>
                ))}
                <mesh position={[0, 14.6, 0]} rotation={[0, 0, 0.04]}>
                  <boxGeometry args={[16.5, 1, 4]} />
                  <meshStandardMaterial color="#474168" roughness={0.5} />
                </mesh>
              </group>
            );
          case 1: // Casino
            return (
              <group key={i} position={[lx, 0, c.z]}>
                <mesh position={[0, 2.2, 0]}>
                  <boxGeometry args={[10, 4.4, 7]} />
                  <meshStandardMaterial
                    color={slate}
                    emissive="#FFD98A"
                    emissiveMap={windows}
                    emissiveIntensity={0.5}
                  />
                </mesh>
                <mesh position={[0, 5.4, 0]}>
                  <sphereGeometry args={[2.4, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
                  <meshStandardMaterial color="#474168" roughness={0.45} />
                </mesh>
              </group>
            );
          case 2: // Spa forest
          case 5: // Silverstone greenery
            return (
              <group key={i} position={[lx, 0, c.z]}>
                {[
                  [-4, 0],
                  [2, 3],
                  [6, -3],
                  [-1, -6],
                  [9, 4],
                  [-7, 6],
                ].map(([dx, dz], j) => (
                  <mesh key={j} position={[dx, 1.5 + (j % 3) * 0.4, dz]}>
                    <icosahedronGeometry args={[1.7 + (j % 3) * 0.5, 0]} />
                    <meshStandardMaterial color="#1B4023" roughness={0.9} flatShading />
                  </mesh>
                ))}
              </group>
            );
          case 3: // Monza grandstand
            return (
              <group key={i} position={[lx - side * 8, 0, c.z]}>
                <mesh position={[0, 1.6, 0]}>
                  <boxGeometry args={[4, 3.2, 16]} />
                  <meshStandardMaterial color={slate} roughness={0.7} />
                </mesh>
                {[0, 1, 2, 3, 4].map((j) => (
                  <mesh key={j} position={[0, 3.4, -6.4 + j * 3.2]}>
                    <boxGeometry args={[4.4, 0.3, 1.6]} />
                    <meshStandardMaterial
                      color={j % 2 === 0 ? livery : "#E8E8E8"}
                      roughness={0.6}
                    />
                  </mesh>
                ))}
              </group>
            );
          case 4: // observation wheel
            return (
              <group key={i} position={[lx, 0, c.z]} rotation={[0, Math.PI / 2, 0]}>
                <mesh position={[0, 8, 0]}>
                  <torusGeometry args={[6.4, 0.18, 8, 40]} />
                  <meshStandardMaterial color="#8FA3C8" roughness={0.4} />
                </mesh>
                {Array.from({ length: 10 }).map((_, j) => (
                  <mesh
                    key={j}
                    position={[0, 8, 0]}
                    rotation={[0, 0, (j * Math.PI) / 10]}
                  >
                    <boxGeometry args={[0.12, 12.8, 0.12]} />
                    <meshStandardMaterial color="#5C6A8F" roughness={0.5} />
                  </mesh>
                ))}
                {Array.from({ length: 12 }).map((_, j) => {
                  const a = (j * Math.PI * 2) / 12;
                  return (
                    <mesh
                      key={`pod-${j}`}
                      position={[Math.cos(a) * 6.4, 8 + Math.sin(a) * 6.4, 0]}
                    >
                      <sphereGeometry args={[0.32, 8, 8]} />
                      <meshStandardMaterial
                        color="#FFD98A"
                        emissive="#FFD98A"
                        emissiveIntensity={1.4}
                      />
                    </mesh>
                  );
                })}
                {[-1, 1].map((s) => (
                  <mesh key={s} position={[s * 1.6, 4, 0]} rotation={[0, 0, s * 0.36]}>
                    <boxGeometry args={[0.5, 8.4, 0.5]} />
                    <meshStandardMaterial color="#3E4565" roughness={0.6} />
                  </mesh>
                ))}
              </group>
            );
          default: // Singapore skyline slice
            return (
              <group key={i} position={[lx, 0, c.z]}>
                {[
                  [-4, 11, 0],
                  [1, 7, 3],
                  [5, 9, -2],
                ].map(([dx, h, dz], j) => (
                  <mesh key={j} position={[dx, h / 2, dz]}>
                    <boxGeometry args={[3.4, h, 3]} />
                    <meshStandardMaterial
                      color={slate}
                      emissive="#FFD98A"
                      emissiveMap={windows}
                      emissiveIntensity={0.5}
                    />
                  </mesh>
                ))}
              </group>
            );
        }
      })}
    </group>
  );
};

// fences along the street-circuit corners (T1 + the Sling)
const Fences = ({ track }: { track: TrackData }) => {
  const posts = useMemo(() => {
    const out: { x: number; y: number; z: number; rotY: number }[] = [];
    for (const ci of [0, 6]) {
      const f = track.cornerFractions[ci];
      for (let d = -14; d <= 14; d += 2.4) {
        const t = THREE.MathUtils.clamp(f + d / track.length, 0, 1);
        const i = Math.round(t * (track.samples.length - 1));
        const tan = track.tangents[i];
        const side = new THREE.Vector3(0, 1, 0).cross(tan).setY(0).normalize();
        for (const s of [1, -1]) {
          out.push({
            x: track.samples[i].x + side.x * s * 5.6,
            y: track.samples[i].y,
            z: track.samples[i].z + side.z * s * 5.6,
            rotY: Math.atan2(tan.x, tan.z),
          });
        }
      }
    }
    return out;
  }, [track]);
  return (
    <group>
      {posts.map((p, i) => (
        <group key={i} position={[p.x, p.y, p.z]} rotation={[0, p.rotY, 0]}>
          <mesh position={[0, 0.7, 0]}>
            <boxGeometry args={[0.1, 1.4, 0.1]} />
            <meshStandardMaterial color="#9AA3B8" roughness={0.5} />
          </mesh>
          <mesh position={[0, 0.35, 0]}>
            <boxGeometry args={[0.34, 0.7, 0.5]} />
            <meshStandardMaterial color="#3A3F4F" roughness={0.8} />
          </mesh>
        </group>
      ))}
    </group>
  );
};

const TunnelMouth = ({ track }: { track: TrackData }) => {
  const end = track.samples[track.samples.length - 1];
  const dipStart = useMemo(() => {
    for (const s of track.samples) if (s.y < -0.2) return s;
    return end;
  }, [track, end]);
  return (
    <group position={[end.x, 0, dipStart.z + 4]}>
      {/* portal lintel with teal LED */}
      <mesh position={[0, 1.6, 0]}>
        <boxGeometry args={[11, 1.2, 1.6]} />
        <meshStandardMaterial color="#23263A" roughness={0.6} />
      </mesh>
      <mesh position={[0, 1.1, 0.6]}>
        <boxGeometry args={[10, 0.22, 0.1]} />
        <meshStandardMaterial
          color={YAS_TEAL}
          emissive={YAS_TEAL}
          emissiveIntensity={2.2}
        />
      </mesh>
      {/* canopy arcs */}
      {[0, 1].map((j) => (
        <mesh key={j} position={[0, 0.4, -2.5 - j * 3]} rotation={[0, 0, 0]}>
          <torusGeometry args={[5.4 + j, 0.09, 6, 24, Math.PI]} />
          <meshStandardMaterial
            color={YAS_TEAL}
            emissive={YAS_TEAL}
            emissiveIntensity={0.9}
          />
        </mesh>
      ))}
      {/* roof slab the car disappears under */}
      <mesh position={[0, 0.4, 9]}>
        <boxGeometry args={[14, 0.8, 18]} />
        <meshStandardMaterial color="#0A0B12" roughness={0.9} />
      </mesh>
      {/* side walls down the ramp */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 5.4, -0.6, 2]} rotation={[0, 0, 0]}>
          <boxGeometry args={[0.8, 3.4, 16]} />
          <meshStandardMaterial color="#1A1C2A" roughness={0.8} />
        </mesh>
      ))}
      {/* teal wash so the finale never goes black */}
      <pointLight position={[0, 4, -6]} intensity={140} distance={48} color={YAS_TEAL} />
      <pointLight position={[0, -1, 6]} intensity={60} distance={22} color={YAS_TEAL} />
    </group>
  );
};

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
    // stop just inside the tunnel mouth rather than deep underground
    const target = THREE.MathUtils.clamp(progressRef.current, 0, 1) * 0.955;
    // critically-damped chase
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

    // racing line draw range
    if (lineRef.current) {
      const segs = Math.floor(t * (track.samples.length - 2));
      lineRef.current.setDrawRange(0, segs * 6);
    }

    // chase camera: behind and above, looking past the car; never follow
    // it below ground level
    tmp.cam.copy(tmp.pos).addScaledVector(tmp.tan, -18);
    tmp.cam.y = Math.max(tmp.cam.y + 12, 6.5);
    camera.position.lerp(tmp.cam, k);
    tmp.target.copy(tmp.pos).addScaledVector(tmp.tan, 9);
    look.current.lerp(tmp.target, k);
    camera.lookAt(look.current);
  });
  return null;
};

const Scene = ({ progressRef, livery, glow }: SceneProps) => {
  const track = useMemo(buildTrack, []);
  const windows = useMemo(windowTexture, []);
  const grass = useMemo(() => ribbonGeometry(track, 15, -0.02), [track]);
  const asphalt = useMemo(() => ribbonGeometry(track, 7.6, 0.02), [track]);
  const line = useMemo(() => ribbonGeometry(track, 0.8, 0.07), [track]);
  const kerbs = useMemo(() => kerbSlabs(track), [track]);
  const city = useMemo(() => cityBlocks(track), [track]);
  const carRef = useRef<THREE.Group | null>(null);
  const lineGeoRef = useRef<THREE.BufferGeometry | null>(null);

  return (
    <>
      <color attach="background" args={["#080A14"]} />
      <fog attach="fog" args={["#080A14", 90, 230]} />
      <hemisphereLight args={["#39456E", "#0C0E1A", 1.1]} />
      <ambientLight intensity={0.55} color="#9FB0DC" />
      <directionalLight position={[40, 60, -30]} intensity={1.4} color="#C3CEF0" />

      {/* ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.06, 260]}>
        <planeGeometry args={[400, 900]} />
        <meshStandardMaterial color="#10131F" roughness={1} />
      </mesh>

      <mesh geometry={grass}>
        <meshStandardMaterial color="#16321F" roughness={1} />
      </mesh>
      <mesh geometry={asphalt}>
        <meshStandardMaterial color="#23252F" roughness={0.95} />
      </mesh>
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
          emissiveIntensity={1.6}
          toneMapped={false}
        />
      </mesh>

      {/* kerbs */}
      {kerbs.map((k, i) => (
        <mesh key={i} position={k.position} rotation={[0, k.rotationY, 0]}>
          <boxGeometry args={[1.2, 0.09, 1.9]} />
          <meshStandardMaterial
            color={k.red ? "#C8322E" : "#E8E8E8"}
            roughness={0.7}
          />
        </mesh>
      ))}

      {/* the city */}
      {city.map((b, i) => (
        <mesh key={i} position={[b.x, b.h / 2, b.z]}>
          <boxGeometry args={[b.w, b.h, b.d]} />
          <meshStandardMaterial
            color="#333A5C"
            emissive="#FFD98A"
            emissiveMap={windows}
            emissiveIntensity={0.75}
            roughness={0.8}
          />
        </mesh>
      ))}

      <Landmarks track={track} livery={livery} windows={windows} />
      <Fences track={track} />
      <TunnelMouth track={track} />

      {/* start gantry */}
      <group position={[track.samples[0].x, 0, track.samples[0].z + 6]}>
        <mesh position={[0, 4.4, 0]}>
          <boxGeometry args={[12, 0.7, 0.7]} />
          <meshStandardMaterial color="#23263A" roughness={0.6} />
        </mesh>
        {[-4.4, 4.4].map((x) => (
          <mesh key={x} position={[x, 2.2, 0]}>
            <boxGeometry args={[0.5, 4.4, 0.5]} />
            <meshStandardMaterial color="#23263A" roughness={0.6} />
          </mesh>
        ))}
        {[-3, -1.5, 0, 1.5, 3].map((x) => (
          <mesh key={`l-${x}`} position={[x, 4, 0.4]}>
            <sphereGeometry args={[0.22, 8, 8]} />
            <meshStandardMaterial
              color="#FF1801"
              emissive="#FF1801"
              emissiveIntensity={1.6}
            />
          </mesh>
        ))}
      </group>

      <group ref={carRef}>
        <Car livery={livery} />
        <pointLight position={[0, 2.6, 0]} intensity={90} distance={34} color={glow} />
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
    dpr={[1, 1.75]}
    camera={{ fov: 52, near: 0.5, far: 220, position: [0, 12, -56] }}
    gl={{ antialias: true, powerPreference: "high-performance" }}
  >
    <Scene {...props} />
  </Canvas>
);

export default CircuitScene;
