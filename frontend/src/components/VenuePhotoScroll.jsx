import { useEffect, useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./venue-photo-scroll.css";

gsap.registerPlugin(ScrollTrigger);

// Real photography, not a rendered model — a wide establishing shot moving
// toward closer interior detail, like walking through the room.
export const VENUE_PHOTO_FRAMES = [
  { image: "https://images.unsplash.com/photo-1780542900375-0cf459e38fbb?auto=format&fit=crop&w=2400&q=90", heading: "The Whole Room" },
  { image: "https://images.unsplash.com/photo-1587271636175-90d58cdad458?auto=format&fit=crop&w=2400&q=90", heading: "Built For The Moment" },
  { image: "https://images.unsplash.com/photo-1745682595597-8932b7f12169?auto=format&fit=crop&w=2400&q=90", heading: "Room To Celebrate" },
  { image: "https://images.unsplash.com/photo-1677768062274-fdd45caac233?auto=format&fit=crop&w=2400&q=90", heading: "Every Table, Dressed" },
  { image: "https://images.unsplash.com/photo-1687087172783-3a9f16246579?auto=format&fit=crop&w=2400&q=90", heading: "Step Inside" },
];

export default function VenuePhotoScroll() {
  const rootRef = useRef(null);
  const pinRef = useRef(null);
  const imageRefs = useRef([]);
  const textRefs = useRef([]);

  useEffect(() => {
    VENUE_PHOTO_FRAMES.forEach(({ image }) => {
      const preload = new Image();
      preload.src = image;
    });
  }, []);

  useLayoutEffect(() => {
    const root = rootRef.current;
    const pin = pinRef.current;
    const images = imageRefs.current;
    const texts = textRefs.current;
    if (!root || !pin || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;

    const context = gsap.context(() => {
      // images: soft crossfade + slow zoom-out, matching the reference reel
      gsap.set(images, { autoAlpha: 0, scale: 1.14 });
      // text: starts pushed down + invisible, so it visibly RISES up into place
      gsap.set(texts, { autoAlpha: 0, y: 46 });
      gsap.set(images[0], { autoAlpha: 1, scale: 1 });
      gsap.set(texts[0], { autoAlpha: 1, y: 0 });

      const stepHeight = window.innerWidth < 720 ? 0.42 : 0.5;
      const timeline = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: root,
          start: "top top",
          end: () => `+=${Math.round(window.innerHeight * stepHeight * (VENUE_PHOTO_FRAMES.length - 1))}`,
          scrub: 0.35,
          pin,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      VENUE_PHOTO_FRAMES.slice(1).forEach((_, offset) => {
        const current = offset;
        const next = offset + 1;
        const position = offset;

        timeline
          .to(images[current], { autoAlpha: 0, scale: 1.02, duration: 0.45, ease: "power1.inOut" }, position)
          .fromTo(images[next], { autoAlpha: 0, scale: 1.14 }, { autoAlpha: 1, scale: 1, duration: 0.7, ease: "power1.out" }, position)
          // outgoing text: fades out in place (no drift) — reads as it simply settling/dimming
          .to(texts[current], { autoAlpha: 0, duration: 0.2, ease: "power1.in" }, position)
          // incoming text: rises up from below and settles into place — "land, then properly" sit
          .fromTo(
            texts[next],
            { autoAlpha: 0, y: 46 },
            { autoAlpha: 1, y: 0, duration: 0.55, ease: "power3.out" },
            position + 0.22
          );
      });
    }, root);

    return () => context.revert();
  }, []);

  return (
    <section className="vc-photo-scroll" ref={rootRef} aria-label="Grand Mehfil, a closer look">
      <div className="vc-photo-scroll__pin" ref={pinRef}>
        {VENUE_PHOTO_FRAMES.map((frame, index) => (
          <div
            className="vc-photo-scroll__image-layer"
            key={`image-${index}`}
            ref={(element) => { imageRefs.current[index] = element; }}
            style={{ backgroundImage: `url(${frame.image})` }}
          />
        ))}

        <div className="vc-photo-scroll__shade" />

        {VENUE_PHOTO_FRAMES.map((frame, index) => (
          <div
            className="vc-photo-scroll__copy"
            key={`text-${index}`}
            ref={(element) => { textRefs.current[index] = element; }}
          >
            <span className="vc-photo-scroll__rule" aria-hidden="true" />
            <h2>{frame.heading}</h2>
            <span className="vc-photo-scroll__rule" aria-hidden="true" />
          </div>
        ))}
      </div>
    </section>
  );
}
