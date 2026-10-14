import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios.js";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [verified, setVerified] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  function setConfirmPassword(value) {
    setConfirm(value);
  }

  async function submit(event) {
    event.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      await api.post("/auth/reset-password", {
        email,
        otp,
        new_password: password,
      });
      setDone(true);
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
          "This reset link is invalid or has expired. Please request a new one."
      );
    } finally {
      setLoading(false);
    }
  }

  async function sendCode(event) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email });
      setCodeSent(true);
    } catch (err) {
      setError(err?.response?.data?.detail || "Could not request a reset code.");
    } finally { setLoading(false); }
  }

  async function verifyCode(event) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/auth/verify-reset-otp", { email, otp });
      setVerified(true);
    } catch (err) {
      setError(err?.response?.data?.detail || "The verification code is invalid or expired.");
    } finally { setLoading(false); }
  }

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "#000000",
        color: "#ffffff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 24px",
      }}
    >
      <button
        type="button"
        onClick={() => navigate("/login")}
        style={{
          position: "fixed",
          top: 24,
          left: 28,
          zIndex: 20,
          padding: "11px 17px",
          borderRadius: 999,
          border: "1px solid rgba(255,255,255,0.18)",
          background: "transparent",
          color: "#ffffff",
          cursor: "pointer",
          fontSize: 14,
        }}
      >
        ‚Üê Back
      </button>

      <div
        style={{
          width: "100%",
          maxWidth: 480,
          border: "1px solid rgba(255,255,255,0.14)",
          borderRadius: 18,
          background: "#0b0b0b",
          padding: 34,
          boxShadow: "0 24px 80px rgba(0,0,0,0.45)",
        }}
      >
        {done ? (
          <>
            <div
              style={{
                color: "#229ed5",
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                marginBottom: 14,
              }}
            >
              Password updated
            </div>

            <h1
              style={{
                margin: 0,
                fontFamily: "Georgia, serif",
                fontSize: "clamp(42px, 7vw, 58px)",
                lineHeight: 0.98,
                fontWeight: 500,
              }}
            >
              You&apos;re
              <br />
              all set.
            </h1>

            <p
              style={{
                color: "rgba(210,220,230,0.68)",
                fontSize: 13,
                lineHeight: 1.7,
                margin: "18px 0 24px",
              }}
            >
              Your VenueConnect password has been changed successfully.
            </p>

            <button
              type="button"
              onClick={() => navigate("/login", { replace: true })}
              style={{
                width: "100%",
                minHeight: 48,
                border: 0,
                borderRadius: 9,
                background: "#2f80ff",
                color: "#ffffff",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Continue to Login
            </button>
          </>
        ) : (
          <>
            <div
              style={{
                color: "#229ed5",
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                marginBottom: 14,
              }}
            >
              Password recovery
            </div>

            <h1
              style={{
                margin: 0,
                fontFamily: "Georgia, serif",
                fontSize: "clamp(42px, 7vw, 58px)",
                lineHeight: 0.98,
                fontWeight: 500,
              }}
            >
              Create a
              <br />
              new password.
            </h1>

            <p style={{ color: "rgba(210,220,230,0.68)", fontSize: 13, lineHeight: 1.7, margin: "18px 0 24px" }}>
              Request a code to your email, verify it, then choose a new password.
            </p>
            <form onSubmit={!codeSent ? sendCode : !verified ? verifyCode : submit} style={{ display: "flex", flexDirection: "column", gap: 15 }}>
              {!codeSent && <label style={{ color: "rgba(210,220,230,0.82)", fontSize: 12, display: "flex", flexDirection: "column", gap: 7 }}>Email address<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoFocus placeholder="you@example.com" style={{ width: "100%", boxSizing: "border-box", minHeight: 54, padding: "0 16px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.14)", background: "#111111", color: "#ffffff" }} /></label>}
              {codeSent && !verified && <label style={{ color: "rgba(210,220,230,0.82)", fontSize: 12, display: "flex", flexDirection: "column", gap: 7 }}>6-digit verification code<input value={otp} onChange={(event) => setOtp(event.target.value)} required autoFocus inputMode="numeric" maxLength={6} placeholder="000000" style={{ width: "100%", boxSizing: "border-box", minHeight: 54, padding: "0 16px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.14)", background: "#111111", color: "#ffffff" }} /></label>}
              {verified && <>
                <label style={{ color: "rgba(210,220,230,0.82)", fontSize: 12, display: "flex", flexDirection: "column", gap: 7 }}>New password<input type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} required autoFocus placeholder="At least 8 characters" style={{ width: "100%", boxSizing: "border-box", minHeight: 54, padding: "0 16px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.14)", background: "#111111", color: "#ffffff" }} /></label>
                <label style={{ color: "rgba(210,220,230,0.82)", fontSize: 12, display: "flex", flexDirection: "column", gap: 7 }}>Confirm new password<input type={showPassword ? "text" : "password"} value={confirm} onChange={(event) => setConfirm(event.target.value)} minLength={8} required placeholder="Repeat your new password" style={{ width: "100%", boxSizing: "border-box", minHeight: 54, padding: "0 16px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.14)", background: "#111111", color: "#ffffff" }} /></label>
              </>}
              {error && <div style={{ padding: "10px 12px", borderRadius: 9, border: "1px solid rgba(255,94,94,0.25)", background: "rgba(255,94,94,0.07)", color: "#ffbaba", fontSize: 11, lineHeight: 1.5 }}>{error}</div>}
              <button type="submit" disabled={loading} style={{ width: "100%", minHeight: 48, border: 0, borderRadius: 9, background: "#2f80ff", color: "#ffffff", fontWeight: 700, cursor: loading ? "default" : "pointer", opacity: loading ? 0.7 : 1 }}>
                {loading ? "Please waitÖ" : !codeSent ? "Send reset code" : !verified ? "Verify code" : "Update password"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
