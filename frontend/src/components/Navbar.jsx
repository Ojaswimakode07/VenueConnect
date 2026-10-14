
import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext.jsx";
import AuthTransition from "./AuthTransition.jsx";

const NAV_LINKS = [
  { to: "/venues", label: "Venues" },
  { to: "/about", label: "About" },
];

const ROLE_LINK = {
  customer: {
    to: "/my-bookings",
    label: "My Bookings",
  },
  vendor: {
    to: "/vendor/dashboard",
    label: "Dashboard",
  },
};

// Authentication storage keys
const PROFILE_KEY = "venueconnect_profile";
const ONBOARDING_KEY = "venueconnect_onboarding_done";

function NavLink({ to, children, onClick }) {
  const location = useLocation();
  const active = location.pathname === to;

  return (
    <Link
      to={to}
      onClick={onClick}
      className="relative py-1 group"
    >
      {/* NAVIGATION TEXT */}
      <span
        className={
          active
            ? "text-white font-semibold"
            : "text-white group-hover:text-white transition-colors"
        }
      >
        {children}
      </span>

      {/* WHITE ACTIVE / HOVER UNDERLINE */}
      <span
        className={`absolute left-0 -bottom-0.5 h-[2px] bg-white transition-all duration-300 ${
          active
            ? "w-full"
            : "w-0 group-hover:w-full"
        }`}
      />
    </Link>
  );
}

// Scroll to the manifesto section on the home page
function scrollToManifesto() {
  const el = document.getElementById("manifesto");

  if (el) {
    const headerOffset = 70;

    const elementPosition =
      el.getBoundingClientRect().top +
      window.scrollY;

    window.scrollTo({
      top: elementPosition - headerOffset,
      left: 0,
      behavior: "smooth",
    });
  }
}

