import React, { useEffect } from "react";
import {
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

import {
  AnimatePresence,
  motion,
} from "framer-motion";

import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import Gate from "./components/Gate.jsx";

import Home from "./pages/SpaceHome.jsx";
import Venues from "./pages/Venues.jsx";
import VenueDetail from "./pages/VenueDetail.jsx";
import VenueExperiencePage from "./pages/VenueExperiencePage.jsx";
import Services from "./pages/Services.jsx";
import ProfessionalDetail from "./pages/ProfessionalDetail.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";
import CustomerDashboard from "./pages/CustomerDashboard.jsx";
import VendorDashboard from "./pages/VendorDashboard.jsx";
import About from "./pages/About.jsx";

import { useAuth } from "./context/AuthContext.jsx";


function PageFade({ children }) {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{
          opacity: 0,
          y: 12,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        exit={{
          opacity: 0,
          y: -8,
        }}
        transition={{
          duration: 0.35,
          ease: "easeOut",
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}


function RequireAuth({
  children,
  role,
}) {
  const {
    user,
    loading,
  } = useAuth();

  if (loading) {
    return (
      <p className="text-center py-24 text-gray-400">
        Loading…
      </p>
    );
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  if (
    role &&
    user.role !== role
  ) {
    return (
      <Navigate
        to="/"
        replace
      />
    );
  }

  return children;
}


export default function App() {
  const location =
    useLocation();

  const isAuthRoute =
    location.pathname === "/login" ||
    location.pathname === "/register" ||
    location.pathname === "/forgot-password" ||
    location.pathname === "/reset-password";
  const isVenueExperienceRoute = location.pathname.endsWith("/experience");


  /*
   =========================================================
   WHEN RETURNING TO HOME, ALWAYS GO TO THE TOP
   =========================================================
   */

  useEffect(() => {
    if (
      location.pathname === "/"
    ) {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: "auto",
      });
    }
  }, [location.pathname]);


  return (
    <div
      className="
        min-h-screen
        flex
        flex-col
        relative
      "
    >

      {/* =================================================
          NAVBAR
          ================================================= */}

      {!isAuthRoute && !isVenueExperienceRoute && (
        <Navbar />
      )}


      {/* =================================================
          MAIN CONTENT
          ================================================= */}

      <main
        className="
          flex-1
          relative
        "
      >

        <PageFade>

          <Routes
            location={location}
            key={
              location.pathname
            }
          >

            {/* =================================================
                ORIGINAL FIRST PAGE
                ================================================= */}

            <Route
              path="/"
              element={
                <Home />
              }
            />


            {/* =================================================
                VENUES
                ================================================= */}

            <Route
              path="/venues"
              element={
                <Venues />
              }
            />


            {/* =================================================
                VENUE DETAIL
                ================================================= */}

            <Route
              path="/venues/:id"
              element={
                <VenueDetail />
              }
            />

            <Route
              path="/venues/:id/experience"
              element={
                <VenueExperiencePage />
              }
            />


            {/* =================================================
                SERVICES
                ================================================= */}

            <Route
              path="/services"
              element={
                <Services />
              }
            />


            {/* =================================================
                PROFESSIONAL DETAIL
                Public profile of a single professional
                (photographer / caterer / musician / decorator)
                ================================================= */}

            <Route
              path="/professionals/:id"
              element={
                <ProfessionalDetail />
              }
            />


            {/* =================================================
                ABOUT
                ================================================= */}

            <Route
              path="/about"
              element={
                <About />
              }
            />


            {/* =================================================
                LOGIN
                ================================================= */}

            <Route
              path="/login"
              element={
                <Login />
              }
            />


            {/* =================================================
                REGISTER
                ================================================= */}

            <Route
              path="/register"
              element={
                <Register />
              }
            />


            {/* =================================================
                FORGOT PASSWORD
                ================================================= */}

            <Route
              path="/forgot-password"
              element={
                <ForgotPassword />
              }
            />

            <Route
              path="/reset-password"
              element={
                <ResetPassword />
              }
            />


            {/* =================================================
                CUSTOMER DASHBOARD
                ================================================= */}

            <Route
              path="/my-bookings"
              element={
                <RequireAuth
                  role="customer"
                >
                  <CustomerDashboard />
                </RequireAuth>
              }
            />


            {/* =================================================
                VENDOR DASHBOARD
                ================================================= */}

            <Route
              path="/vendor/dashboard"
              element={
                <RequireAuth
                  role="vendor"
                >
                  <VendorDashboard />
                </RequireAuth>
              }
            />


            {/* =================================================
                UNKNOWN ROUTES
                ================================================= */}

            <Route
              path="*"
              element={
                <Navigate
                  to="/"
                  replace
                />
              }
            />

          </Routes>

        </PageFade>

      </main>


      {/* =================================================
          FOOTER
          ================================================= */}

      {!isAuthRoute && !isVenueExperienceRoute && (
        <Footer />
      )}

    </div>
  );
}
