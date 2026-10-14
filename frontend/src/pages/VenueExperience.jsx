import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../api/axios.js";
import "./auth-experience.css";

// ===========================================================
// Profiles are selected on the cinematic onboarding screen.
// AuthExperience only handles the actual login/signup form.
// ===========================================================
const PROFILES = [
  { key: "customer", label: "Customer", detail: "Plan and book your event", icon: "✦" },
  { key: "owner", label: "Venue Owner", detail: "Manage your venue", icon: "⌂" },
  { key: "catering", label: "Caterer", detail: "Offer your menus", icon: "♨" },
  { key: "photographer", label: "Photographer", detail: "Show your work", icon: "◉" },
  { key: "music", label: "Musician", detail: "Bring the celebration alive", icon: "♫" },
  { key: "decor", label: "Decorator", detail: "Create memorable spaces", icon: "✳" },
];

const SERVICE_PROFILES = new Set(["catering", "photographer", "music", "decor"]);

const fade = {
  initial: { opacity: 0, y: 20, scale: 0.985 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -14, scale: 0.985 },
  transition: { duration: 0.42, ease: [0.16, 1, 0.3, 1] },
};

function Field({ label, type = "text", value, onChange, required, autoFocus, placeholder }) {
  return (
    <label className="auth-exp__field">
      {label}
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        autoFocus={autoFocus}
        placeholder={placeholder}
      />
    </label>
  );
}

