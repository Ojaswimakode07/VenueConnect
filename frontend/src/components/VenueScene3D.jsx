import React, { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  OrbitControls,
  Environment,
  RoundedBox,
  Sparkles,
  Float,
  MeshReflectorMaterial,
  Instances,
  Instance,
  Text,
} from "@react-three/drei";

/* ---------------------------------------------------------------------
   Shared decorative pieces
--------------------------------------------------------------------- */

function MandapArch({ primary, secondary, height = 4.2, width = 4.6 }) {
  return (
    <group position={[0, -1, -3]}>
      <RoundedBox args={[0.22, height, 0.22]} radius={0.06} position={[-width / 2, height / 2, 0]} castShadow>
        <meshStandardMaterial color={primary} metalness={0.55} roughness={0.25} />
      </RoundedBox>
      <RoundedBox args={[0.22, height, 0.22]} radius={0.06} position={[width / 2, height / 2, 0]} castShadow>
        <meshStandardMaterial color={primary} metalness={0.55} roughness={0.25} />
      </RoundedBox>
      <RoundedBox args={[width + 0.3, 0.22, 0.22]} radius={0.06} position={[0, height, 0]} castShadow>
        <meshStandardMaterial color={primary} metalness={0.55} roughness={0.25} />
      </RoundedBox>
      {/* floral swags */}
      {[-width / 2, -width / 6, width / 6, width / 2].map((x, i) => (
        <mesh key={i} position={[x, height - 0.25, 0.15]}>
          <sphereGeometry args={[0.22, 16, 16]} />
          <meshStandardMaterial color={secondary} roughness={0.6} />
        </mesh>
      ))}
    </group>
  );
}

function RoundTable({ position, accent }) {
  return (
    <group position={position}>
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[0.85, 0.85, 0.07, 32]} />
        <meshStandardMaterial color="#fffdf7" />
      </mesh>
      <mesh position={[0, -0.33, 0]}>
        <cylinderGeometry args={[0.07, 0.07, 0.58, 12]} />
        <meshStandardMaterial color="#d8d0c0" />
      </mesh>
      <mesh position={[0, 0.08, 0]}>
        <torusGeometry args={[0.5, 0.035, 8, 32]} />
        <meshStandardMaterial color={accent} metalness={0.6} roughness={0.2} />
      </mesh>
      <mesh position={[0, 0.16, 0]}>
        <sphereGeometry args={[0.14, 16, 16]} />
        <meshStandardMaterial color={accent} roughness={0.5} />
      </mesh>
    </group>
  );
}

function SpinningChandelier({ primary }) {
  const ref = useRef();
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.15;
  });
  const crystals = Array.from({ length: 24 }, (_, i) => {
    const angle = (i / 24) * Math.PI * 2;
    const r = 0.9;
    return [Math.cos(angle) * r, -0.3 - (i % 3) * 0.12, Math.sin(angle) * r];
  });

  return (
    <group position={[0, 3.6, -2]} ref={ref}>
      <mesh>
        <torusGeometry args={[0.9, 0.05, 12, 48]} />
        <meshStandardMaterial color={primary} metalness={0.85} roughness={0.1} />
      </mesh>
      <mesh position={[0, 0.35, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.7, 8]} />
        <meshStandardMaterial color={primary} metalness={0.7} />
      </mesh>
      <Instances limit={24}>
        <octahedronGeometry args={[0.07, 0]} />
        <meshPhysicalMaterial color="#ffffff" transmission={0.9} roughness={0} thickness={0.3} emissive="#E8D48A" emissiveIntensity={0.3} />
        {crystals.map((p, i) => (
          <Instance key={i} position={p} />
        ))}
      </Instances>
    </group>
  );
}

