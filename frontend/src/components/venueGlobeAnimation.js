/**
 * venueGlobeAnimation.js
 * ------------------------------------------------------------------
 * Self-contained, plug-and-play scroll-driven "globe → venue" zoom
 * sequence built with Three.js + GSAP ScrollTrigger.
 *
 * It does NOT touch anything outside the container element you pass
 * in. It creates its own <canvas>, its own render loop, and its own
 * ScrollTrigger instance scoped to that one section.
 *
 * USAGE
 * -----
 *   import { initVenueGlobeAnimation } from './venueGlobeAnimation.js';
 *
 *   const instance = initVenueGlobeAnimation('.venue-animation-container', {
 *     venues: [
 *       { name: 'Grand Horizon Hall', lat: 40.7128, lon: -74.0060, target: true },
 *       { name: 'Skyline Pavilion',   lat: 51.5074, lon: -0.1278 },
 *       { name: 'Aurora Terrace',     lat: 35.6762, lon: 139.6503 },
 *     ],
 *     onExplore: () => console.log('Explore Venue clicked'),
 *   });
 *
 *   // later, e.g. on route change / unmount:
 *   instance.destroy();
 *
 * DEPENDENCIES (peer, not bundled)
 * ---------------------------------
 *   npm install three gsap
 *
 * This project's package.json already includes `three`. `gsap` is not
 * yet a dependency of the venueconnect frontend — run:
 *   npm install gsap
 * before importing this file.
 * ------------------------------------------------------------------
 */

import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// ---------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------

const DEFAULT_VENUES = [
  { name: 'Grand Horizon Hall', lat: 40.7128, lon: -74.006, target: true },
  { name: 'Skyline Pavilion', lat: 51.5074, lon: -0.1278 },
  { name: 'Aurora Terrace', lat: 35.6762, lon: 139.6503 },
  { name: 'Marina Point', lat: -33.8688, lon: 151.2093 },
  { name: 'Copper Atrium', lat: 25.2048, lon: 55.2708 },
];

const GLOBE_RADIUS = 5;

// ---------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------

/** Convert lat/lon (degrees) to a Vector3 on a sphere of given radius. */
function latLonToVector3(lat, lon, radius) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  const x = -radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);
  return new THREE.Vector3(x, y, z);
}

/** Procedural starfield background (no external texture required). */
function createStarfield(count = 1200, spread = 400) {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const r = spread * (0.6 + Math.random() * 0.4);
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.6,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.7,
  });
  return new THREE.Points(geometry, material);
}

/**
 * Procedural "earth-like" texture painted on a <canvas> so the globe
 * doesn't depend on any external image asset. Swap for a real texture
 * via THREE.TextureLoader if you have one (see README).
 */
function createGlobeTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // Ocean base
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, '#0b3d5c');
  grad.addColorStop(1, '#082a40');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Rough procedural "landmasses" using blobby noise circles
  ctx.fillStyle = '#12523f';
  const blobCount = 140;
  let seed = 42;
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  for (let i = 0; i < blobCount; i++) {
    const x = rand() * canvas.width;
    const y = rand() * canvas.height;
    const r = 12 + rand() * 46;
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * (0.5 + rand() * 0.5), rand() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }

  // Subtle lat/long grid
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= canvas.width; x += canvas.width / 12) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y <= canvas.height; y += canvas.height / 6) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/** Simple glowing marker (pin) placed on the globe surface. */
function createMarker(venue) {
  const group = new THREE.Group();
  group.name = `marker-${venue.name}`;

  const coreGeo = new THREE.SphereGeometry(0.06, 12, 12);
  const coreMat = new THREE.MeshBasicMaterial({ color: 0xffb648 });
  const core = new THREE.Mesh(coreGeo, coreMat);

  const glowGeo = new THREE.SphereGeometry(0.14, 12, 12);
  const glowMat = new THREE.MeshBasicMaterial({
    color: 0xffb648,
    transparent: true,
    opacity: 0.35,
  });
  const glow = new THREE.Mesh(glowGeo, glowMat);

  group.add(core, glow);
  group.scale.setScalar(0.001); // start hidden; scaled in during Phase 1
  group.userData.venue = venue;
  return group;
}

/**
 * Procedural stand-in "venue" model: an illuminated event space made
 * from primitives (no external .glb required). Replace `buildVenueGroup`
 * with a GLTFLoader call if/when a real model is available — see README.
 */
