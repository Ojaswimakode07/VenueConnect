import { Suspense, useLayoutEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Float } from "@react-three/drei";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { GrandMehfilHall } from "./VenueScene3D.jsx";
import "./venue-model-scroll.css";

gsap.registerPlugin(ScrollTrigger);

const clamp01 = (value) => Math.min(1, Math.max(0, value));
const smoothstep = (t) => t * t * (3 - 2 * t);
const lerp = (a, b, t) => a + (b - a) * t;

// Drives the camera every frame from a progress ref that ScrollTrigger updates.
// 0 -> 0.6  : wide orbit, spins around the hall like a car-configurator turntable
// 0.6 -> 1  : camera dollies in and rises toward the mandap / chandelier — the "interior" reveal
function CameraRig({ progressRef }) {
  const { camera } = useThree();

  useFrame(() => {
    const progress = progressRef.current;
    const spinT = clamp01(progress / 0.65);
    const zoomT = smoothstep(clamp01((progress - 0.55) / 0.45));

    const angle = spinT * Math.PI * 1.9 - Math.PI / 4;
    const radius = lerp(11, 3.4, zoomT);
    const height = lerp(4.2, 1.8, zoomT);

    camera.position.set(Math.cos(angle) * radius, height, Math.sin(angle) * radius);

    const lookY = lerp(0.3, 1.7, zoomT);
    const lookZ = lerp(0, -3, zoomT);
    camera.lookAt(0, lookY, lookZ);
  });

  return null;
}

export default function VenueModelScroll() {
  const rootRef = useRef(null);
  const pinRef = useRef(null);
  const exteriorRef = useRef(null);
  const interiorRef = useRef(null);
  const progressRef = useRef(0);

  useLayoutEffect(() => {
    const root = rootRef.current;
    const pin = pinRef.current;
    if (!root || !pin || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;

    const trigger = ScrollTrigger.create({
      trigger: root,
      start: "top top",
      end: () => `+=${Math.round(window.innerHeight * 2.4)}`,
      pin,
      scrub: 0.6,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        progressRef.current = self.progress;
        const zoomT = smoothstep(clamp01((self.progress - 0.55) / 0.45));
        if (exteriorRef.current) exteriorRef.current.style.opacity = String(1 - zoomT);
        if (interiorRef.current) interiorRef.current.style.opacity = String(zoomT);
      },
    });

    return () => trigger.kill();
  }, []);

  return (
    <section className="vc-model-scroll" ref={rootRef} aria-label="Grand Mehfil 360 preview">
      <div className="vc-model-scroll__pin" ref={pinRef}>
        <Canvas shadows camera={{ position: [7.8, 4.2, 7.8], fov: 45 }}>
          <Suspense fallback={null}>
            <ambientLight intensity={0.55} />
            <directionalLight position={[5, 8, 5]} intensity={1} castShadow />
            <Float speed={0.4} floatIntensity={0.1} rotationIntensity={0}>
              <GrandMehfilHall primary="#C9A227" secondary="#4A1942" />
            </Float>
            <Environment preset="apartment" />
            <CameraRig progressRef={progressRef} />
          </Suspense>
        </Canvas>

        <div className="vc-model-scroll__shade" />

        <div className="vc-model-scroll__copy vc-model-scroll__copy--exterior" ref={exteriorRef}>
          <p className="vc-model-scroll__eyebrow">GRAND MEHFIL / 360&deg; PREVIEW</p>
          <h2>See the whole room.</h2>
          <span>Scroll to spin the hall and look at it from every angle before you visit.</span>
        </div>

        <div className="vc-model-scroll__copy vc-model-scroll__copy--interior" ref={interiorRef}>
          <p className="vc-model-scroll__eyebrow">GRAND MEHFIL / INSIDE THE HALL</p>
          <h2>Now step inside.</h2>
          <span>The mandap, the chandelier, the table settings — the details you'll actually stand next to.</span>
        </div>

        <div className="vc-model-scroll__footer">
          <span>DRAG TO LOOK AROUND ON MOBILE</span>
          <span>SCROLL TO TRANSFORM</span>
        </div>
      </div>
    </section>
  );
}