/* ---------------------------------------------------------------------
   Grand Mehfil — opulent indoor pillared banquet hall
--------------------------------------------------------------------- */
function GrandMehfilHall({ primary, secondary }) {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]}>
        <planeGeometry args={[14, 14]} />
        <MeshReflectorMaterial
          blur={[300, 60]}
          resolution={1024}
          mixBlur={1}
          mixStrength={35}
          roughness={0.9}
          depthScale={1}
          minDepthThreshold={0.85}
          color="#efe6da"
          metalness={0.4}
        />
      </mesh>

      <mesh position={[0, 2.2, -5.4]}>
        <planeGeometry args={[14, 6.5]} />
        <meshStandardMaterial color={secondary} />
      </mesh>

      {[-5, 5].map((x) => (
        <group key={x}>
          {[-3, 1.5].map((z) => (
            <mesh key={z} position={[x, 1.6, z]} castShadow>
              <cylinderGeometry args={[0.22, 0.26, 5.2, 24]} />
              <meshStandardMaterial color="#f1ead9" roughness={0.5} />
            </mesh>
          ))}
        </group>
      ))}

      <MandapArch primary={primary} secondary={secondary} />
      <RoundedBox args={[5.4, 0.3, 3]} radius={0.05} position={[0, -0.85, -3]} receiveShadow castShadow>
        <meshStandardMaterial color="#ffffff" />
      </RoundedBox>

      {[-3.4, 0, 3.4].map((x) => (
        <RoundTable key={x} position={[x, -0.6, 1.8]} accent={primary} />
      ))}
      {[-1.8, 1.8].map((x) => (
        <RoundTable key={`b${x}`} position={[x, -0.6, 3.6]} accent={secondary} />
      ))}

      <SpinningChandelier primary={primary} />
      <Sparkles count={80} scale={[10, 3, 8]} position={[0, 2, 0]} size={1.6} speed={0.25} color="#E8D48A" opacity={0.6} />

      <Text position={[0, 4.7, -5.3]} fontSize={0.42} color="#ffffff" anchorX="center" anchorY="middle">
        {"Banquet Hall Preview"}
      </Text>
    </group>
  );
}

/* ---------------------------------------------------------------------
   Rangoli Lawns — open-air garden lawn at golden hour
--------------------------------------------------------------------- */
function StringLights({ color }) {
  const positions = [];
  for (let i = -6; i <= 6; i += 0.5) {
    positions.push([i, 4.4 + Math.sin(i * 0.6) * 0.35, -1]);
  }
  return (
    <Instances limit={positions.length}>
      <sphereGeometry args={[0.05, 8, 8]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.4} />
      {positions.map((p, i) => (
        <Instance key={i} position={p} />
      ))}
    </Instances>
  );
}

function RangoliLawnScene({ primary, secondary }) {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]} receiveShadow>
        <planeGeometry args={[16, 16]} />
        <meshStandardMaterial color="#4c7a4e" roughness={1} />
      </mesh>

      {/* pathway */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.97, 2.5]}>
        <planeGeometry args={[1.6, 6]} />
        <meshStandardMaterial color="#e9dfc8" roughness={0.9} />
      </mesh>

      <MandapArch primary={primary} secondary={secondary} height={4.6} width={5} />
      <RoundedBox args={[5.8, 0.3, 3.4]} radius={0.05} position={[0, -0.85, -3]} receiveShadow castShadow>
        <meshStandardMaterial color="#fffaf0" />
      </RoundedBox>

      {[-3.6, 0, 3.6].map((x) => (
        <RoundTable key={x} position={[x, -0.6, 2]} accent={primary} />
      ))}
      {[-1.8, 1.8].map((x) => (
        <RoundTable key={`b${x}`} position={[x, -0.6, 4]} accent={secondary} />
      ))}

      {/* string light poles */}
      {[-6.2, 6.2].map((x) => (
        <mesh key={x} position={[x, 1.2, -1]}>
          <cylinderGeometry args={[0.05, 0.05, 4.4, 8]} />
          <meshStandardMaterial color="#5b4636" />
        </mesh>
      ))}
      <StringLights color={secondary} />

      <Sparkles count={100} scale={[14, 4, 10]} position={[0, 1.5, 0]} size={1.8} speed={0.2} color="#F5E7B2" opacity={0.55} />

      <Text position={[0, 5.1, -5]} fontSize={0.42} color="#ffffff" anchorX="center" anchorY="middle">
        {"Garden Lawn Preview"}
      </Text>
    </group>
  );
}

