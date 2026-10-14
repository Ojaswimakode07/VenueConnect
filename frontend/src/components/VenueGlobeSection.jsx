/**
 * VenueGlobeSection.jsx
 * ------------------------------------------------------------------
 * Thin React wrapper around initVenueGlobeAnimation(), for dropping
 * into the venueconnect Vite/React app. This component owns nothing
 * about your page layout — it just renders the placeholder <section>
 * and hands its DOM node to the vanilla animation module on mount.
 *
 * Drop this file anywhere in `src/components/`, then use it in place
 * of your existing empty placeholder:
 *
 *   import VenueGlobeSection from './components/VenueGlobeSection';
 *   ...
 *   <VenueGlobeSection />
 *
 * If you'd rather keep the plain <section class="venue-animation-container">
 * markup exactly as-is in an existing page/component, skip this file
 * and instead call initVenueGlobeAnimation() directly inside that
 * component's own useEffect — see the snippet at the bottom of the
 * README.
 * ------------------------------------------------------------------
 */

import { useEffect, useRef } from 'react';
import { initVenueGlobeAnimation } from './venueGlobeAnimation';
import './venue-globe-animation.css';

const VENUES = [
  { name: 'Grand Horizon Hall', lat: 40.7128, lon: -74.006, target: true },
  { name: 'Skyline Pavilion', lat: 51.5074, lon: -0.1278 },
  { name: 'Aurora Terrace', lat: 35.6762, lon: 139.6503 },
  { name: 'Marina Point', lat: -33.8688, lon: 151.2093 },
  { name: 'Copper Atrium', lat: 25.2048, lon: 55.2708 },
];

export default function VenueGlobeSection() {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return undefined;

    const instance = initVenueGlobeAnimation(containerRef.current, {
      venues: VENUES,
      headline: 'Step inside Grand Horizon Hall',
      ctaLabel: 'Explore Venue',
      onExplore: () => {
        // Wire this up to your router, e.g.:
        // navigate('/venues/grand-horizon-hall');
        console.log('Explore Venue clicked');
      },
    });

    return () => instance.destroy();
  }, []);

  return <section className="venue-animation-container" ref={containerRef} />;
}