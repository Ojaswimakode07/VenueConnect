import { useEffect, useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./cinematic-venue-film.css";

gsap.registerPlugin(ScrollTrigger);

/**
 * Frame model
 * align: "bottom" | "center" | "left" | "steps"
 *   bottom -> eyebrow / big heading / body, anchored bottom-left (venue story beats)
 *   center -> big heading (+ optional small sub line) centered, like "UNIQUE LOCATION"
 *   left   -> kicker / heading / body, anchored left, no image
 *   steps  -> kicker / heading / body + a 5-column step grid, all revealed together (no image)
 */
export const CINEMATIC_FRAMES = [
  { align: "bottom", image: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=2400&q=90", eyebrow: "VENUECONNECT / CELEBRATE BEAUTIFULLY", heading: "Weddings", body: "A setting worthy of the vows, the music and every photograph after." },
  { align: "bottom", image: "https://images.unsplash.com/photo-1507504031003-b417219a0fde?auto=format&fit=crop&w=2400&q=90", eyebrow: "VENUECONNECT / CELEBRATE BEAUTIFULLY", heading: "Engagements", body: "For the first promise and the people who make it unforgettable." },
  { align: "bottom", image: "https://images.unsplash.com/photo-1505409859467-3a796fd5798e?auto=format&fit=crop&w=2400&q=90", eyebrow: "VENUECONNECT / CELEBRATE BEAUTIFULLY", heading: "Corporate events", body: "Thoughtful spaces for launches, conversations and important ideas." },
  { align: "bottom", image: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=2400&q=90", eyebrow: "VENUECONNECT / CELEBRATE BEAUTIFULLY", heading: "Receptions & parties", body: "The perfect backdrop for the last toast and the first dance." },

  { align: "center", image: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=2400&q=90", heading: "UNIQUE VENUES", sub: "HANDPICKED & VERIFIED IN PERSON" },
  { align: "center", image: "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=2400&q=90", heading: "READY TO CELEBRATE?" },

  {
    align: "steps",
    kicker: "GETTING STARTED",
    heading: "Plan your event in 5 simple steps",
    body: "From the first search to the final toast — a clear path, fully guided, every step of the way.",
    steps: [
      { label: "01", title: "Search & shortlist" },
      { label: "02", title: "Tour in 3D" },
      { label: "03", title: "Talk to the venue" },
      { label: "04", title: "Confirm your date" },
      { label: "05", title: "Celebrate" },
    ],
  },
];

const IMAGE_FRAME_COUNT = CINEMATIC_FRAMES.filter((frame) => frame.align === "bottom").length;

export default function CinematicVenueFilm() {
  const rootRef = useRef(null);
  const pinRef = useRef(null);
  const imageRefs = useRef([]);
  const textRefs = useRef([]);
  const centerLineRef = useRef(null);

  useEffect(() => {
    CINEMATIC_FRAMES.forEach(({ image }) => {
      if (!image) return;
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
      gsap.set(images, { autoAlpha: 0, scale: 1.12, filter: "brightness(1)" });
      gsap.set(texts, { autoAlpha: 0, y: 22, filter: "blur(8px)" });
      gsap.set(images[0], { autoAlpha: 1, scale: 1 });
      gsap.set(texts[0], { autoAlpha: 1, y: 0, filter: "blur(0px)" });

      // shorter per-step scroll distance + a tighter scrub value = the pin
      // finishes sooner and tracks the wheel/trackpad more directly.
      const stepHeight = window.innerWidth < 720 ? 0.42 : 0.5;
      const timeline = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: root,
          start: "top top",
          end: () => `+=${Math.round(window.innerHeight * stepHeight * (CINEMATIC_FRAMES.length - 1))}`,
          scrub: 0.35,
          pin,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      CINEMATIC_FRAMES.slice(1).forEach((_, offset) => {
        const current = offset;
        const next = offset + 1;
        const position = offset;

        timeline
          .to(images[current], { autoAlpha: 0, scale: 1.03, filter: "brightness(.7)", duration: 0.45, ease: "power1.inOut" }, position)
          .fromTo(images[next], { autoAlpha: 0, scale: 1.12 }, { autoAlpha: 1, scale: 1, filter: "brightness(1)", duration: 0.7, ease: "power1.out" }, position)
          .to(texts[current], { autoAlpha: 0, y: -14, filter: "blur(6px)", duration: 0.22, ease: "power1.in" }, position)
          .fromTo(texts[next], { autoAlpha: 0, y: 22, filter: "blur(8px)" }, { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.38, ease: "power2.out" }, position + 0.2);

        // fade the center tagline out once the venue-story beats give way to the statement frames
        if (current === IMAGE_FRAME_COUNT - 1 && centerLineRef.current) {
          timeline.to(centerLineRef.current, { autoAlpha: 0, duration: 0.3, ease: "power1.out" }, position);
        }
      });
    }, root);

    return () => context.revert();
  }, []);

  return (
    <section className="vc-cinematic" ref={rootRef} aria-label="VenueConnect celebration stories">
      <div className="vc-cinematic__pin" ref={pinRef}>
        <div className="vc-cinematic__canvas">
          {CINEMATIC_FRAMES.map((frame, index) => (
            <div
              className="vc-cinematic__image-layer"
              key={`image-${index}`}
              ref={(element) => { imageRefs.current[index] = element; }}
              style={frame.image ? { backgroundImage: `url(${frame.image})` } : { background: "#050608" }}
            />
          ))}

          <div className="vc-cinematic__shade" />
          <p className="vc-cinematic__center-line" ref={centerLineRef}>A place for every moment.</p>

          {CINEMATIC_FRAMES.map((frame, index) => (
            <div
              className={`vc-cinematic__copy-layer vc-cinematic__copy-layer--${frame.align}`}
              key={`text-${index}`}
              ref={(element) => { textRefs.current[index] = element; }}
            >
              {frame.align === "bottom" && (
                <>
                  <p className="vc-cinematic__eyebrow">{frame.eyebrow}</p>
                  <h2>{frame.heading}</h2>
                  <span>{frame.body}</span>
                </>
              )}
              {frame.align === "center" && (
                <>
                  <h2>{frame.heading}</h2>
                  {frame.sub && <span>{frame.sub}</span>}
                </>
              )}
              {frame.align === "left" && (
                <>
                  <p className="vc-cinematic__eyebrow">{frame.kicker}</p>
                  <h2>{frame.heading}</h2>
                  {frame.body && <span>{frame.body}</span>}
                </>
              )}
              {frame.align === "steps" && (
                <>
                  <p className="vc-cinematic__eyebrow">{frame.kicker}</p>
                  <h2>{frame.heading}</h2>
                  {frame.body && <span>{frame.body}</span>}
                  <ol className="vc-cinematic__steps">
                    {frame.steps.map((step) => (
                      <li key={step.label}>
                        <em>{step.label}</em>
                        <b>{step.title}</b>
                      </li>
                    ))}
                  </ol>
                </>
              )}
            </div>
          ))}

          <div className="vc-cinematic__footer">
            <span>VENUECONNECT / FIND THE FEELING</span>
            <span>SCROLL TO TRANSFORM</span>
          </div>
        </div>
      </div>
    </section>
  );
}