export default function Navbar() {
  const { user, logout } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  /*
   * null          = transition closed
   * "/login"      = Login transition
   * "/register"   = Sign Up transition
   */
  const [authTransition, setAuthTransition] =
    useState(null);

  // Customers don't see the "Services" link in the navbar
  const navLinks = NAV_LINKS.filter(
    (l) =>
      !(
        l.to === "/services" &&
        user?.role === "customer"
      )
  );

  // ==========================================
  // ABOUT BUTTON
  // ==========================================

  function handleAboutClick(e) {
    e.preventDefault();

    setOpen(false);

    if (location.pathname === "/") {
      scrollToManifesto();
    } else {
      navigate("/");

      setTimeout(() => {
        scrollToManifesto();
      }, 400);
    }
  }

  // ==========================================
  // AUTH TRANSITION
  // ==========================================

  function startAuthTransition(path) {
    setOpen(false);

    /*
     * Do NOT navigate yet.
     *
     * The user must first see:
     *
     * Globe
     * ↓
     * VenueConnect
     * ↓
     * What's your name?
     * ↓
     * What describes you best?
     * ↓
     * Login/Register
     */

    setAuthTransition(path);
  }

  function completeAuthTransition(path, onboarding) {
    /*
     * Save the selected profile and onboarding status
     * before navigating to the login/register page.
     *
     * This is intended to prevent Login.jsx from
     * displaying the profile selection screen again.
     */

    const selectedProfile = onboarding?.profile || "";

    try {
      if (selectedProfile) {
        sessionStorage.setItem(
          PROFILE_KEY,
          selectedProfile
        );
      }

      sessionStorage.setItem(
        ONBOARDING_KEY,
        "true"
      );
    } catch (error) {
      console.warn(
        "Unable to save onboarding data:",
        error
      );
    }

    // Close the authentication transition
    setAuthTransition(null);

    /*
     * Navigate to the actual Login/Register page.
     *
     * The name and profile selected during
     * the globe transition are passed through
     * React Router state.
     */

    navigate(path, {
      state: onboarding,
    });
  }

  function closeAuthTransition() {
    setAuthTransition(null);

    /*
     * Back from the globe always returns
     * to the REAL homepage.
     */

    navigate("/", {
      replace: false,
    });

    /*
     * Make sure the homepage is at the very top.
     */

    setTimeout(() => {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: "auto",
      });
    }, 100);
  }

  // ==========================================
  // SCROLL
  // ==========================================

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 16);
    }

    onScroll();

    window.addEventListener("scroll", onScroll, {
      passive: true,
    });

    return () =>
      window.removeEventListener(
        "scroll",
        onScroll
      );
  }, []);

  // ==========================================
  // LOGOUT
  // ==========================================

  function handleLogout() {
    logout();
    navigate("/");
  }

  const roleLink = user?.role
    ? ROLE_LINK[user.role]
    : null;

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <>
      <header
        className={`sticky top-0 z-50 transition-all duration-300 bg-black ${
          scrolled
            ? "shadow-lg"
            : "border-b border-white/10"
        }`}
      >
        <div className="w-full px-6 md:px-8 py-3 flex items-center relative">

          {/* ==================================
              LOGO
          ================================== */}

          <Link
            to="/"
            className="flex items-center gap-2.5 group"
          >
            <motion.img
              whileHover={{
                scale: 1.05,
              }}
              src="/logo.png"
              alt="VenueConnect"
              className="h-10 w-auto object-contain"
            />
          </Link>

          {/* ==================================
              DESKTOP NAVIGATION
          ================================== */}

          <nav className="hidden md:flex items-center gap-7 text-sm font-medium absolute left-1/2 -translate-x-1/2">

            {navLinks.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                onClick={
                  l.to === "/about"
                    ? handleAboutClick
                    : undefined
                }
              >
                {l.label}
              </NavLink>
            ))}

            {roleLink && (
              <NavLink to={roleLink.to}>
                {roleLink.label}
              </NavLink>
            )}

          </nav>

          {/* ==================================
              DESKTOP RIGHT SIDE
          ================================== */}

          <div className="hidden md:flex items-center gap-3 ml-auto justify-end">

            {user ? (

              <div className="flex items-center gap-3">

                {/* USER NAME */}

                <span className="text-sm text-white">
                  Hi,{" "}
                  {user.full_name
                    ? user.full_name.split(" ")[0]
                    : "there"}
                </span>

                {/* LOGOUT */}

                <button
                  type="button"
                  onClick={handleLogout}
                  className="border border-white/30 text-white px-4 py-1.5 rounded-lg font-semibold text-sm transition-all duration-300 hover:bg-white hover:text-black hover:border-white"
                >
                  Logout
                </button>

              </div>

            ) : (

              <div className="flex items-center gap-3">

                {/* LOGIN */}

                <button
                  type="button"
                  onClick={() =>
                    startAuthTransition(
                      "/login"
                    )
                  }
                  className="vc-login-link text-white"
                >
                  Login
                </button>

                {/* SIGN UP */}

                <button
                  type="button"
                  onClick={() =>
                    startAuthTransition(
                      "/register"
                    )
                  }
                  className="vc-apply-now"
                >
                  Sign Up
                </button>

              </div>

            )}

          </div>

          {/* ==================================
              MOBILE MENU BUTTON
          ================================== */}

          <button
            type="button"
            className="md:hidden relative w-8 h-8 flex flex-col items-center justify-center gap-1.5 ml-auto"
            onClick={() =>
              setOpen(!open)
            }
            aria-label="Toggle menu"
          >

            <motion.span
              animate={{
                rotate: open ? 45 : 0,
                y: open ? 6 : 0,
              }}
              className="block w-6 h-0.5 bg-white rounded"
            />

            <motion.span
              animate={{
                opacity: open ? 0 : 1,
              }}
              className="block w-6 h-0.5 bg-white rounded"
            />

            <motion.span
              animate={{
                rotate: open ? -45 : 0,
                y: open ? -6 : 0,
              }}
              className="block w-6 h-0.5 bg-white rounded"
            />

          </button>

        </div>

        {/* ==================================
            MOBILE MENU
        ================================== */}

        <AnimatePresence>
          {open && (

            <motion.div
              initial={{
                height: 0,
                opacity: 0,
              }}
              animate={{
                height: "auto",
                opacity: 1,
              }}
              exit={{
                height: 0,
                opacity: 0,
              }}
              transition={{
                duration: 0.25,
                ease: "easeInOut",
              }}
              className="md:hidden overflow-hidden bg-black border-t border-white/10"
            >

              <div className="px-5 pb-4 flex flex-col gap-3 pt-3 text-white font-medium">

                {/* MOBILE NAV LINKS */}

                {navLinks.map((l) => (

                  <Link
                    key={l.to}
                    to={l.to}
                    onClick={
                      l.to === "/about"
                        ? handleAboutClick
                        : () =>
                            setOpen(false)
                    }
                    className="text-white hover:text-white transition-colors"
                  >
                    {l.label}
                  </Link>

                ))}

                {/* ROLE LINK */}

                {roleLink && (

                  <Link
                    to={roleLink.to}
                    onClick={() =>
                      setOpen(false)
                    }
                    className="text-white hover:text-white transition-colors"
                  >
                    {roleLink.label}
                  </Link>

                )}

                {/* AUTH */}

                {user ? (

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="text-left text-white font-semibold"
                  >
                    Logout
                  </button>

                ) : (

                  <>

                    {/* MOBILE LOGIN */}

                    <button
                      type="button"
                      onClick={() =>
                        startAuthTransition(
                          "/login"
                        )
                      }
                      className="text-left text-white"
                    >
                      Login
                    </button>

                    {/* MOBILE SIGN UP */}

                    <button
                      type="button"
                      onClick={() =>
                        startAuthTransition(
                          "/register"
                        )
                      }
                      className="text-left text-white font-semibold"
                    >
                      Sign Up
                    </button>

                  </>

                )}

              </div>

            </motion.div>

          )}
        </AnimatePresence>

        {/* ==================================
            GLOBE AUTH TRANSITION
        ================================== */}

        {authTransition && (

          <AuthTransition
            target={authTransition}
            onComplete={
              completeAuthTransition
            }
            onBack={
              closeAuthTransition
            }
          />

        )}

      </header>
    </>
  );
}