export default function AuthExperience({
  initialMode = "login",
  initialScreen = "auth",
  initialProfile = "",
  onChangeProfile,
}) {
  const { requestLoginOTP, verifyLoginOTP, register } = useAuth();
  const navigate = useNavigate();

  const [screen, setScreen] = useState(initialScreen);
  const [mode, setMode] = useState(initialMode);

  const normalizedInitialProfile =
    PROFILES.find(
      (item) =>
        item.key === initialProfile ||
        item.label.toLowerCase() === String(initialProfile || "").toLowerCase()
    )?.key || "";

  const [profile, setProfile] = useState(normalizedInitialProfile);

  useEffect(() => {
    setProfile(normalizedInitialProfile);
  }, [initialProfile, normalizedInitialProfile]);

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    password: "",
    confirm: "",
    business_name: "",
    city: "",
    bio: "",
  });

  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);
  const [loginOTPRequested, setLoginOTPRequested] = useState(false);
  const [loginOTP, setLoginOTP] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [signupStep, setSignupStep] = useState(1);

  const selected = PROFILES.find((item) => item.key === profile);
  const isService = SERVICE_PROFILES.has(profile);

  const update = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  function goBack() {
    setError("");

    if (screen === "forgot") {
      setScreen("auth");
      setMode("login");
      return;
    }

    // Login/signup Back always returns to the real first page.
    navigate("/", { replace: true });
  }

  function changeProfile() {
    setError("");
    setSignupStep(1);
    setScreen("auth");
    onChangeProfile?.();
  }

  function switchMode(nextMode) {
    setError("");
    setMode(nextMode);
    if (nextMode === "signup") setSignupStep(1);
  }

  const totalSignupSteps = isService ? 3 : 2;

  function nextSignupStep() {
    setError("");

    if (signupStep === 1) {
      if (!form.full_name.trim()) {
        setError("Please enter your full name.");
        return;
      }
      if (!form.phone.trim()) {
        setError("Please enter your phone number.");
        return;
      }
    }

    if (signupStep === 2 && isService) {
      if (!form.business_name.trim()) {
        setError("Please enter your business or studio name.");
        return;
      }
      if (!form.city.trim()) {
        setError("Please enter the city you operate in.");
        return;
      }
    }

    setSignupStep((step) => Math.min(totalSignupSteps, step + 1));
  }

  function previousSignupStep() {
    setError("");
    setSignupStep((step) => Math.max(1, step - 1));
  }

  async function submit(event) {
    event.preventDefault();
    setError("");

    if (mode === "signup" && form.password !== form.confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      if (mode === "signup") {
        const user = await register({
          full_name: form.full_name,
          email: form.email,
          phone: form.phone,
          password: form.password,
          role: profile === "customer" ? "customer" : "vendor",
          vendor_type: profile === "owner" ? "venue" : profile,
          business_name: isService ? form.business_name : undefined,
          city: isService ? form.city : undefined,
          bio: isService ? form.bio : undefined,
        });

        if (user.role === "vendor") {
          window.location.assign("/vendor/dashboard");
        } else {
          window.location.assign("/");
        }
      } else {
        const result = await requestLoginOTP(form.email, form.password, profile || "customer");
        if (!result.otpRequired && result.user) {
          window.location.assign(result.user.role === "vendor" ? "/vendor/dashboard" : "/venues");
        } else {
          setLoginOTP("");
          setLoginOTPRequested(true);
        }
      }
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
          (mode === "signup"
            ? "Could not create your account."
            : "Login failed. Please check your credentials.")
      );
    } finally {
      setLoading(false);
    }
  }

  async function submitLoginOTP(event) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await verifyLoginOTP(form.email, loginOTP, profile || "customer");
      window.location.assign(user.role === "vendor" ? "/vendor/dashboard" : "/venues");
    } catch (err) {
      setError(err?.response?.data?.detail || "The verification code is invalid or expired.");
    } finally {
      setLoading(false);
    }
  }

  async function submitForgot(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await api.post("/auth/forgot-password", { email: forgotEmail });
    } catch {
      // Intentionally quiet so the response never reveals whether an account exists.
    } finally {
      setLoading(false);
      setForgotSent(true);
    }
  }

  const pitchCopy = {
    auth: {
      heading:
        mode === "signup" ? (
          <>
            Let&apos;s set up
            <br />
            your account
          </>
        ) : (
          <>
            Welcome back
            <br />
            to VenueConnect
          </>
        ),
      lede:
        mode === "signup"
          ? "A few details and you&apos;re in — you can always fine-tune your profile later."
          : "Sign in to pick up right where you left off.",
    },
    forgot: {
      heading: (
        <>
          Reset your
          <br />
          password
        </>
      ),
      lede: "Enter the email on your account and we&apos;ll send you a reset link.",
    },
  }[screen];

  return (
    <div className="auth-exp">
      <style>{`
        .auth-exp {
          min-height: 100dvh;
          position: relative;
          overflow: hidden;
          background: #000 !important;
          color: #fff;
        }

        .auth-exp .stage {
          width: 100%;
          min-height: 100dvh;
          display: flex;
          align-items: center;
          position: relative;
          z-index: 1;
        }

        .auth-exp .layout {
          width: min(1120px, calc(100vw - 96px));
          margin: 0 auto;
          display: grid;
          grid-template-columns: minmax(0, 1fr) 400px;
          gap: 92px;
          align-items: center;
        }

        .auth-exp .pitch {
          max-width: 560px;
          padding: 0;
        }

        .auth-exp .pitch h1 {
          margin: 0;
          max-width: 520px;
          font-family: Georgia, "Times New Roman", serif;
          font-size: clamp(54px, 6vw, 76px);
          line-height: 0.96;
          font-weight: 400;
          letter-spacing: -0.05em;
          color: #fff;
        }

        .auth-exp .pitch h1 br {
          display: none;
        }

        .auth-exp .pitch .lede {
          max-width: 410px;
          margin-top: 22px;
          color: rgba(205, 215, 226, 0.62);
          font-size: 14px;
          line-height: 1.7;
        }

        .auth-exp__profile-chip {
          width: fit-content;
          margin-top: 26px;
          padding: 7px 8px 7px 7px;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 999px;
          background: rgba(255,255,255,0.035);
          color: rgba(220, 230, 240, 0.68);
          font-size: 11px;
          backdrop-filter: blur(12px);
          transition: border-color .2s ease, background .2s ease;
        }

        .auth-exp__profile-chip:hover {
          border-color: rgba(47,179,239,0.32);
          background: rgba(255,255,255,0.05);
        }

        .auth-exp__profile-chip .icon {
          width: 28px;
          height: 28px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          background: #1595d0;
          color: #fff;
          font-size: 11px;
          box-shadow: 0 0 20px rgba(21,149,208,0.22);
        }

        .auth-exp__profile-chip strong {
          color: #fff;
          font-weight: 700;
        }

        .auth-exp__profile-chip button {
          margin-left: 2px;
          padding: 3px 5px;
          border: 0;
          background: transparent;
          color: #44baf0;
          font: inherit;
          font-weight: 800;
          cursor: pointer;
        }

        .auth-exp__profile-chip button:hover {
          color: #a4e5ff;
        }

        .auth-exp__panel {
          position: relative;
          padding: 30px 0 30px 34px;
          border-left: 1px solid rgba(255,255,255,0.12);
          background: transparent;
        }

        .auth-exp__eyebrow {
          margin: 0 0 22px;
          color: #50bdf0;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 0.22em;
          text-transform: uppercase;
        }

        .auth-exp .auth-exp__field {
          color: rgba(228,235,242,0.72);
          font-size: 11px;
          font-weight: 700;
        }

        .auth-exp .auth-exp__field input,
        .auth-exp .auth-exp__field textarea {
          margin-top: 7px;
          border: 1px solid rgba(255,255,255,0.13);
          border-radius: 10px;
          background: rgba(255,255,255,0.035);
          color: #fff;
          transition: border-color .2s ease, background .2s ease, box-shadow .2s ease;
        }

        .auth-exp .auth-exp__field input {
          height: 52px;
        }

        .auth-exp .auth-exp__field textarea {
          min-height: 105px;
        }

        .auth-exp .auth-exp__field input::placeholder,
        .auth-exp .auth-exp__field textarea::placeholder {
          color: rgba(190,201,212,0.25);
        }

        .auth-exp .auth-exp__field input:focus,
        .auth-exp .auth-exp__field textarea:focus {
          border-color: rgba(53,184,240,0.72);
          background: rgba(255,255,255,0.05);
          box-shadow: 0 0 0 3px rgba(53,184,240,0.08);
          outline: none;
        }

        .auth-exp__password-row {
          margin-top: 7px;
          border: 1px solid rgba(255,255,255,0.13);
          border-radius: 10px;
          background: rgba(255,255,255,0.035);
          display: flex;
          align-items: center;
          overflow: hidden;
          transition: border-color .2s ease, background .2s ease, box-shadow .2s ease;
        }

        .auth-exp__password-row:focus-within {
          border-color: rgba(53,184,240,0.72);
          background: rgba(255,255,255,0.05);
          box-shadow: 0 0 0 3px rgba(53,184,240,0.08);
        }

        .auth-exp__password-row input {
          flex: 1;
          margin: 0 !important;
          border: 0 !important;
          background: transparent !important;
          box-shadow: none !important;
          height: 52px;
        }

        .auth-exp__password-toggle {
          margin-right: 11px;
          border: 0;
          background: transparent;
          color: rgba(205,216,228,0.48);
          font-size: 10px;
          font-weight: 800;
          cursor: pointer;
        }

        .auth-exp__password-toggle:hover {
          color: #61c8f5;
        }

        .auth-exp__forgot {
          align-self: flex-end;
          margin-top: -1px;
          border: 0;
          background: transparent;
          color: rgba(197,209,224,0.48);
          font-size: 10px;
          cursor: pointer;
        }

        .auth-exp__forgot:hover {
          color: #62c7fb;
        }

        .auth-exp__error {
          margin: 4px 0 0;
          padding: 9px 11px;
          border: 1px solid rgba(255,94,94,0.24);
          border-radius: 9px;
          background: rgba(255,94,94,0.07);
          color: #ffbaba;
          font-size: 10px;
          line-height: 1.5;
        }

        .auth-exp .actions {
          margin-top: 2px;
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .auth-exp .btn-primary {
          width: auto;
          min-height: 42px;
          padding: 0 20px;
          border-radius: 9px;
          border: 1px solid rgba(115,208,249,0.22);
          background: #229ed5;
          color: #fff;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          box-shadow: 0 8px 20px rgba(20,133,185,0.16);
          cursor: pointer;
          transition: transform .2s ease, box-shadow .2s ease, background .2s ease;
        }

        .auth-exp .btn-primary:hover:not(:disabled) {
          transform: translateY(-1px);
          background: #2eaedf;
          box-shadow: 0 11px 25px rgba(20,133,185,0.24);
        }

        .auth-exp .btn-secondary {
          width: auto;
          min-height: 42px;
          padding: 0 18px;
          margin-top: 0;
          border: 1px solid rgba(255,255,255,0.10);
          border-radius: 9px;
          background: rgba(255,255,255,0.03);
          color: rgba(230,238,246,0.7);
          cursor: pointer;
          transition: background .2s ease, border-color .2s ease, color .2s ease;
        }

        .auth-exp .btn-secondary:hover {
          background: rgba(255,255,255,0.07);
          border-color: rgba(255,255,255,0.18);
          color: #fff;
        }

        .auth-exp__switch {
          margin: 16px 0 0;
          color: rgba(199,210,223,0.46);
          font-size: 10px;
          text-align: center;
        }

        .auth-exp__switch button {
          border: 0;
          background: transparent;
          color: #47baf0;
          font: inherit;
          font-weight: 800;
          cursor: pointer;
        }

        .auth-exp__switch button:hover {
          color: #a1e0ff;
        }

        .auth-exp__success {
          padding: 16px;
          border: 1px solid rgba(70,188,243,0.19);
          border-radius: 10px;
          background: rgba(70,188,243,0.06);
          color: rgba(223,239,250,0.78);
          line-height: 1.6;
          font-size: 11px;
        }

        @media (max-width: 900px) {

          .auth-exp .stage {
            align-items: flex-start;
          }

          .auth-exp .layout {
            width: min(640px, calc(100vw - 40px));
            padding: 105px 0 42px;
            grid-template-columns: 1fr;
            gap: 34px;
          }

          .auth-exp .pitch h1 {
            font-size: clamp(48px, 10vw, 68px);
          }

          .auth-exp__panel {
            padding-left: 24px;
          }
        }

        @media (max-width: 540px) {
          .auth-exp .layout {
            width: min(100% - 24px, 500px);
            padding-top: 88px;
          }

          .auth-exp .pitch h1 {
            font-size: 44px;
          }

          .auth-exp__panel {
            padding-left: 18px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .auth-exp * {
            animation-duration: 0.01ms !important;
            transition-duration: 0.01ms !important;
          }
        }
        /* FINAL VISUAL OVERRIDES — only removes decorative lines, reduces crowding, and compacts buttons */
        .auth-exp::before,
        .auth-exp::after,
        .auth-exp .pitch::before,
        .auth-exp .pitch::after,
        .auth-exp .avatar::before,
        .auth-exp .avatar::after,
        .auth-exp__panel::before,
        .auth-exp__panel::after {
          content: none !important;
          display: none !important;
          background: none !important;
          border: 0 !important;
        }

        .auth-exp .layout {
          grid-template-columns: minmax(0, 500px) minmax(360px, 420px) !important;
          gap: 120px !important;
        }

        .auth-exp .pitch {
          max-width: 500px !important;
        }

        .auth-exp .pitch h1 {
          max-width: 500px !important;
          font-size: clamp(52px, 5.2vw, 68px) !important;
          line-height: 0.98 !important;
          letter-spacing: -0.045em !important;
        }

        .auth-exp .pitch .lede {
          max-width: 390px !important;
          margin-top: 18px !important;
          line-height: 1.6 !important;
        }

        .auth-exp__panel {
          border-left: 0 !important;
          padding-left: 0 !important;
          padding-right: 0 !important;
        }

        .auth-exp .actions {
          gap: 10px !important;
          align-items: center !important;
        }

        .auth-exp .btn-primary,
        .auth-exp .btn-secondary {
          width: auto !important;
          min-width: 0 !important;
          min-height: 38px !important;
          height: 38px !important;
          padding: 0 15px !important;
          margin-top: 0 !important;
          border-radius: 8px !important;
          white-space: nowrap !important;
          font-size: 10px !important;
          letter-spacing: 0.08em !important;
        }

        .auth-exp .btn-primary {
          box-shadow: 0 6px 16px rgba(20,133,185,0.14) !important;
        }

        .auth-exp .btn-secondary {
          box-shadow: none !important;
        }

        @media (max-width: 900px) {
          .auth-exp .layout {
            grid-template-columns: 1fr !important;
            gap: 42px !important;
          }

          .auth-exp .pitch {
            max-width: 100% !important;
          }
        }
      `}</style>

      <button
        type="button"
        className="auth-exp__back"
        onClick={goBack}
        aria-label="Return to previous screen"
        style={{
          position: "relative",
          zIndex: 50,
          pointerEvents: "auto",
          cursor: "pointer",
        }}
      >
        <span aria-hidden="true">←</span> Back
      </button>

      <div className="stage">
        <div className="layout">
          <div className="pitch">
            <div className="avatar">{selected?.icon || "✦"}</div>
            <h1>{pitchCopy.heading}</h1>
            <p className="lede">{pitchCopy.lede}</p>

            {selected && (
              <div className="auth-exp__profile-chip">
                <span className="icon">{selected.icon}</span>
                <span>
                  Continuing as <strong>{selected.label}</strong>
                </span>
                <button type="button" onClick={changeProfile}>
                  Change profile
                </button>
              </div>
            )}
          </div>

          <div className="auth-exp__panel">
            <AnimatePresence mode="wait">
              {screen === "auth" && (
                <motion.div key="auth" {...fade}>
                  <p className="auth-exp__eyebrow">
                    {mode === "signup" ? "Create your account" : "Sign in to continue"}
                  </p>

                  {mode === "login" && loginOTPRequested ? (
                    <form onSubmit={submitLoginOTP} style={{ display: "flex", flexDirection: "column", gap: 13 }}>
                      <p className="lede">Enter the 6-digit code sent to {form.email}.</p>
                      <Field label="Email verification code" value={loginOTP} onChange={setLoginOTP} required autoFocus placeholder="000000" />
                      {error && <p className="auth-exp__error">{error}</p>}
                      <div className="actions">
                        <button className="btn-primary" type="submit" disabled={loading || loginOTP.length !== 6}>{loading ? "Verifying…" : "Verify and sign in"}</button>
                        <button className="btn-secondary" type="button" onClick={() => setLoginOTPRequested(false)}>Back</button>
                      </div>
                    </form>
                  ) : <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 13 }}>
                    {mode === "signup" && (
                      <>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 8,
                            marginBottom: 2,
                          }}
                        >
                          <span
                            style={{
                              color: "#fff",
                              fontSize: 10,
                              fontWeight: 800,
                              letterSpacing: "0.12em",
                              textTransform: "uppercase",
                            }}
                          >
                            Step {signupStep} of {totalSignupSteps}
                          </span>
                          <span
                            style={{
                              color: "rgba(199,210,223,0.46)",
                              fontSize: 10,
                            }}
                          >
                            {signupStep === 1
                              ? "Personal details"
                              : signupStep === 2 && isService
                                ? "Work details"
                                : "Account details"}
                          </span>
                        </div>
{signupStep === 1 && (
                          <>
                            <Field
                              label="Full name"
                              value={form.full_name}
                              onChange={(v) => update("full_name", v)}
                              required
                              autoFocus
                            />
                            <Field
                              label="Phone number"
                              type="tel"
                              value={form.phone}
                              onChange={(v) => update("phone", v)}
                              required
                            />
                          </>
                        )}

                        {signupStep === 2 && isService && (
                          <>
                            <Field
                              label="Business or studio name"
                              value={form.business_name}
                              onChange={(v) => update("business_name", v)}
                              required
                              autoFocus
                            />
                            <Field
                              label="City you operate in"
                              value={form.city}
                              onChange={(v) => update("city", v)}
                              required
                            />
                          </>
                        )}

                        {signupStep === totalSignupSteps && (
                          <>
                            <Field
                              label="Email address"
                              type="email"
                              value={form.email}
                              onChange={(v) => update("email", v)}
                              required
                              autoFocus
                              placeholder="you@example.com"
                            />

                            <label className="auth-exp__field">
                              Password
                              <div className="auth-exp__password-row">
                                <input
                                  type={showPassword ? "text" : "password"}
                                  value={form.password}
                                  onChange={(event) => update("password", event.target.value)}
                                  minLength={6}
                                  required
                                  placeholder="Enter your password"
                                />
                                <button
                                  type="button"
                                  className="auth-exp__password-toggle"
                                  onClick={() => setShowPassword((v) => !v)}
                                >
                                  {showPassword ? "Hide" : "Show"}
                                </button>
                              </div>
                            </label>

                            <Field
                              label="Confirm password"
                              type={showPassword ? "text" : "password"}
                              value={form.confirm}
                              onChange={(v) => update("confirm", v)}
                              required
                              placeholder="Repeat your password"
                            />

                            {isService && (
                              <label className="auth-exp__field">
                                A little about your work
                                <textarea
                                  value={form.bio}
                                  onChange={(event) => update("bio", event.target.value)}
                                  placeholder="Tell people what you offer..."
                                />
                              </label>
                            )}
                          </>
                        )}

                        <div
                          style={{
                            display: "flex",
                            gap: 8,
                            marginTop: 2,
                          }}
                        >
                          {signupStep > 1 && (
                            <button
                              type="button"
                              className="btn-secondary"
                              style={{ marginTop: 0 }}
                              onClick={previousSignupStep}
                            >
                              Previous
                            </button>
                          )}

                          {signupStep < totalSignupSteps ? (
                            <button
                              type="button"
                              className="btn-primary"
                              onClick={nextSignupStep}
                            >
                              Next
                            </button>
                          ) : (
                            <button
                              className="btn-primary"
                              type="submit"
                              disabled={loading}
                            >
                              {loading ? "Creating account…" : "Create account"}
                            </button>
                          )}
                        </div>
                      </>
                    )}

                    {mode === "login" && (
                      <>
                        <Field
                          label="Email address"
                          type="email"
                          value={form.email}
                          onChange={(v) => update("email", v)}
                          required
                          autoFocus
                          placeholder="you@example.com"
                        />

                        <label className="auth-exp__field">
                          Password
                          <div className="auth-exp__password-row">
                            <input
                              type={showPassword ? "text" : "password"}
                              value={form.password}
                              onChange={(event) => update("password", event.target.value)}
                              minLength={6}
                              required
                              placeholder="Enter your password"
                            />
                            <button
                              type="button"
                              className="auth-exp__password-toggle"
                              onClick={() => setShowPassword((v) => !v)}
                            >
                              {showPassword ? "Hide" : "Show"}
                            </button>
                          </div>
                        </label>

                        <button
                          type="button"
                          className="auth-exp__forgot"
                          onClick={() => setScreen("forgot")}
                        >
                          Forgot password?
                        </button>
                      </>
                    )}


                    {error && <p className="auth-exp__error">{error}</p>}

                    {mode === "login" && (
                      <div className="actions">
                        <button className="btn-primary" type="submit" disabled={loading}>
                          {loading ? "Signing in…" : "Log in"}
                        </button>
                      </div>
                    )}

                    <p className="auth-exp__switch">
                      {mode === "signup" ? "Already have an account?" : "New to VenueConnect?"}{" "}
                      <button
                        type="button"
                        onClick={() => switchMode(mode === "signup" ? "login" : "signup")}
                      >
                        {mode === "signup" ? "Log in" : "Sign up"}
                      </button>
                    </p>
                  </form>}
                </motion.div>
              )}

              {screen === "forgot" && (
                <motion.div key="forgot" {...fade}>
                  <p className="auth-exp__eyebrow">Password recovery</p>

                  {forgotSent ? (
                    <div
                      className="auth-exp__success"
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 14,
                        padding: 18,
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontSize: 12,
                            fontWeight: 800,
                            letterSpacing: "0.12em",
                            textTransform: "uppercase",
                            color: "#ffffff",
                            marginBottom: 8,
                          }}
                        >
                          Check your email
                        </div>
                        <div
                          style={{
                            color: "rgba(223,239,250,0.78)",
                            fontSize: 12,
                            lineHeight: 1.7,
                          }}
                        >
                          If an account exists for <strong>{forgotEmail}</strong>, we&apos;ve sent you a password
                          reset link. Open the link in your email to create a new password.
                        </div>
                      </div>

                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => {
                          setForgotSent(false);
                          setScreen("auth");
                          setMode("login");
                        }}
                        style={{ width: "100%" }}
                      >
                        Back to login
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={submitForgot} style={{ display: "flex", flexDirection: "column", gap: 13 }}>
                      <Field
                        label="Email address"
                        type="email"
                        value={forgotEmail}
                        onChange={setForgotEmail}
                        required
                        autoFocus
                        placeholder="you@example.com"
                      />

                      <div className="actions">
                        <button className="btn-primary" type="submit" disabled={loading}>
                          {loading ? "Sending…" : "Send reset link"}
                        </button>
                        <button className="btn-secondary" type="button" onClick={() => setScreen("auth")}>
                          Back to login
                        </button>
                      </div>
                    </form>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