/* ---------------------------------------------------------------------
   Beach Resort — sunset beachfront mandap with palms and cabanas
--------------------------------------------------------------------- */
function PalmTree({ position }) {
  return (
    <group position={position}>
      <mesh position={[0, 1.4, 0]} castShadow>
        <cylinderGeometry args={[0.09, 0.13, 2.8, 8]} />
        <meshStandardMaterial color="#8a6a4a" roughness={0.9} />
      </mesh>
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh key={i} position={[0, 2.8, 0]} rotation={[0.5, (i / 5) * Math.PI * 2, 0]}>
          <coneGeometry args={[0.16, 1.6, 4]} />
          <meshStandardMaterial color="#2f6b3a" roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
}

function BeachResortScene({ primary, secondary }) {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, -3]}>
        <planeGeometry args={[16, 5]} />
        <meshStandardMaterial color="#e9dcae" roughness={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.02, 4]}>
        <planeGeometry args={[18, 10]} />
        <MeshReflectorMaterial
          blur={[200, 60]}
          resolution={512}
          mixBlur={1}
          mixStrength={20}
          roughness={0.6}
          color="#1c5a7a"
          metalness={0.3}
        />
      </mesh>

      <MandapArch primary={primary} secondary={secondary} height={4.2} width={4.6} />
      <RoundedBox args={[5.4, 0.3, 3]} radius={0.05} position={[0, -0.85, -3]} receiveShadow castShadow>
        <meshStandardMaterial color="#fdf6ea" />
      </RoundedBox>

      {[-3.4, 0, 3.4].map((x) => (
        <RoundTable key={x} position={[x, -0.6, 1.6]} accent={primary} />
      ))}

      {[-7, -6, 6.5, 7.4].map((x, i) => (
        <PalmTree key={i} position={[x, -1, i < 2 ? -4 : -2.5]} />
      ))}

      <Sparkles count={70} scale={[14, 3, 6]} position={[0, 1.5, 1]} size={1.6} speed={0.2} color="#FFD9A0" opacity={0.5} />

      <Text position={[0, 4.7, -5.3]} fontSize={0.42} color="#ffffff" anchorX="center" anchorY="middle">
        {"Beachfront Mandap"}
      </Text>
    </group>
  );
}

/* ---------------------------------------------------------------------
   Corporate Hall — modern conference / launch stage
--------------------------------------------------------------------- */
function CorporateHallScene({ primary, secondary }) {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]}>
        <planeGeometry args={[14, 14]} />
        <MeshReflectorMaterial
          blur={[250, 60]}
          resolution={1024}
          mixBlur={1}
          mixStrength={25}
          roughness={0.4}
          color="#dfe3ea"
          metalness={0.6}
        />
      </mesh>

      {/* backdrop / LED wall */}
      <RoundedBox args={[9, 4.2, 0.15]} radius={0.05} position={[0, 1.6, -4.6]} castShadow>
        <meshStandardMaterial color={secondary} metalness={0.3} roughness={0.4} emissive={primary} emissiveIntensity={0.15} />
      </RoundedBox>
      <RoundedBox args={[8.6, 3.8, 0.05]} radius={0.02} position={[0, 1.6, -4.5]}>
        <meshStandardMaterial color={primary} emissive={primary} emissiveIntensity={0.4} metalness={0.2} roughness={0.3} />
      </RoundedBox>

      {/* stage */}
      <RoundedBox args={[6.5, 0.3, 3]} radius={0.05} position={[0, -0.85, -2.6]} receiveShadow castShadow>
        <meshStandardMaterial color="#f2f2f2" />
      </RoundedBox>

      {/* podium */}
      <RoundedBox args={[0.7, 1.1, 0.5]} radius={0.05} position={[0, -0.15, -2.2]} castShadow>
        <meshStandardMaterial color={secondary} metalness={0.4} roughness={0.3} />
      </RoundedBox>

      {/* rows of seating */}
      {[1.4, 2.4, 3.4].map((z) => (
        <group key={z}>
          {[-3, -1.5, 0, 1.5, 3].map((x) => (
            <mesh key={x} position={[x, -0.7, z]} castShadow>
              <boxGeometry args={[0.6, 0.5, 0.55]} />
              <meshStandardMaterial color={primary} roughness={0.6} />
            </mesh>
          ))}
        </group>
      ))}

      {/* truss lighting bar */}
      <mesh position={[0, 4.3, -1]}>
        <boxGeometry args={[9, 0.12, 0.12]} />
        <meshStandardMaterial color="#333" metalness={0.7} roughness={0.3} />
      </mesh>
      <Sparkles count={40} scale={[9, 1, 6]} position={[0, 4.2, -1]} size={1.2} speed={0.15} color={primary} opacity={0.6} />

      <Text position={[0, 3.2, -4.35]} fontSize={0.38} color="#ffffff" anchorX="center" anchorY="middle">
        {"Live on Stage"}
      </Text>
    </group>
  );
}

