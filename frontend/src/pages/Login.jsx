import React, { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import AuthExperience from "./AuthExperience.jsx";
import AuthTransition from "../components/AuthTransition.jsx";

const PROFILE_KEY = "venueconnect_profile";
const ONBOARDING_KEY = "venueconnect_onboarding_done";

function getInitialPhase() {
  try {
    // Onboarding already done this session -> skip straight to login.
    return sessionStorage.getItem(ONBOARDING_KEY) === "true"
      ? "login"
      : "intro";
  } catch {
    return "intro";
  }
}

function getInitialProfile() {
  try {
    return sessionStorage.getItem(PROFILE_KEY) || "";
  } catch {
    return "";
  }
}

export default function Login() {
  const navigate = useNavigate();

  /*
    Single source of truth for where we are in the flow:
      "intro"    -> cinematic VenueConnect animation, then profile picker
      "describe" -> profile picker only, no animation (used for "Change profile")
      "login"    -> the login/signup form

    Previously this was split across `showProfiles` + `profileKey`,
    which could fall out of sync (e.g. profileKey staying 0 while
    showProfiles flipped back to true) and let the intro + profile
    picker replay. One phase value makes that impossible.
  */
  const [phase, setPhase] = useState(getInitialPhase);
  const [profile, setProfile] = useState(getInitialProfile);

  // Guards openLogin against being invoked twice for the same pass.
  const completingRef = useRef(false);

  function openLogin(_target, data) {
    if (completingRef.current) return;
    completingRef.current = true;

    const selectedProfile = data?.profile || "";

    if (!selectedProfile) {
      completingRef.current = false;
      return;
    }

    setProfile(selectedProfile);

    try {
      sessionStorage.setItem(PROFILE_KEY, selectedProfile);
      sessionStorage.setItem(ONBOARDING_KEY, "true");
    } catch {
      // Ignore storage errors
    }

    setPhase("login");
  }

  function changeProfile() {
    // User intentionally wants to select another profile.
    // Skip the cinematic intro this time.
    try {
      sessionStorage.removeItem(PROFILE_KEY);
      sessionStorage.removeItem(ONBOARDING_KEY);
    } catch {
      // Ignore storage errors
    }

    completingRef.current = false;
    setProfile("");
    setPhase("describe");
  }

  function handleBackHome() {
    navigate("/", { replace: true });
  }

  const showTransition = phase === "intro" || phase === "describe";

  return (
    <div
      className="auth-route-shell"
      style={{
        minHeight: "100vh",
        width: "100%",
        background: "#000",
      }}
    >
      <AnimatePresence mode="wait" initial={false}>
        {showTransition ? (
          <motion.div
            key="transition"
            className="auth-route-layer"
            initial={{
              opacity: 0,
              scale: 0.99,
            }}
            animate={{
              opacity: 1,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              scale: 1.015,
            }}
            transition={{
              duration: 0.45,
              ease: [0.16, 1, 0.3, 1],
            }}
            style={{
              width: "100%",
              minHeight: "100vh",
            }}
          >
            <AuthTransition
              target="login"
              startPhase={phase}
              onComplete={openLogin}
              onBack={handleBackHome}
            />
          </motion.div>
        ) : (
          <motion.div
            key="login-form"
            className="auth-route-layer"
            initial={{
              opacity: 0,
              x: 28,
            }}
            animate={{
              opacity: 1,
              x: 0,
            }}
            exit={{
              opacity: 0,
              x: -28,
            }}
            transition={{
              duration: 0.45,
              ease: [0.16, 1, 0.3, 1],
            }}
            style={{
              width: "100%",
              minHeight: "100vh",
            }}
          >
            <AuthExperience
              initialMode="login"
              initialScreen="auth"
              initialProfile={profile}
              onChangeProfile={changeProfile}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}