import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import "./auth-transition.css";

const VIDEO_URL = "/auth-background.mp4";

const PROFILES = [
  {
    key: "customer",
    title: "Customer",
    description: "Find the perfect venue for your celebration",
    icon: "✦",
  },
  {
    key: "owner",
    title: "Venue Owner",
    description: "Showcase and manage your venue",
    icon: "⌂",
  },
  {
    key: "decor",
    title: "Decorator",
    description: "Create beautiful event spaces and experiences",
    icon: "✳",
  },
  {
    key: "catering",
    title: "Caterer",
    description: "Provide food and catering services for events",
    icon: "♨",
  },
  {
    key: "music",
    title: "Musician",
    description: "Bring music and entertainment to celebrations",
    icon: "♫",
  },
  {
    key: "photographer",
    title: "Photographer",
    description: "Capture memorable moments and celebrations",
    icon: "◉",
  },
];

export default function AuthTransition({
  target,
  onComplete,
  onBack,
  // "intro"    -> play the cinematic VenueConnect animation, then show profiles
  // "describe" -> show profiles directly (used for "Change profile")
  startPhase = "intro",
}) {
  const videoRef = useRef(null);

  const skipIntro = startPhase !== "intro";

  const [introVisible, setIntroVisible] = useState(!skipIntro);
  const [profilesVisible, setProfilesVisible] = useState(skipIntro);

  /*
    This effect is intentionally set up to run EXACTLY ONCE per mount
    ([] dependency array). AuthTransition is only ever mounted once per
    pass through the flow — Login.jsx fully unmounts it once the user
    reaches the login form, and only remounts it fresh if they explicitly
    click "Change profile". So there is no case where this should re-run
    mid-mount; doing so is what let the animation appear to replay.
  */
  useEffect(() => {
    const video = videoRef.current;

    if (skipIntro) {
      setIntroVisible(false);
      setProfilesVisible(true);

      return () => {
        if (video) {
          video.pause();
        }
      };
    }

    if (video) {
      video.currentTime = 0;
      video.play().catch(() => {});
    }

    const timer = window.setTimeout(() => {
      setIntroVisible(false);
      setProfilesVisible(true);
    }, 1900);

    return () => {
      window.clearTimeout(timer);

      if (video) {
        video.pause();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Guards selectProfile against firing more than once for a single
  // mount (duplicate click/tap events on the same button are the
  // classic cause of a flow silently "running twice").
  const hasSelectedRef = useRef(false);

  function selectProfile(profile) {
    if (hasSelectedRef.current) return;
    hasSelectedRef.current = true;

    /*
      This is the ONLY place where the profile is selected.
      Once clicked, immediately go to Login.
      AuthExperience will NOT show another profile question.
    */
    onComplete(target, {
      profile,
    });
  }

  function handleBack() {
    if (videoRef.current) {
      videoRef.current.pause();
    }

    onBack();
  }

  return (
    <div className="auth-transition">
      <video
        ref={videoRef}
        className="auth-transition-video"
        src={VIDEO_URL}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        aria-hidden="true"
      />

      <div className="auth-transition-vignette" />
      <div className="auth-transition-grain" />

      <motion.button
        type="button"
        className="auth-transition-back"
        onClick={handleBack}
        initial={{
          opacity: 0,
          x: -12,
        }}
        animate={{
          opacity: 1,
          x: 0,
        }}
        transition={{
          duration: 0.35,
        }}
      >
        <span className="back-arrow">←</span>
        <span>Back</span>
      </motion.button>

      <AnimatePresence mode="wait">
        {introVisible ? (
          <motion.div
            key="intro"
            className="auth-intro"
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            exit={{
              opacity: 0,
              scale: 1.03,
              filter: "blur(6px)",
            }}
            transition={{
              duration: 0.45,
            }}
          >
            <div className="auth-intro-small">
              WELCOME TO
            </div>

            <div
              className="auth-intro-title"
              aria-label="VenueConnect"
            >
              {"VenueConnect".split("").map((letter, index) => (
                <motion.span
                  key={`${letter}-${index}`}
                  initial={{
                    opacity: 0,
                    y: 44,
                    rotateX: -75,
                    filter: "blur(7px)",
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    rotateX: 0,
                    filter: "blur(0px)",
                  }}
                  transition={{
                    delay: 0.10 + index * 0.055,
                    duration: 0.58,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                >
                  {letter}
                </motion.span>
              ))}
            </div>

            <motion.div
              className="auth-intro-line"
              initial={{
                scaleX: 0,
                opacity: 0,
              }}
              animate={{
                scaleX: 1,
                opacity: 1,
              }}
              transition={{
                delay: 0.82,
                duration: 0.65,
                ease: "easeOut",
              }}
            />

            <motion.p
              className="auth-intro-tagline"
              initial={{
                opacity: 0,
                y: 10,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                delay: 1,
                duration: 0.5,
                ease: "easeOut",
              }}
            >
              Where celebrations find their perfect place.
            </motion.p>
          </motion.div>
        ) : profilesVisible ? (
          <motion.div
            key="profiles"
            className="auth-question-wrap auth-question-two"
            initial={{
              opacity: 0,
              y: 22,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.5,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            <div className="auth-question-step">
              STEP 1 OF 1
            </div>

            <h1 className="auth-question-title">
              What describes you best?
            </h1>

            <p className="auth-question-description">
              Choose a profile to continue.
            </p>

            <div className="auth-profile-options">
              {PROFILES.map((profile, index) => (
                <motion.button
                  key={profile.key}
                  type="button"
                  className="auth-profile-option"
                  onClick={() => selectProfile(profile.key)}
                  initial={{
                    opacity: 0,
                    y: 12,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  transition={{
                    delay: index * 0.035,
                    duration: 0.3,
                    ease: "easeOut",
                  }}
                  whileHover={{
                    y: -3,
                    scale: 1.008,
                  }}
                  whileTap={{
                    scale: 0.985,
                  }}
                >
                  <span className="auth-profile-number">
                    {String(index + 1).padStart(2, "0")}
                  </span>

                  <span className="auth-profile-content">
                    <span className="auth-profile-title">
                      <span className="auth-profile-icon">
                        {profile.icon}
                      </span>

                      {profile.title}
                    </span>

                    <span className="auth-profile-description">
                      {profile.description}
                    </span>
                  </span>

                  <span className="auth-profile-arrow">
                    ↗
                  </span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}