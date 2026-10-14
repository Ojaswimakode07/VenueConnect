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

// Development-only demo accounts. These accounts must exist in your backend database.
// The button only fills the login form; it does not bypass backend authentication.
const DEMO_ACCOUNTS = {
  customer: { email: "demo.customer@gmail.com", password: "Demo@12345" },
  owner: { email: "demo.owner@gmail.com", password: "Demo@12345" },
  catering: { email: "demo.caterer@gmail.com", password: "Demo@12345" },
  photographer: { email: "demo.photographer@gmail.com", password: "Demo@12345" },
  music: { email: "demo.musician@gmail.com", password: "Demo@12345" },
  decor: { email: "demo.decorator@gmail.com", password: "Demo@12345" },
};

// Convert backend errors into text so React never tries to render an object
// directly inside the <p> error message element.
function getErrorMessage(error, fallback) {
  const detail = error?.response?.data?.detail;

  if (typeof detail === "string") {
    return detail;
  }

  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (typeof item === "string") return item;
        return item?.msg || item?.message || JSON.stringify(item);
      })
      .join("; ");
  }

  if (detail && typeof detail === "object") {
    return detail.message || detail.msg || JSON.stringify(detail);
  }

  return fallback;
}

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
  const { requestLoginOTP, verifyLoginOTP, verifySignupOTP, register } = useAuth();
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
  const [signupOTPRequested, setSignupOTPRequested] = useState(false);
  const [loginOTP, setLoginOTP] = useState("");
  const [resetOTP, setResetOTP] = useState("");
  const [resetOTPVerified, setResetOTPVerified] = useState(false);
  const [resetPassword, setResetPassword] = useState("");
  const [resetPasswordConfirm, setResetPasswordConfirm] = useState("");
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

    // Return to the profile-selection screen when the parent provides
    // the profile-change callback. This allows the user to correct
    // a mistakenly selected profile before logging in.
    if (onChangeProfile) {
      changeProfile();
      return;
    }

    // Fallback for places where AuthExperience is used without
    // a profile-selection parent.
    navigate("/", { replace: true });
  }

  function changeProfile() {
    setError("");
    setSignupStep(1);
    setScreen("auth");
    onChangeProfile?.();
  }

  async function useDemoAccount() {
    if (!profile || !DEMO_ACCOUNTS[profile]) {
      setError("Please select a profile before using a demo account.");
      return;
    }

    const demoAccount = DEMO_ACCOUNTS[profile];

    setForm((current) => ({
      ...current,
      email: demoAccount.email,
      password: demoAccount.password,
      confirm: demoAccount.password,
    }));
    setMode("login");
    setScreen("auth");
    setShowPassword(false);
    setError("");
    setLoading(true);

    try {
      const result = await requestLoginOTP(
        demoAccount.email,
        demoAccount.password,
        profile
      );
      if (!result.otpRequired && result.user) {
        window.location.assign(result.user.role === "vendor" ? "/vendor/dashboard" : "/venues");
        return;
      }
      setLoginOTP("");
      setLoginOTPRequested(true);
    } catch (err) {
      if (mode === "signup" && err?.response?.status === 503) {
        setSignupOTPRequested(true);
      }
      setError(
        getErrorMessage(
          err,
          "Demo login failed. Please check the demo account."
        )
      );
    } finally {
      setLoading(false);
    }
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

    // A profile must be selected before login or registration.
    if (!profile) {
      setError("Please select a profile before continuing.");
      return;
    }

    setLoading(true);

    try {
      if (mode === "signup") {
        await register({
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

        setLoginOTP("");
        setSignupOTPRequested(true);
      } else {
        const result = await requestLoginOTP(form.email, form.password, profile);
        if (!result.otpRequired && result.user) {
          window.location.assign(result.user.role === "vendor" ? "/vendor/dashboard" : "/venues");
        } else {
          setLoginOTP("");
          setLoginOTPRequested(true);
        }
      }
    } catch (err) {
      if (mode === "signup" && err?.response?.status === 503) {
        // The account was persisted before email delivery failed. Keep the
        // user on the verification step so they can resend after SMTP is fixed.
        setSignupOTPRequested(true);
      }
      setError(
        getErrorMessage(
          err,
          mode === "signup"
            ? "Could not create your account."
            : "Login failed. Please check your credentials."
        )
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
      const user = await verifyLoginOTP(form.email, loginOTP, profile);
      window.location.assign(user.role === "vendor" ? "/vendor/dashboard" : "/venues");
    } catch (err) {
      setError(getErrorMessage(err, "The verification code is invalid or expired."));
    } finally {
      setLoading(false);
    }
  }

  async function submitSignupOTP(event) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await verifySignupOTP(form.email, loginOTP);
      window.location.assign(user.role === "vendor" ? "/vendor/dashboard" : "/venues");
    } catch (err) {
      setError(getErrorMessage(err, "The verification code is invalid or expired."));
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
      setResetOTP("");
      setResetOTPVerified(false);
      setForgotSent(true);
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          "Could not send a reset code. Please check your email settings and try again."
        )
      );
    } finally {
      setLoading(false);
    }
  }

  async function verifyResetOTP(event) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/auth/verify-reset-otp", { email: forgotEmail, otp: resetOTP });
      setResetOTPVerified(true);
    } catch (err) {
      setError(getErrorMessage(err, "The verification code is invalid or expired."));
    } finally {
      setLoading(false);
    }
  }

  async function submitNewPassword(event) {
    event.preventDefault();
    setError("");
    if (resetPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (resetPassword !== resetPasswordConfirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      await api.post("/auth/reset-password", {
        email: forgotEmail,
        otp: resetOTP,
        new_password: resetPassword,
      });
      setForgotSent(true);
    } catch (err) {
      setError(getErrorMessage(err, "Could not reset the password. Request a new code and try again."));
    } finally {
      setLoading(false);
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
          Reset
          <br />
          your password
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

        .auth-exp__demo-button {
          width: 100%;
          min-height: 40px;
          margin-top: 10px;
          padding: 0 14px;
          border: 1px dashed rgba(80,189,240,0.45);
          border-radius: 9px;
          background: rgba(80,189,240,0.06);
          color: #79d3ff;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          cursor: pointer;
          transition: background .2s ease, border-color .2s ease, color .2s ease;
        }

        .auth-exp__demo-button:hover:not(:disabled) {
          background: rgba(80,189,240,0.12);
          border-color: rgba(80,189,240,0.75);
          color: #b9ebff;
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

        /* RESET PAGE FINAL FIX — compact buttons + no page scrollbar */
        html,
        body,
        #root {
          overflow: hidden !important;
        }

        .auth-exp {
          height: 100dvh !important;
          min-height: 100dvh !important;
          max-height: 100dvh !important;
          overflow: hidden !important;
        }

        .auth-exp .actions .btn-primary,
        .auth-exp .actions .btn-secondary {
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          flex: 0 0 auto !important;
          width: auto !important;
          min-width: 150px !important;
          max-width: 150px !important;
          height: 42px !important;
          min-height: 42px !important;
          max-height: 42px !important;
          padding: 0 16px !important;
          margin: 0 !important;
          white-space: nowrap !important;
          word-break: keep-all !important;
          overflow: hidden !important;
          line-height: 1 !important;
          font-size: 10px !important;
          letter-spacing: 0.07em !important;
        }

        .auth-exp .actions .btn-primary {
          background: #229ed5 !important;
        }

        .auth-exp .actions .btn-secondary {
          background: rgba(255,255,255,0.05) !important;
        }

        /* The confirmation screen has a full-width inline style; override it here. */
        .auth-exp .auth-exp__success .btn-secondary {
          width: 150px !important;
          min-width: 150px !important;
          max-width: 150px !important;
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

        /* FINAL FIX: remove every decorative blue line and make reset buttons compact */
        .auth-exp .auth-exp__panel::before,
        .auth-exp .auth-exp__panel::after,
        .auth-exp .pitch::before,
        .auth-exp .pitch::after,
        .auth-exp .avatar::before,
        .auth-exp .avatar::after,
        .auth-exp::before,
        .auth-exp::after {
          content: none !important;
          display: none !important;
          width: 0 !important;
          height: 0 !important;
          border: 0 !important;
          box-shadow: none !important;
          background: transparent !important;
        }

        .auth-exp__panel {
          border-left: 0 !important;
        }

        .auth-exp .actions {
          display: flex !important;
          flex-direction: row !important;
          align-items: center !important;
          gap: 10px !important;
          flex-wrap: nowrap !important;
        }

        .auth-exp .actions .btn-primary,
        .auth-exp .actions .btn-secondary {
          flex: 0 0 auto !important;
          width: auto !important;
          min-width: 0 !important;
          height: 42px !important;
          min-height: 42px !important;
          max-height: 42px !important;
          padding: 0 16px !important;
          margin: 0 !important;
          border-radius: 8px !important;
          white-space: nowrap !important;
          overflow: hidden !important;
          line-height: 1 !important;
          font-size: 9px !important;
          letter-spacing: 0.07em !important;
          box-sizing: border-box !important;
        }

        .auth-exp .actions .btn-primary {
          width: auto !important;
        }

        .auth-exp .actions .btn-secondary {
          width: auto !important;
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

                  {(mode === "login" && loginOTPRequested) || (mode === "signup" && signupOTPRequested) ? (
                    <form onSubmit={mode === "signup" ? submitSignupOTP : submitLoginOTP} style={{ display: "flex", flexDirection: "column", gap: 13 }}>
                      <p className="lede">Enter the 6-digit code sent to {form.email}.</p>
                      <Field label="Email verification code" value={loginOTP} onChange={setLoginOTP} required autoFocus placeholder="000000" />
                      <div className="actions">
                        <button className="btn-primary" type="submit" disabled={loading || loginOTP.length !== 6}>{loading ? "Verifying…" : mode === "signup" ? "Verify email and continue" : "Verify and sign in"}</button>
                        <button className="btn-secondary" type="button" disabled={loading} onClick={async () => { setError(""); setLoading(true); try { if (mode === "signup") await api.post("/auth/resend-signup-otp", { email: form.email }); else await requestLoginOTP(form.email, form.password, profile); setLoginOTP(""); } catch (err) { setError(getErrorMessage(err, "Could not send a new code.")); } finally { setLoading(false); } }}>Resend code</button>
                        <button className="btn-secondary" type="button" onClick={() => { setLoginOTPRequested(false); setSignupOTPRequested(false); setLoginOTP(""); setError(""); }}>Back</button>
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
                      <>
                        <div className="actions" style={{ justifyContent: "center" }}>
                          <button className="btn-primary" type="submit" disabled={loading} style={{ margin: "0 auto" }}>
                            {loading ? "Signing in…" : "Log in"}
                          </button>
                        </div>

                        <button
                          type="button"
                          className="auth-exp__demo-button"
                          onClick={useDemoAccount}
                          disabled={loading || !profile}
                        >
                          Use Demo Account — {selected?.label || "Select profile"}
                        </button>
                      </>
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

                  {forgotSent && resetOTPVerified && resetPassword ? (
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
                          Password updated
                        </div>
                        <div
                          style={{
                            color: "rgba(223,239,250,0.78)",
                            fontSize: 12,
                            lineHeight: 1.7,
                          }}
                        >
                          Your password has been reset. You can now sign in with the new password.
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
                  ) : resetOTPVerified ? (
                    <form onSubmit={submitNewPassword} style={{ display: "flex", flexDirection: "column", gap: 13 }}>
                      <Field label="New password" type="password" value={resetPassword} onChange={setResetPassword} required autoFocus placeholder="At least 8 characters" />
                      <Field label="Confirm new password" type="password" value={resetPasswordConfirm} onChange={setResetPasswordConfirm} required placeholder="Repeat your new password" />
                      <div className="actions"><button className="btn-primary" type="submit" disabled={loading}>{loading ? "Saving…" : "Reset password"}</button></div>
                    </form>
                  ) : forgotSent ? (
                    <form onSubmit={verifyResetOTP} style={{ display: "flex", flexDirection: "column", gap: 13 }}>
                      <p className="lede">If an account exists for {forgotEmail}, a reset code has been sent. Enter it below.</p>
                      <Field label="Password reset code" value={resetOTP} onChange={setResetOTP} required autoFocus placeholder="000000" />
                      <div className="actions"><button className="btn-primary" type="submit" disabled={loading || resetOTP.length !== 6}>{loading ? "Verifying…" : "Verify code"}</button></div>
                    </form>
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
                          {loading ? "Sending…" : "Send reset code"}
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