function buildVenueGroup() {
  const group = new THREE.Group();

  const groundGeo = new THREE.CircleGeometry(6, 48);
  const groundMat = new THREE.MeshStandardMaterial({ color: 0x1a1a22, roughness: 0.9 });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  group.add(ground);

  const buildingGeo = new THREE.BoxGeometry(3.4, 2.2, 3.4);
  const buildingMat = new THREE.MeshStandardMaterial({
    color: 0x2b2f3a,
    roughness: 0.6,
    metalness: 0.2,
  });
  const building = new THREE.Mesh(buildingGeo, buildingMat);
  building.position.y = 1.1;
  group.add(building);

  // Illuminated "windows"
  const windowMat = new THREE.MeshStandardMaterial({
    color: 0xffdca8,
    emissive: 0xffb648,
    emissiveIntensity: 1.4,
  });
  const rows = 3;
  const cols = 6;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const win = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 0.36), windowMat);
      win.position.set(-1.55 + c * (3.1 / (cols - 1)), 0.45 + r * 0.55, 1.71);
      group.add(win);
    }
  }

  // Outdoor event space canopy
  const canopyGeo = new THREE.ConeGeometry(2.2, 0.9, 6, 1, true);
  const canopyMat = new THREE.MeshStandardMaterial({
    color: 0xd6b98c,
    roughness: 0.8,
    side: THREE.DoubleSide,
  });
  const canopy = new THREE.Mesh(canopyGeo, canopyMat);
  canopy.position.set(-3.6, 1.6, 1.2);
  group.add(canopy);

  // String lights (small emissive points around the canopy)
  const lightsGeo = new THREE.SphereGeometry(0.03, 6, 6);
  const lightsMat = new THREE.MeshBasicMaterial({ color: 0xffe6b3 });
  for (let i = 0; i < 14; i++) {
    const bulb = new THREE.Mesh(lightsGeo, lightsMat);
    const angle = (i / 14) * Math.PI * 2;
    bulb.position.set(-3.6 + Math.cos(angle) * 2.1, 1.15 + Math.sin(angle * 2) * 0.15, 1.2 + Math.sin(angle) * 2.1);
    group.add(bulb);
  }

  group.visible = false;
  group.scale.setScalar(0.001);
  return group;
}

// ---------------------------------------------------------------
// Main export
// ---------------------------------------------------------------

/**
 * Mount and start the animation inside `containerOrSelector`.
 * Returns { destroy } for cleanup.
 */
