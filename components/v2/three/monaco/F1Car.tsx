// A low-poly F1 car in the livery colour, nose toward +z, about 5.6 m long.
export const F1Car = ({ livery }: { livery: string }) => {
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

