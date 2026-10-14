import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext.jsx";

// Venue photography slideshow.
// The images remain fixed behind the content while slowly
// zooming and crossfading between slides.
const SLIDES = [
  "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=1600&q=80",
  "https://images.unsplash.com/photo-1519741497674-611481863552?w=1600&q=80",
  "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=1600&q=80",
  "https://images.unsplash.com/photo-1478146059778-26028b07395a?w=1600&q=80",
];

const SLIDE_DURATION = 4200;

export default function Gate({ onDone }) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [exiting, setExiting] = useState(false);
  const [slide, setSlide] = useState(0);

  // Automatically change the background image.
  useEffect(() => {
    const id = setInterval(() => {
      setSlide((s) => (s + 1) % SLIDES.length);
    }, SLIDE_DURATION);

    return () => clearInterval(id);
  }, []);

  // Skip → directly to venues.
  function handleSkip() {
    sessionStorage.setItem("vc_gate_seen", "1");

    setExiting(true);

    setTimeout(() => {
      onDone();
      navigate("/venues");
    }, 650);
  }

  // Not logged in → login page. Logged in → straight to their dashboard.
  function handlePrimary() {
    sessionStorage.setItem("vc_gate_seen", "1");

    setExiting(true);

    setTimeout(() => {
      onDone();
      if (user) {
        navigate(user.role === "vendor" ? "/vendor/dashboard" : "/");
      } else {
        navigate("/login");
      }
    }, 650);
  }

  return (
    <AnimatePresence>
      {!exiting && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{
            duration: 0.65,
            ease: [0.65, 0, 0.35, 1],
          }}
          className="fixed inset-0 z-[200] overflow-hidden bg-plum-dark"
        >
          {/* =========================================================
              BACKGROUND SLIDESHOW
              ========================================================= */}
          <div className="absolute inset-0">
            <AnimatePresence mode="sync">
              <motion.div
                key={slide}
                initial={{
                  opacity: 0,
                  scale: 1.04,
                }}
                animate={{
                  opacity: 1,
                  scale: 1.10,
                }}
                exit={{
                  opacity: 0,
                }}
                transition={{
                  opacity: {
                    duration: 1.4,
                    ease: "easeInOut",
                  },
                  scale: {
                    duration: SLIDE_DURATION / 1000 + 1.4,
                    ease: "linear",
                  },
                }}
                className="absolute inset-0 bg-cover bg-center"
                style={{
                  backgroundImage: `url(${SLIDES[slide]})`,

                  // Much less blur so the actual venue
                  // remains clearly visible.
                  filter: "blur(4px)",

                  // Slightly zoom the background so the blur
                  // doesn't create empty edges.
                  transform: "scale(1.02)",
                }}
              />
            </AnimatePresence>

            {/* =====================================================
                VERY LIGHT OVERLAY
                Previously 35%, now only 10%.
                This makes the actual image much more visible.
                ===================================================== */}
            <div className="absolute inset-0 bg-plum-dark/10" />

            {/* =====================================================
                SUBTLE GRADIENT
                Keeps text readable without hiding the venue.
                ===================================================== */}
            <div className="absolute inset-0 bg-gradient-to-t from-plum-dark/30 via-transparent to-plum-dark/5" />
          </div>

          {/* =========================================================
              MAIN CONTENT
              ========================================================= */}
          <div className="relative z-10 h-full w-full flex flex-col items-center justify-center px-6 text-center">

            {/* ESTABLISHED */}
            <motion.p
              initial={{
                opacity: 0,
                y: -12,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                delay: 0.25,
                duration: 0.8,
              }}
              className="uppercase tracking-[6px] text-gold-light text-xs font-semibold mb-6"
            >
              {user ? `Hey, ${user.full_name?.split(" ")[0]}` : "Est. 2026 · India"}
            </motion.p>

            {/* LOGO / BRAND */}
            <motion.h1
              initial={{
                opacity: 0,
                y: 20,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                delay: 0.4,
                duration: 0.9,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="font-serif text-5xl md:text-7xl font-bold text-white mb-4"
            >
              Venue
              <span className="text-gold-light">Connect</span>
            </motion.h1>

            {/* TAGLINE */}
            <motion.p
              initial={{
                opacity: 0,
              }}
              animate={{
                opacity: 1,
              }}
              transition={{
                delay: 0.9,
                duration: 0.8,
              }}
              className="text-gray-200 max-w-md mb-10 font-display text-xl italic"
            >
              Where every celebration begins — now visualised in 3D,
              before you book.
            </motion.p>

            {/* =====================================================
                LOGIN / SKIP BUTTON
                ===================================================== */}
            <motion.div
              initial={{
                opacity: 0,
                y: 16,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                delay: 1.15,
                duration: 0.7,
              }}
              className="flex items-stretch rounded-full overflow-hidden border border-white/25 backdrop-blur-md bg-white/10"
            >
              {/* LOGIN / CONTINUE */}
              <button
                onClick={handlePrimary}
                className="px-8 py-3.5 text-white font-bold tracking-wide hover:bg-gold hover:text-plum-dark transition-colors duration-300"
              >
                {user ? (user.role === "vendor" ? "Go to Dashboard" : "Continue") : "Log In"}
              </button>

              {/* DIVIDER */}
              <span className="w-px bg-white/20" />

              {/* SKIP */}
              <button
                onClick={handleSkip}
                className="px-8 py-3.5 text-white/90 font-semibold tracking-wide hover:bg-white/15 transition-colors duration-300"
              >
                Skip
              </button>
            </motion.div>

            {/* =====================================================
                SLIDESHOW INDICATORS
                ===================================================== */}
            <div className="flex items-center gap-1.5 mt-10">
              {SLIDES.map((_, i) => (
                <span
                  key={i}
                  className={`h-1 rounded-full transition-all duration-500 ${
                    i === slide
                      ? "w-6 bg-gold-light"
                      : "w-1.5 bg-white/30"
                  }`}
                />
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}