import { Component, Suspense, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, Html, OrbitControls, useGLTF } from "@react-three/drei";
import { Box3, Vector3 } from "three";

const MODEL_URL = "/models/venue-stage.glb";
const VENUE_FLOOR_Y = -1;
const VENUE_REFERENCE_WIDTH = 10;

class ModelErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

function ModelLoadError() {
  return (
    <Html center>
      <p className="rounded-full bg-black/50 px-4 py-2 text-center text-sm text-white backdrop-blur-sm">
        3D preview is temporarily unavailable.
      </p>
    </Html>
  );
}

function HallMaterial({ color, metalness = 0, roughness = 0.7, emissive, emissiveIntensity = 0 }) {
  return (
    <meshStandardMaterial
      color={color}
      metalness={metalness}
      roughness={roughness}
      emissive={emissive}
      emissiveIntensity={emissiveIntensity}
    />
  );
}

function FlowerCluster({ color, position, scale = 1 }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.035, 0.05, 0.45, 8]} />
        <HallMaterial color="#526b45" roughness={0.95} />
      </mesh>
      {[0, 1, 2, 3, 4].map((index) => {
        const angle = (index / 5) * Math.PI * 2;
        return (
          <mesh key={index} position={[Math.cos(angle) * 0.14, 0.42, Math.sin(angle) * 0.14]}>
            <sphereGeometry args={[0.13, 12, 8]} />
            <HallMaterial color={color} roughness={0.58} />
          </mesh>
        );
      })}
      <mesh position={[0, 0.42, 0]}>
        <sphereGeometry args={[0.075, 12, 8]} />
        <HallMaterial color="#f4d36f" roughness={0.5} />
      </mesh>
    </group>
  );
}

function Chair({ position, rotation, color, woodColor }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.42, 0]} castShadow>
        <boxGeometry args={[0.42, 0.1, 0.42]} />
        <HallMaterial color={color} roughness={0.72} />
      </mesh>
      <mesh position={[0, 0.82, -0.15]} castShadow>
        <boxGeometry args={[0.42, 0.72, 0.09]} />
        <HallMaterial color={color} roughness={0.72} />
      </mesh>
      {[-1, 1].flatMap((x) => [-1, 1].map((z) => (
        <mesh key={`${x}-${z}`} position={[x * 0.15, 0.2, z * 0.15]}>
          <cylinderGeometry args={[0.025, 0.025, 0.42, 8]} />
          <HallMaterial color={woodColor} metalness={0.2} roughness={0.7} />
        </mesh>
      )))}
    </group>
  );
}

function Table({ position, linenColor, accentColor, woodColor }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.72, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.82, 0.82, 0.12, 32]} />
        <HallMaterial color={linenColor} roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.35, 0]}>
        <cylinderGeometry args={[0.09, 0.16, 0.7, 16]} />
        <HallMaterial color={woodColor} metalness={0.42} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.81, 0]}>
        <cylinderGeometry args={[0.24, 0.24, 0.035, 24]} />
        <HallMaterial color={accentColor} roughness={0.44} />
      </mesh>
    </group>
  );
}

function TableSetting({ position, palette, showChairs }) {
  const chairPositions = [
    [[0, -1.05, 0], 0],
    [[0, 1.05, 0], Math.PI],
    [[-1.05, 0, 0], Math.PI / 2],
    [[1.05, 0, 0], -Math.PI / 2],
  ];

  return (
    <group position={position}>
      <Table linenColor={palette.linen} accentColor={palette.accent} woodColor={palette.wood} />
      {showChairs && chairPositions.map(([chairPosition, rotation], index) => (
        <Chair
          key={index}
          position={chairPosition}
          rotation={rotation}
          color={palette.chair}
          woodColor={palette.wood}
        />
      ))}
    </group>
  );
}