export function initVenueGlobeAnimation(containerOrSelector, options = {}) {
  const container =
    typeof containerOrSelector === 'string'
      ? document.querySelector(containerOrSelector)
      : containerOrSelector;

  if (!container) {
    console.warn('[venueGlobeAnimation] Target container not found:', containerOrSelector);
    return { destroy: () => {} };
  }

  const venues = options.venues && options.venues.length ? options.venues : DEFAULT_VENUES;
  const targetVenue = venues.find((v) => v.target) || venues[0];
  const scrollDistance = options.scrollDistance || '+=300%';
  const onExplore = typeof options.onExplore === 'function' ? options.onExplore : null;

  // Make sure the container can host an absolutely-positioned canvas/overlay.
  if (getComputedStyle(container).position === 'static') {
    container.style.position = 'relative';
  }
  container.classList.add('vga-container');

  // --- DOM scaffolding (canvas host + overlay) -------------------
  const canvasHost = document.createElement('div');
  canvasHost.className = 'vga-canvas-host';
  container.appendChild(canvasHost);

  const overlay = document.createElement('div');
  overlay.className = 'vga-overlay';
  overlay.innerHTML = `
    <div class="vga-overlay-inner">
      <p class="vga-eyebrow">${escapeHtml(targetVenue.name)}</p>
      <h2 class="vga-headline">${escapeHtml(options.headline || 'Step inside the venue')}</h2>
      <button type="button" class="vga-cta">${escapeHtml(options.ctaLabel || 'Explore Venue')}</button>
    </div>
  `;
  container.appendChild(overlay);

  const ctaEl = overlay.querySelector('.vga-cta');
  if (onExplore) ctaEl.addEventListener('click', onExplore);

  // --- Three.js core ----------------------------------------------
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x05070d);
  scene.fog = new THREE.FogExp2(0x05070d, 0.012);

  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
  camera.position.set(0, 0, 16);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  canvasHost.appendChild(renderer.domElement);

  // Lights
  const ambient = new THREE.AmbientLight(0xffffff, 0.5);
  const key = new THREE.DirectionalLight(0xffffff, 1.1);
  key.position.set(5, 6, 8);
  const rim = new THREE.PointLight(0xffb648, 1.2, 20);
  rim.position.set(-4, 2, 4);
  scene.add(ambient, key, rim);

  // Starfield
  const stars = createStarfield();
  scene.add(stars);

  // Globe
  const globeGroup = new THREE.Group();
  const globeGeo = new THREE.SphereGeometry(GLOBE_RADIUS, 64, 64);
  const globeMat = new THREE.MeshStandardMaterial({
    map: createGlobeTexture(),
    roughness: 0.85,
    metalness: 0.05,
  });
  const globeMesh = new THREE.Mesh(globeGeo, globeMat);
  globeGroup.add(globeMesh);

  // Atmosphere glow (backside shell)
  const atmosphereGeo = new THREE.SphereGeometry(GLOBE_RADIUS * 1.04, 64, 64);
  const atmosphereMat = new THREE.MeshBasicMaterial({
    color: 0x4fb3ff,
    transparent: true,
    opacity: 0.15,
    side: THREE.BackSide,
  });
  const atmosphere = new THREE.Mesh(atmosphereGeo, atmosphereMat);
  globeGroup.add(atmosphere);

  scene.add(globeGroup);

  // Markers
  const markerGroup = new THREE.Group();
  const markerMeshes = venues.map((venue) => {
    const marker = createMarker(venue);
    const pos = latLonToVector3(venue.lat, venue.lon, GLOBE_RADIUS * 1.01);
    marker.position.copy(pos);
    marker.lookAt(pos.clone().multiplyScalar(2));
    markerGroup.add(marker);
    return marker;
  });
  globeGroup.add(markerGroup);

  const targetMarker =
    markerMeshes.find((m) => m.userData.venue === targetVenue) || markerMeshes[0];
  const targetSurfacePoint = latLonToVector3(targetVenue.lat, targetVenue.lon, GLOBE_RADIUS);
  const targetSurfaceNormal = targetSurfacePoint.clone().normalize();

  // Venue reveal group, positioned "beyond" the zoom point
  const venueGroup = buildVenueGroup();
  venueGroup.position.copy(targetSurfaceNormal.clone().multiplyScalar(GLOBE_RADIUS + 4));
  // Orient venue ground to face the approaching camera
  venueGroup.lookAt(targetSurfaceNormal.clone().multiplyScalar(GLOBE_RADIUS + 20));
  scene.add(venueGroup);

  const venueLookTarget = venueGroup.position.clone().add(new THREE.Vector3(0, 1, 0));

  // --- Sizing (container-bound, not window-bound) -----------------
  function sizeToContainer() {
    const rect = container.getBoundingClientRect();
    const width = Math.max(rect.width, 1);
    // While pinned, GSAP sets an explicit inline height on the container;
    // fall back to viewport height if the container is momentarily 0.
    const height = Math.max(rect.height, 1);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }
  sizeToContainer();

  const resizeObserver = new ResizeObserver(() => {
    sizeToContainer();
  });
  resizeObserver.observe(container);

  const onWindowResize = debounce(() => {
    sizeToContainer();
    ScrollTrigger.refresh();
  }, 150);
  window.addEventListener('resize', onWindowResize);

  // --- Render loop --------------------------------------------------
  let rafId = null;
  const clock = new THREE.Clock();
  function renderLoop() {
    rafId = requestAnimationFrame(renderLoop);
    const dt = clock.getDelta();
    // gentle idle rotation only in Phase 1 (state flag set by the timeline)
    if (state.phase === 1) {
      globeGroup.rotation.y += dt * 0.05;
    }
    stars.rotation.y += dt * 0.002;
    renderer.render(scene, camera);
  }
  renderLoop();

  const state = { phase: 1 };

  // --- GSAP ScrollTrigger timeline -----------------------------------
  // Proxy objects tweened by GSAP; applied to the Three.js camera/materials
  // on every timeline update so we stay perfectly in sync with scrub.
  const camState = {
    x: camera.position.x,
    y: camera.position.y,
    z: camera.position.z,
    lookX: 0,
    lookY: 0,
    lookZ: 0,
  };
  const lookVec = new THREE.Vector3();

  const zoomStart = targetSurfaceNormal.clone().multiplyScalar(GLOBE_RADIUS * 2.6);
  const zoomClose = targetSurfaceNormal.clone().multiplyScalar(GLOBE_RADIUS + 6.5);
  const venueCam = venueGroup.position
    .clone()
    .add(new THREE.Vector3(4, 2.4, 4));

  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: container,
      start: 'top top',
      end: scrollDistance,
      pin: true,
      scrub: 1,
      anticipatePin: 1,
      onUpdate: (self) => {
        if (self.progress < 0.28) state.phase = 1;
        else if (self.progress < 0.6) state.phase = 2;
        else if (self.progress < 0.92) state.phase = 3;
        else state.phase = 4;
      },
    },
  });

  // Phase 1 (0 -> 0.25): markers pop in while globe idles/rotates
  tl.addLabel('phase1-start', 0);
  markerMeshes.forEach((marker, i) => {
    tl.to(
      marker.scale,
      { x: 1, y: 1, z: 1, duration: 0.06, ease: 'back.out(2)' },
      0.02 + i * (0.16 / markerMeshes.length)
    );
  });

  // Phase 1 -> 2 (0.25 -> 0.32): lock rotation onto target, pulse it
  tl.to(
    globeGroup.rotation,
    {
      y: computeLockRotationY(targetVenue.lon),
      duration: 0.1,
      ease: 'power2.inOut',
    },
    0.25
  );
  tl.to(
    targetMarker.scale,
    { x: 1.6, y: 1.6, z: 1.6, duration: 0.05, yoyo: true, repeat: 1 },
    0.3
  );

  // Phase 2 (0.3 -> 0.62): camera dives from wide globe shot toward target
  tl.to(
    camState,
    {
      x: zoomStart.x,
      y: zoomStart.y,
      z: zoomStart.z,
      lookX: targetSurfacePoint.x,
      lookY: targetSurfacePoint.y,
      lookZ: targetSurfacePoint.z,
      duration: 0.16,
    },
    0.3
  );
  tl.to(
    camState,
    {
      x: zoomClose.x,
      y: zoomClose.y,
      z: zoomClose.z,
      duration: 0.18,
    },
    0.46
  );
  tl.to(
    atmosphereMat,
    { opacity: 0, duration: 0.12 },
    0.5
  );
  tl.to(
    markerGroup.children.map((m) => m.children[1].material), // glow spheres
    { opacity: 0, duration: 0.1 },
    0.5
  );

  // Phase 2 -> 3 crossfade (0.58 -> 0.7): globe fades out, venue fades in
  tl.to(
    globeMat,
    { opacity: 0, duration: 0.12 },
    0.58
  );
  tl.set(globeMat, { transparent: true }, 0.58);
  tl.set(venueGroup, { visible: true }, 0.6);
  tl.to(
    venueGroup.scale,
    { x: 1, y: 1, z: 1, duration: 0.14, ease: 'power2.out' },
    0.6
  );

  // Phase 3 (0.6 -> 0.9): camera settles into the venue
  tl.to(
    camState,
    {
      x: venueCam.x,
      y: venueCam.y,
      z: venueCam.z,
      lookX: venueLookTarget.x,
      lookY: venueLookTarget.y,
      lookZ: venueLookTarget.z,
      duration: 0.3,
      ease: 'power2.inOut',
    },
    0.6
  );

  // Overlay text/buttons fade in (Phase 3)
  tl.fromTo(
    overlay,
    { autoAlpha: 0, y: 24 },
    { autoAlpha: 1, y: 0, duration: 0.15 },
    0.72
  );

  // Phase 4 (0.9 -> 1): brief hold before releasing the pin
  tl.to({}, { duration: 0.1 }, 0.9);

  // Apply proxy state to the real Three.js camera every tick.
  gsap.ticker.add(applyCameraState);
  function applyCameraState() {
    camera.position.set(camState.x, camState.y, camState.z);
    lookVec.set(camState.lookX, camState.lookY, camState.lookZ);
    if (lookVec.lengthSq() > 0) camera.lookAt(lookVec);
  }
  // Initialize proxy to the starting camera framing.
  camState.lookX = 0;
  camState.lookY = 0;
  camState.lookZ = 0;

  // --- Cleanup --------------------------------------------------------
  function destroy() {
    cancelAnimationFrame(rafId);
    gsap.ticker.remove(applyCameraState);
    tl.scrollTrigger && tl.scrollTrigger.kill();
    tl.kill();
    resizeObserver.disconnect();
    window.removeEventListener('resize', onWindowResize);
    if (ctaEl && onExplore) ctaEl.removeEventListener('click', onExplore);

    scene.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        mats.forEach((m) => {
          if (m.map) m.map.dispose();
          m.dispose();
        });
      }
    });
    renderer.dispose();
    canvasHost.remove();
    overlay.remove();
  }

  return { destroy, scene, camera, renderer };
}

// ---------------------------------------------------------------
// Small utilities
// ---------------------------------------------------------------

function computeLockRotationY(targetLon) {
  // Rotate the globe so the target marker faces the camera (+Z).
  return -((targetLon + 180) * (Math.PI / 180)) + Math.PI / 2;
}

function debounce(fn, wait) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
