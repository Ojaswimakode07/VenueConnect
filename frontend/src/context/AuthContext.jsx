
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import api from "../api/axios.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("vc_token");

    if (!token) {
      setLoading(false);
      return;
    }

    api
      .get("/auth/me")
      .then((res) => setUser(res.data))
      .catch(() => {
        localStorage.removeItem("vc_token");
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  // ============================================================
  // LOGIN WITH STRICT PROFILE MATCHING
  // ============================================================

  async function requestLoginOTP(
    email,
    password,
    selected_profile
  ) {
    const res = await api.post("/auth/login", {
      email,
      password,
      selected_profile,
    });

    if (res.data.access_token && res.data.user) {
      localStorage.setItem("vc_token", res.data.access_token);
      setUser(res.data.user);
      return { user: res.data.user, otpRequired: false };
    }

    return { ...res.data, otpRequired: true };
  }

  async function verifyLoginOTP(email, otp, selected_profile) {
    const res = await api.post("/auth/verify-login-otp", {
      email,
      otp,
      selected_profile,
    });
    localStorage.setItem("vc_token", res.data.access_token);
    setUser(res.data.user);
    return res.data.user;
  }

  async function verifySignupOTP(email, otp) {
    const res = await api.post("/auth/verify-signup-otp", { email, otp });
    localStorage.setItem("vc_token", res.data.access_token);
    setUser(res.data.user);
    return res.data.user;
  }

  // ============================================================
  // REGISTER
  // ============================================================

  async function register(payload) {
    const res = await api.post("/auth/register", payload);
    return res.data;
  }

  // ============================================================
  // LOGOUT
  // ============================================================

  function logout() {
    localStorage.removeItem("vc_token");

    setUser(null);
  }

  // ============================================================
  // FORGOT PASSWORD
  // ============================================================

  async function requestPasswordReset(email) {
    const res = await api.post(
      "/auth/forgot-password",
      { email }
    );

    return res.data;
  }

  async function verifyResetOTP(email, otp) {
    const res = await api.post("/auth/verify-reset-otp", { email, otp });
    return res.data;
  }

  // ============================================================
  // RESET PASSWORD
  // ============================================================

  async function resetPassword(
    email,
    otp,
    newPassword
  ) {
    const res = await api.post(
      "/auth/reset-password",
      {
        email,
        otp,
        new_password: newPassword,
      }
    );

    return res.data;
  }

  // ============================================================
  // AUTH CONTEXT
  // ============================================================

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        requestLoginOTP,
        verifyLoginOTP,
        verifySignupOTP,
        register,
        logout,
        requestPasswordReset,
        verifyResetOTP,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