/* ---------------------------------------------------------------------
   Community Hall — simple, bright hall for engagements & receptions
--------------------------------------------------------------------- */
function CommunityHallScene({ primary, secondary }) {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]}>
        <planeGeometry args={[13, 13]} />
        <meshStandardMaterial color="#f4efe4" roughness={0.9} />
      </mesh>

      <mesh position={[0, 2, -5]}>
        <planeGeometry args={[13, 6]} />
        <meshStandardMaterial color={secondary} />
      </mesh>

      <RoundedBox args={[5, 0.25, 2.6]} radius={0.05} position={[0, -0.85, -2.8]} receiveShadow castShadow>
        <meshStandardMaterial color="#ffffff" />
      </RoundedBox>
      {/* simple backdrop arch instead of full mandap */}
      <mesh position={[0, 1.6, -4.6]}>
        <torusGeometry args={[1.6, 0.12, 12, 48, Math.PI]} />
        <meshStandardMaterial color={primary} metalness={0.4} roughness={0.4} />
      </mesh>

      {[-3, 0, 3].map((x) => (
        <RoundTable key={x} position={[x, -0.6, 1.6]} accent={primary} />
      ))}
      {[-1.5, 1.5].map((x) => (
        <RoundTable key={`b${x}`} position={[x, -0.6, 3.3]} accent={secondary} />
      ))}

      {/* simple ceiling fans/lights instead of chandelier */}
      {[-3, 3].map((x) => (
        <mesh key={x} position={[x, 3.9, 0]}>
          <sphereGeometry args={[0.18, 12, 12]} />
          <meshStandardMaterial color="#fff6dd" emissive="#fff0c0" emissiveIntensity={0.7} />
        </mesh>
      ))}

      <Sparkles count={40} scale={[9, 2, 7]} position={[0, 1.5, 0]} size={1.2} speed={0.2} color="#F5E7B2" opacity={0.4} />

      <Text position={[0, 4.4, -5.3]} fontSize={0.38} color="#ffffff" anchorX="center" anchorY="middle">
        {"Community Celebration Hall"}
      </Text>
    </group>
  );
}

/* ---------------------------------------------------------------------
   Public component
--------------------------------------------------------------------- */
export { GrandMehfilHall };

const SCENES = {
  grand_mehfil: { Comp: GrandMehfilHall, env: "apartment", ambient: 0.55, sun: 1 },
  rangoli_lawn: { Comp: RangoliLawnScene, env: "sunset", ambient: 0.75, sun: 1.3 },
  beach_resort: { Comp: BeachResortScene, env: "sunset", ambient: 0.85, sun: 1.4 },
  corporate_hall: { Comp: CorporateHallScene, env: "city", ambient: 0.6, sun: 1.1 },
  community_hall: { Comp: CommunityHallScene, env: "apartment", ambient: 0.7, sun: 1 },
};

export default function VenueScene3D({ variant = "grand_mehfil", primaryColor = "#C9A227", secondaryColor = "#4A1942" }) {
  const scene = SCENES[variant] || SCENES.grand_mehfil;
  const SceneComp = scene.Comp;

  return (
    <div className="w-full h-full rounded-xl overflow-hidden bg-gradient-to-b from-[#2E0F2B] to-[#4A1942] relative">
      <Canvas shadows camera={{ position: [6.5, 3.6, 7.5], fov: 45 }}>
        <Suspense fallback={null}>
          <ambientLight intensity={scene.ambient} />
          <directionalLight position={[5, 8, 5]} intensity={scene.sun} castShadow />
          <Float speed={0.6} floatIntensity={0.15} rotationIntensity={0}>
            <SceneComp primary={primaryColor} secondary={secondaryColor} />
          </Float>
          <Environment preset={scene.env} />
          <OrbitControls
            autoRotate
            autoRotateSpeed={0.6}
            enablePan={false}
            minDistance={4.5}
            maxDistance={13}
            maxPolarAngle={Math.PI / 2.1}
          />
        </Suspense>
      </Canvas>
      <div className="absolute bottom-3 right-3 glass text-white text-[11px] px-3 py-1.5 rounded-full pointer-events-none">
        Drag to rotate · Scroll to zoom
      </div>
    </div>
  );
}
