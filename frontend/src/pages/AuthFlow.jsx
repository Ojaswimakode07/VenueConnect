import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "../context/AuthContext.jsx";
import ScrubVideoBackground from "../components/ScrubVideoBackground.jsx";

const profiles = [
  { key: "customer", label: "Customer", detail: "Plan and book your event", icon: "✦" },
  { key: "owner", label: "Venue Owner", detail: "Manage your venue", icon: "⌂" },
  { key: "catering", label: "Caterer", detail: "Offer your menus", icon: "♨" },
  { key: "photographer", label: "Photographer", detail: "Show your work", icon: "◉" },
  { key: "music", label: "Musician", detail: "Bring the celebration alive", icon: "♫" },
  { key: "decor", label: "Decorator", detail: "Create memorable spaces", icon: "✳" },
];
const serviceProfiles = new Set(["catering", "photographer", "music", "decor"]);
const transition = { initial: { opacity: 0, y: 24, scale: 0.98 }, animate: { opacity: 1, y: 0, scale: 1 }, exit: { opacity: 0, y: -16, scale: 0.98 }, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } };

function Field({ label, type = "text", value, onChange, required, autoFocus }) {
  return <label className="auth-flow__field">{label}<input className="auth-flow__input" type={type} value={value} onChange={(event) => onChange(event.target.value)} required={required} autoFocus={autoFocus} /></label>;
}

export default function AuthFlow({ mode }) {
  const isSignup = mode === "signup";
  const { register } = useAuth();
  const navigate = useNavigate();
  const [screen, setScreen] = useState("profile");
  const [profile, setProfile] = useState("");
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", password: "", business_name: "", city: "", bio: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const selected = profiles.find((item) => item.key === profile);
  const isService = serviceProfiles.has(profile);
  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  function chooseProfile(key) {
    setProfile(key);
    setScreen("handoff");
    window.setTimeout(() => setScreen("form"), 760);
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isSignup) {
        const user = await register({ full_name: form.full_name, email: form.email, phone: form.phone, password: form.password, role: profile === "customer" ? "customer" : "vendor", vendor_type: profile === "owner" ? "venue" : profile, business_name: isService ? form.business_name : undefined, city: isService ? form.city : undefined, bio: isService ? form.bio : undefined });
        navigate(user.role === "vendor" ? "/vendor/dashboard" : "/");
      } else {
        setError("Please use the main login page to sign in with email verification.");
      }
    } catch (err) {
      setError(err?.response?.data?.detail || (isSignup ? "Could not create your account." : "Login failed. Please check your credentials."));
    } finally { setLoading(false); }
  }


  return <section className="auth-flow min-h-screen overflow-hidden px-5 py-8 sm:px-8 sm:py-10">
    <ScrubVideoBackground />
    <div className="auth-flow__video-shade" />
    <div className="auth-flow__content relative z-10 mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl flex-col justify-between">
      <header className="flex items-center justify-between"><Link to="/" className="auth-flow__brand">Venue<span>Connect</span></Link><p>{isSignup ? "Join us" : "Welcome back"}</p></header>
      <div className="mx-auto flex w-full max-w-4xl flex-1 items-center py-10"><AnimatePresence mode="wait">
        {screen === "profile" ? <motion.div key="profiles" {...transition} className="w-full text-center"><p className="auth-flow__eyebrow">Step 1 of 2</p><h1>How will you use<br />VenueConnect?</h1><p className="auth-flow__lead">Choose a profile to personalise your {isSignup ? "account setup" : "sign-in experience"}.</p><div className="auth-flow__profiles">{profiles.map((item, index) => <motion.button key={item.key} type="button" onClick={() => chooseProfile(item.key)} initial={{ opacity: 0, y: 26, scale: 0.94 }} animate={{ opacity: 1, y: 0, scale: 1 }} whileHover={{ y: -8, scale: 1.025 }} whileTap={{ scale: 0.96 }} transition={{ delay: 0.08 + index * 0.06, duration: 0.48, ease: [0.16, 1, 0.3, 1] }} className="auth-flow__profile"><span>{item.icon}</span><strong>{item.label}</strong><small>{item.detail}</small></motion.button>)}</div></motion.div> : screen === "handoff" ? <motion.div key="handoff" className="auth-flow__handoff"><motion.div initial={{ x: 0, opacity: 1 }} animate={{ x: "-62vw", opacity: 0.28 }} transition={{ duration: 0.72, ease: [0.76, 0, 0.24, 1] }} className="auth-flow__handoff-source"><p>Selected profile</p><strong>{selected?.label}</strong></motion.div><motion.div initial={{ x: "110%" }} animate={{ x: 0 }} transition={{ duration: 0.72, ease: [0.76, 0, 0.24, 1] }} className="auth-flow__handoff-panel"><span>{selected?.icon}</span><b>{isSignup ? "Create your account" : "Sign in"}</b><i /><i /><i /></motion.div></motion.div> : <motion.div key="form" {...transition} className="auth-flow__form-wrap"><button type="button" onClick={() => setScreen("profile")} className="auth-flow__back">← Change profile</button><div className="auth-flow__form"><div className="auth-flow__form-heading"><span>{selected?.icon}</span><div><p>{selected?.label}</p><h1>{isSignup ? "Create your account" : "Sign in"}</h1></div></div><form onSubmit={submit}>{isSignup && <><Field label="Full name" value={form.full_name} onChange={(value) => update("full_name", value)} required /><Field label="Phone number" type="tel" value={form.phone} onChange={(value) => update("phone", value)} /></>}{isSignup && isService && <><Field label="Business or studio name" value={form.business_name} onChange={(value) => update("business_name", value)} required /><Field label="City you operate in" value={form.city} onChange={(value) => update("city", value)} required /></>}<Field label="Email address" type="email" value={form.email} onChange={(value) => update("email", value)} required autoFocus /><label className="auth-flow__field">Password<div className="auth-flow__password"><input className="auth-flow__input" type={showPassword ? "text" : "password"} value={form.password} onChange={(event) => update("password", event.target.value)} minLength={6} required /><button type="button" onClick={() => setShowPassword((value) => !value)}>{showPassword ? "Hide" : "Show"}</button></div></label>{isSignup && isService && <label className="auth-flow__field">A little about your work <textarea className="auth-flow__input" value={form.bio} onChange={(event) => update("bio", event.target.value)} /></label>}{error && <p className="auth-flow__error">{error}</p>}<motion.button whileTap={{ scale: 0.98 }} disabled={loading} className="auth-flow__submit" type="submit">{loading ? "Please wait…" : isSignup ? "Create account" : "Log in"}<span>→</span></motion.button></form><p className="auth-flow__switch">{isSignup ? "Already have an account?" : "New to VenueConnect?"} <Link to={isSignup ? "/login" : "/register"}>{isSignup ? "Log in" : "Sign up"}</Link></p></div></motion.div>}
      </AnimatePresence></div>
      <p className="auth-flow__footer">Celebrate every moment, beautifully.</p>
    </div>
  </section>;
}
