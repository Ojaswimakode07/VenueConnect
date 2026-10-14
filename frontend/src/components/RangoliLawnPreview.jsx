import { useMemo } from "react";
import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import { Float, OrbitControls, Sparkles } from "@react-three/drei";

const gold = "#f6b94d";

function Drape({ points, color = "#d98228", radius = 0.11 }) {
  const curve = useMemo(
    () => new THREE.CatmullRomCurve3(points.map(([x, y, z]) => new THREE.Vector3(x, y, z))),
    [points]
  );
  return (
    <mesh>
      <tubeGeometry args={[curve, 48, radius, 8, false]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.2} roughness={0.35} />
    </mesh>
  );
}

function FairyLights({ z, offset = 0 }) {
  const bulbs = useMemo(
    () => Array.from({ length: 24 }, (_, index) => [-5.4 + index * 0.47, 3.7 + Math.sin(index * 0.44 + offset) * 0.22]),
    [offset]
  );
  return (
    <group>
      <Drape points={[[-5.5, 3.95, z], [-2.8, 3.45, z], [0, 3.72, z], [2.8, 3.45, z], [5.5, 3.95, z]]} color="#d58a2f" radius={0.045} />
      {bulbs.map(([x, y], index) => (
        <mesh key={index} position={[x, y, z]}>
          <sphereGeometry args={[0.055, 10, 10]} />
          <meshStandardMaterial color="#fff4c5" emissive="#ffbe52" emissiveIntensity={3} />
        </mesh>
      ))}
    </group>
  );
}

function Lantern({ position, scale = 1 }) {
  return (
    <Float speed={1.2} floatIntensity={0.18} rotationIntensity={0.08}>
      <group position={position} scale={scale}>
        <mesh position={[0, 0.25, 0]}>
          <cylinderGeometry args={[0.42, 0.5, 0.68, 20]} />
          <meshStandardMaterial color="#a71918" emissive="#73130d" emissiveIntensity={0.8} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.61, 0]}>
          <sphereGeometry args={[0.29, 18, 12]} />
          <meshStandardMaterial color="#db3120" emissive="#8d1710" emissiveIntensity={0.8} />
        </mesh>
        <mesh position={[0, -0.13, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 0.3, 8]} />
          <meshStandardMaterial color={gold} metalness={0.65} roughness={0.25} />
        </mesh>
        <pointLight color="#ff792b" intensity={1.1} distance={3.2} />
      </group>
    </Float>
  );
}

function FloralPillar({ x }) {
  const blooms = useMemo(
    () => Array.from({ length: 17 }, (_, index) => {
      const angle = index * 2.4;
      return [Math.cos(angle) * 0.28, 1.35 + (index % 6) * 0.35, Math.sin(angle) * 0.22];
    }),
    []
  );
  return (
    <group position={[x, 0, -2.9]}>
      <mesh position={[0, 1.4, 0]} castShadow>
        <cylinderGeometry args={[0.13, 0.18, 2.8, 12]} />
        <meshStandardMaterial color="#f0c46f" metalness={0.35} roughness={0.36} />
      </mesh>
      {blooms.map(([bloomX, y, z], index) => (
        <mesh key={index} position={[bloomX, y, z]} castShadow>
          <sphereGeometry args={[0.18 + (index % 3) * 0.025, 12, 12]} />
          <meshStandardMaterial color={index % 2 ? "#e7a3a0" : "#fff0ca"} roughness={0.7} />
        </mesh>
      ))}
    </group>
  );
}

function RangoliScene() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.08, 0]} receiveShadow>
        <planeGeometry args={[20, 17]} />
        <meshStandardMaterial color="#294c35" roughness={1} />
      </mesh>
      <mesh position={[0, 0.18, -3]} receiveShadow castShadow>
        <boxGeometry args={[9.6, 0.36, 3.1]} />
        <meshStandardMaterial color="#6e1d19" roughness={0.65} />
      </mesh>
      <mesh position={[0, 2.15, -4.38]} receiveShadow>
        <boxGeometry args={[10.6, 4.25, 0.22]} />
        <meshStandardMaterial color="#35100d" roughness={0.72} />
      </mesh>
      <Drape points={[[-5.35, 4.03, -4.12], [-2.7, 2.95, -4.02], [0, 3.65, -4.02], [2.7, 2.95, -4.02], [5.35, 4.03, -4.12]]} radius={0.2} />
      <Drape points={[[-5.1, 3.73, -3.92], [-2.3, 2.72, -3.86], [0, 3.23, -3.86], [2.3, 2.72, -3.86], [5.1, 3.73, -3.92]]} color="#f4ae4c" radius={0.09} />
      <FairyLights z={-3.73} />
      <FairyLights z={-2.85} offset={0.7} />
      <FloralPillar x={-4.15} />
      <FloralPillar x={4.15} />
      <Lantern position={[-3.1, 5.1, -1.9]} scale={1.12} />
      <Lantern position={[0, 5.45, -2.15]} scale={1.32} />
      <Lantern position={[3.15, 5.1, -1.9]} scale={1.12} />
      <Sparkles count={90} scale={[11, 4.6, 5]} position={[0, 2.65, -2.1]} size={2.1} speed={0.25} color="#ffd36b" opacity={0.85} />
    </group>
  );
}

export default function RangoliLawnPreview() {
  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl bg-[#190b09]">
      <Canvas shadows dpr={[1, 2]} camera={{ position: [8.4, 4.7, 8.8], fov: 43 }}>
        <color attach="background" args={["#190b09"]} />
        <ambientLight intensity={0.5} />
        <hemisphereLight args={["#ffcc76", "#173526", 0.55]} />
        <spotLight position={[0, 7, 3]} angle={0.55} penumbra={0.85} intensity={2.5} color="#ffba61" castShadow />
        <pointLight position={[-4, 2.5, 1]} color="#ff9f49" intensity={1.3} distance={7} />
        <pointLight position={[4, 2.5, 1]} color="#ff9f49" intensity={1.3} distance={7} />
        <RangoliScene />
        <OrbitControls autoRotate autoRotateSpeed={0.5} enableDamping dampingFactor={0.06} enablePan={false} minDistance={5.5} maxDistance={14} maxPolarAngle={Math.PI / 2.05} target={[0, 1.9, -2.25]} />
      </Canvas>
      <div className="glass pointer-events-none absolute bottom-3 right-3 rounded-full px-3 py-1.5 text-[11px] text-white">
        Drag to rotate · Scroll to zoom
      </div>
    </div>
  );
}
