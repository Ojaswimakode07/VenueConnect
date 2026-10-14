import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./plan-your-event.css";

gsap.registerPlugin(ScrollTrigger);

// Same pinned, crossfading photo-story mechanic as the venue photo scroll —
// full-bleed image behind, text fades/blurs in from below on every step —
// but the content is the 5-step booking journey, with a live numbered rail.
export const PLAN_STEPS = [
  {
    label: "01",
    title: "Search & shortlist",
    body: "Filter banquet halls and event venues by city, guest count, budget and the occasion you're celebrating.",
    image: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=2400&q=90",
  },
  {
    label: "02",
    title: "Tour in 3D",
    body: "Walk the hall, seating layout, stage and décor from wherever you are, long before you book a visit.",
    image: "https://images.unsplash.com/photo-1507504031003-b417219a0fde?auto=format&fit=crop&w=2400&q=90",
  },
  {
    label: "03",
    title: "Talk to the venue",
    body: "Message the venue directly, ask about dates and packages, and get real answers, not a runaround.",
    image: "https://images.unsplash.com/photo-1505409859467-3a796fd5798e?auto=format&fit=crop&w=2400&q=90",
  },
  {
    label: "04",
    title: "Confirm your date",
    body: "Compare the details side by side, lock your date and secure the booking with total confidence.",
    image: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=2400&q=90",
  },
  {
    label: "05",
    title: "Celebrate",
    body: "Manage guests, vendors and the whole run of show from one place — then just enjoy the day.",
    image: "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=2400&q=90",
  },
];

export default function PlanYourEvent() {
  const rootRef = useRef(null);
  const pinRef = useRef(null);
  const imageRefs = useRef([]);
  const textRefs = useRef([]);
  const progressRef = useRef(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    PLAN_STEPS.forEach(({ image }) => {
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
      gsap.set(images, { autoAlpha: 0, scale: 1.12 });
      gsap.set(texts, { autoAlpha: 0, y: 26, filter: "blur(8px)" });
      gsap.set(images[0], { autoAlpha: 1, scale: 1 });
      gsap.set(texts[0], { autoAlpha: 1, y: 0, filter: "blur(0px)" });
      if (progressRef.current) gsap.set(progressRef.current, { scaleY: 1 / PLAN_STEPS.length });

      const stepHeight = window.innerWidth < 720 ? 0.42 : 0.5;
      const timeline = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: root,
          start: "top top",
          end: () => `+=${Math.round(window.innerHeight * stepHeight * (PLAN_STEPS.length - 1))}`,
          scrub: 0.35,
          pin,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            const index = Math.min(PLAN_STEPS.length - 1, Math.round(self.progress * (PLAN_STEPS.length - 1)));
            setActive((prev) => (prev === index ? prev : index));
          },
        },
      });

      PLAN_STEPS.slice(1).forEach((_, offset) => {
        const current = offset;
        const next = offset + 1;
        const position = offset;

        timeline
          .to(images[current], { autoAlpha: 0, scale: 1.03, duration: 0.45, ease: "power1.inOut" }, position)
          .fromTo(images[next], { autoAlpha: 0, scale: 1.12 }, { autoAlpha: 1, scale: 1, duration: 0.7, ease: "power1.out" }, position)
          .to(texts[current], { autoAlpha: 0, y: -16, filter: "blur(6px)", duration: 0.22, ease: "power1.in" }, position)
          .fromTo(texts[next], { autoAlpha: 0, y: 26, filter: "blur(8px)" }, { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.38, ease: "power2.out" }, position + 0.2)
          .to(progressRef.current, { scaleY: (next + 1) / PLAN_STEPS.length, duration: 0.4, ease: "power1.inOut" }, position);
      });
    }, root);

    return () => context.revert();
  }, []);

  return (
    <section className="vc-plan" ref={rootRef} aria-label="Plan your event in 5 steps">
      <div className="vc-plan__pin" ref={pinRef}>
        {PLAN_STEPS.map((step, index) => (
          <div
            className="vc-plan__image-layer"
            key={`plan-image-${index}`}
            data-first={index === 0 ? "true" : undefined}
            ref={(element) => { imageRefs.current[index] = element; }}
            style={{ backgroundImage: `url(${step.image})` }}
          />
        ))}

        <div className="vc-plan__shade" />

        <div className="vc-plan__intro">
          <p className="vc-plan__kicker">GETTING STARTED</p>
          <h2>Plan your event<br />in 5 simple steps</h2>
        </div>

        {PLAN_STEPS.map((step, index) => (
          <div
            className="vc-plan__copy"
            key={`plan-text-${index}`}
            data-first={index === 0 ? "true" : undefined}
            ref={(element) => { textRefs.current[index] = element; }}
          >
            <em>{step.label}</em>
            <h3>{step.title}</h3>
            <span>{step.body}</span>
          </div>
        ))}

        <div className="vc-plan__rail">
          <div className="vc-plan__rail-track">
            <div className="vc-plan__rail-fill" ref={progressRef} />
          </div>
          <ol>
            {PLAN_STEPS.map((step, index) => (
              <li key={step.label} className={index === active ? "is-active" : ""}>
                <em>{step.label}</em>
                <b>{step.title}</b>
              </li>
            ))}
          </ol>
        </div>

        <div className="vc-plan__footer">
          <span>VENUECONNECT / THE VENUECONNECT WAY</span>
          <span>SCROLL TO CONTINUE</span>
        </div>
      </div>
    </section>
  );
}