function CeilingLights({ color }) {
  const positions = [[-3.6, 3.85, -0.8], [0, 3.85, -0.8], [3.6, 3.85, -0.8], [0, 3.85, 2.6]];
  return (
    <group>
      {positions.map((position, index) => (
        <group key={index} position={position}>
          <mesh position={[0, 0.18, 0]}>
            <cylinderGeometry args={[0.13, 0.2, 0.12, 20]} />
            <HallMaterial color="#ece5d8" metalness={0.35} roughness={0.28} />
          </mesh>
          <mesh position={[0, 0.08, 0]}>
            <sphereGeometry args={[0.1, 16, 10]} />
            <HallMaterial color="#fff2c5" emissive={color} emissiveIntensity={2.2} roughness={0.25} />
          </mesh>
          <pointLight color={color} intensity={0.45} distance={3.5} />
        </group>
      ))}
    </group>
  );
}

function StageDecorations({ palette, showBackdrop, showFlowers }) {
  return (
    <group>
      {showBackdrop && (
        <group position={[0, 1.55, -3.9]}>
          <mesh castShadow>
            <boxGeometry args={[7.4, 3.2, 0.12]} />
            <HallMaterial color={palette.backdrop} roughness={0.82} />
          </mesh>
          <mesh position={[0, 1.55, 0.12]}>
            <boxGeometry args={[6.6, 0.14, 0.16]} />
            <HallMaterial color={palette.accent} metalness={0.52} roughness={0.34} />
          </mesh>
          {[-3.2, 3.2].map((x) => (
            <mesh key={x} position={[x, 0, 0.12]}>
              <boxGeometry args={[0.18, 3.65, 0.18]} />
              <HallMaterial color={palette.primary} metalness={0.35} roughness={0.4} />
            </mesh>
          ))}
        </group>
      )}
      {showFlowers && (
        <group>
          <FlowerCluster color={palette.flower} position={[-3.15, -0.92, -2.35]} scale={1.18} />
          <FlowerCluster color={palette.flower} position={[3.15, -0.92, -2.35]} scale={1.18} />
          <FlowerCluster color={palette.secondaryFlower} position={[0, -0.92, -3.02]} scale={0.82} />
        </group>
      )}
    </group>
  );
}

function BanquetHall({ palette, options }) {
  return (
    <group>
      <mesh position={[0, -1.13, 0]} receiveShadow>
        <boxGeometry args={[12.6, 0.22, 10]} />
        <HallMaterial color={palette.floor} roughness={0.62} metalness={0.08} />
      </mesh>
      <mesh position={[0, 4.25, 0]}>
        <boxGeometry args={[12.6, 0.18, 10]} />
        <HallMaterial color={palette.ceiling} roughness={0.88} />
      </mesh>
      <mesh position={[-6.15, 1.55, 0]}>
        <boxGeometry args={[0.18, 5.4, 10]} />
        <HallMaterial color={palette.wall} roughness={0.88} />
      </mesh>
      <mesh position={[6.15, 1.55, 0]}>
        <boxGeometry args={[0.18, 5.4, 10]} />
        <HallMaterial color={palette.wall} roughness={0.88} />
      </mesh>
      <mesh position={[0, 1.55, 4.85]}>
        <boxGeometry args={[12.6, 5.4, 0.18]} />
        <HallMaterial color={palette.wall} roughness={0.88} />
      </mesh>

      <mesh position={[0, -0.88, -2.8]} castShadow receiveShadow>
        <boxGeometry args={[8.2, 0.32, 2.55]} />
        <HallMaterial color={palette.stage} roughness={0.42} metalness={0.16} />
      </mesh>
      <mesh position={[0, -0.66, -2.8]}>
        <boxGeometry args={[7.55, 0.08, 2.1]} />
        <HallMaterial color={palette.stageTrim} metalness={0.48} roughness={0.3} />
      </mesh>

      <StageDecorations palette={palette} showBackdrop={options.backdrop} showFlowers={options.flowers} />
      {options.lighting && <CeilingLights color={palette.light} />}
    </group>
  );
}

