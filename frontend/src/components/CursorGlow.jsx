import React, { useEffect, useRef } from "react";

// A soft gold light that follows the pointer on desktop. Skipped on touch
// devices and when the user prefers reduced motion.
export default function CursorGlow() {
  const ref = useRef(null);

  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isTouch = window.matchMedia("(pointer: coarse)").matches;
    if (prefersReduced || isTouch) return;

    let raf = null;
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let curX = mouseX;
    let curY = mouseY;

    function onMove(e) {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (ref.current) ref.current.style.opacity = "1";
    }
    function onLeave() {
      if (ref.current) ref.current.style.opacity = "0";
    }

    function tick() {
      curX += (mouseX - curX) * 0.12;
      curY += (mouseY - curY) * 0.12;
      if (ref.current) {
        ref.current.style.left = `${curX}px`;
        ref.current.style.top = `${curY}px`;
      }
      raf = requestAnimationFrame(tick);
    }

    window.addEventListener("mousemove", onMove);
    document.addEventListener("mouseleave", onLeave);
    raf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeave);
      cancelAnimationFrame(raf);
    };
  }, []);

  return <div ref={ref} className="cursor-glow opacity-0 hidden md:block" aria-hidden="true" />;
}