function getPalette(primaryColor, secondaryColor, themeName) {
  const lowerName = themeName.toLowerCase();
  const isMinimal = lowerName.includes("minimal") || lowerName.includes("simple");
  const isPastel = lowerName.includes("pastel") || lowerName.includes("blush");
  const isBlue = lowerName.includes("blue") || lowerName.includes("royal") || lowerName.includes("navy");

  return {
    primary: primaryColor,
    secondary: secondaryColor,
    accent: isBlue ? "#d8e6f4" : isPastel ? "#e8a8b6" : isMinimal ? "#7f8b8c" : "#d8b15a",
    backdrop: isMinimal ? "#dfe3df" : isBlue ? "#1f3551" : isPastel ? "#6d344b" : secondaryColor,
    floor: isBlue ? "#59616b" : isMinimal ? "#b9bdb8" : "#5b4b45",
    wall: isBlue ? "#202b38" : isMinimal ? "#d3d6d1" : "#2d252b",
    ceiling: isBlue ? "#18212c" : isMinimal ? "#e6e8e2" : "#231d24",
    stage: isMinimal ? "#eceee9" : "#f4efe5",
    stageTrim: isBlue ? "#6f9cc8" : isPastel ? "#d9889f" : primaryColor,
    linen: isMinimal ? "#f4f5f0" : "#f7f1e7",
    chair: isMinimal ? "#e6e9e3" : isBlue ? "#7894b4" : secondaryColor,
    wood: isMinimal ? "#7c817b" : "#a17b4d",
    flower: isPastel ? "#f2a7b9" : isBlue ? "#b9d5f3" : primaryColor,
    secondaryFlower: isPastel ? "#f5d27c" : "#f3e7c8",
    light: isBlue ? "#a9caff" : isPastel ? "#ffd4df" : "#ffe5a5",
  };
}

function DecorationModel({ primaryColor, secondaryColor, themeName, options }) {
  const { scene } = useGLTF(MODEL_URL);
  const modelTransform = useMemo(() => {
    const model = scene.clone();
    const bounds = new Box3().setFromObject(model);
    const size = bounds.getSize(new Vector3());
    const center = bounds.getCenter(new Vector3());
    const scale = VENUE_REFERENCE_WIDTH / Math.max(size.x, size.z);

    return {
      model,
      scale,
      position: [-center.x * scale, VENUE_FLOOR_Y - bounds.min.y * scale, -center.z * scale],
    };
  }, [scene]);
  const palette = useMemo(() => getPalette(primaryColor, secondaryColor, themeName), [primaryColor, secondaryColor, themeName]);

  return (
    <group>
      <primitive object={modelTransform.model} position={modelTransform.position} scale={modelTransform.scale} />
      <BanquetHall palette={palette} options={options} />
    </group>
  );
}

function LoadingState() {
  return <div className="venue-3d-loading h-full w-full" />;
}

export default function VenueDecorationModel({
  primaryColor = "#C9A227",
  secondaryColor = "#4A1942",
  themeName = "",
  options = { flowers: true, chairs: true, tables: true, lighting: true, backdrop: true },
}) {
  return (
    <div className="venue-3d-viewer relative h-full w-full overflow-hidden rounded-xl">
      <Canvas shadows camera={{ position: [10, 5.8, 10], fov: 42 }} dpr={[1, 2]} fallback={<LoadingState />}>
        <color attach="background" args={["#12161b"]} />
        <ambientLight intensity={0.72} />
        <directionalLight position={[5, 8, 6]} intensity={1.7} castShadow />
        <directionalLight position={[-5, 3, -4]} intensity={0.45} color="#b9c9df" />
        <Suspense fallback={null}>
          <ModelErrorBoundary fallback={<ModelLoadError />}>
            <DecorationModel
              primaryColor={primaryColor}
              secondaryColor={secondaryColor}
              themeName={themeName}
              options={options}
            />
          </ModelErrorBoundary>
          <Environment preset="apartment" />
          <OrbitControls
            autoRotate
            autoRotateSpeed={0.42}
            enableDamping
            dampingFactor={0.06}
            enablePan
            minDistance={6}
            maxDistance={18}
            minPolarAngle={Math.PI / 4.2}
            maxPolarAngle={Math.PI / 1.85}
            target={[0, 0.8, -0.8]}
          />
        </Suspense>
      </Canvas>
      <div className="glass pointer-events-none absolute bottom-3 right-3 rounded-full px-3 py-1.5 text-[11px] text-white">
        Drag to rotate · Scroll to zoom · Shift-drag to pan
      </div>
    </div>
  );
}
