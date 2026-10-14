import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";

// Per-profession identity — each professional gets a distinct accent + labels
// so the four dashboards feel like separate products, not one re-skin.
const PROFESSION = {
  photographer: { icon: "📷", label: "Photographer", grad: "from-plum-dark to-plum", accent: "gold", priceLabel: "Starting package price (₹)" },
  catering: { icon: "🍽️", label: "Caterer", grad: "from-rose to-rose-light", accent: "rose", priceLabel: "Price per plate — from (₹)" },
  decor: { icon: "🎨", label: "Decorator", grad: "from-accent to-accent-light", accent: "accent", priceLabel: "Starting price (₹)" },
  music: { icon: "🎵", label: "Musician / DJ", grad: "from-teal to-teal-light", accent: "teal", priceLabel: "Starting price (₹)" },
};

const EMPTY_PROFILE = { name: "", tagline: "", city: "", description: "", image_url: "", price_from: 0, experience_years: 0 };

export default function VendorProfileDashboard() {
  const { user } = useAuth();
  const theme = PROFESSION[user?.vendor_type] || PROFESSION.photographer;

  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [tab, setTab] = useState("profile"); // profile | availability | associations
  const [editing, setEditing] = useState(false);
  const [profileForm, setProfileForm] = useState(EMPTY_PROFILE);
  const [blockForm, setBlockForm] = useState({ start_date: "", end_date: "" });
  const [portfolio, setPortfolio] = useState([]);
  const [imgForm, setImgForm] = useState({ image_url: "", caption: "" });
  const [bookingReqs, setBookingReqs] = useState([]);
  const [dragIndex, setDragIndex] = useState(null);

  const [associations, setAssociations] = useState([]);
  const [vendors, setVendors] = useState([]);

  async function loadAll() {
    setLoading(true);
    const [svcRes, assocRes, portRes, reqRes] = await Promise.all([
      api.get("/vendor/services"),
      api.get("/vendor/associations"),
      api.get("/vendor/portfolio"),
      api.get("/vendor/booking-requests"),
    ]);
    const svc = svcRes.data[0] || null;
    setService(svc);
    setPortfolio(portRes.data);
    setBookingReqs(reqRes.data);
    if (svc) {
      setProfileForm({
        name: svc.name || "", tagline: svc.tagline || "", city: svc.city || "",
        description: svc.description || "", image_url: svc.image_url || "",
        price_from: svc.price_from || 0, experience_years: svc.experience_years || 0,
      });
    }
    setAssociations(assocRes.data);
    setLoading(false);
  }

  async function loadVendors() {
    const res = await api.get("/vendor/directory/vendors");
    setVendors(res.data);
  }

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => loadAll(), 15000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (tab === "associations") loadVendors();
  }, [tab]);

  async function toggleAvailable() {
    const next = !service.is_available;
    setService({ ...service, is_available: next });
    try {
      const res = await api.patch(`/vendor/services/${service.id}`, { is_available: next });
      setService(res.data);
    } catch {
      setService({ ...service, is_available: !next });
    }
  }

  async function saveProfile(e) {
    e.preventDefault();
    setMsg("");
    try {
      const res = await api.patch("/vendor/profile", {
        ...profileForm,
        price_from: Number(profileForm.price_from),
        experience_years: Number(profileForm.experience_years),
      });
      setService(res.data);
      setEditing(false);
      setMsg("Profile updated — customers see this live.");
    } catch (err) {
      setMsg(err?.response?.data?.detail || "Could not save profile.");
    }
  }

  async function addBlockedRange() {
    if (!blockForm.start_date || !blockForm.end_date) return;
    try {
      const res = await api.post(`/vendor/services/${service.id}/unavailability`, blockForm);
      setService(res.data);
      setBlockForm({ start_date: "", end_date: "" });
    } catch (err) {
      setMsg(err?.response?.data?.detail || "Could not add that date range.");
    }
  }

  async function removeBlockedRange(rangeId) {
    const res = await api.delete(`/vendor/services/unavailability/${rangeId}`);
    setService(res.data);
  }

  async function addImage() {
    if (!imgForm.image_url) return;
    const res = await api.post("/vendor/portfolio", imgForm);
    setPortfolio((prev) => [...prev, res.data]);
    setImgForm({ image_url: "", caption: "" });
  }

  async function removeImage(imageId) {
    await api.delete(`/vendor/portfolio/${imageId}`);
    setPortfolio((prev) => prev.filter((p) => p.id !== imageId));
  }

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const res = await api.post("/vendor/portfolio", { image_url: reader.result, caption: imgForm.caption });
      setPortfolio((prev) => [...prev, res.data]);
      setImgForm({ image_url: "", caption: "" });
    };
    reader.readAsDataURL(file);
  }

  async function respondReq(id, status) {
    await api.patch(`/vendor/booking-requests/${id}`, { status });
    setBookingReqs((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
  }

  async function handleDrop(idx) {
    if (dragIndex === null || dragIndex === idx) return;
    const next = [...portfolio];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(idx, 0, moved);
    setPortfolio(next);
    setDragIndex(null);
    const res = await api.patch("/vendor/portfolio/reorder", { ordered_ids: next.map((p) => p.id) });
    setPortfolio(res.data);
    setService((s) => (s && res.data[0] ? { ...s, image_url: res.data[0].image_url } : s));
  }

  async function requestVendor(userId) {
    try {
      await api.post("/vendor/associations", { target_user_id: userId });
      await Promise.all([loadAll(), loadVendors()]);
    } catch (err) {
      setMsg(err?.response?.data?.detail || "Could not send request.");
    }
  }

  async function respond(id, status) {
    await api.patch(`/vendor/associations/${id}`, { status });
    await Promise.all([loadAll(), loadVendors()]);
  }

  async function removeAssoc(id) {
    await api.delete(`/vendor/associations/${id}`);
    await Promise.all([loadAll(), loadVendors()]);
  }

  if (loading) return <p className="text-white/35 text-center py-24">Loading your dashboard…</p>;

  if (!service) {
    return (
      <div className="max-w-3xl mx-auto px-5 py-16 text-center">
        <p className="text-white/35">No professional profile found for your account yet.</p>
      </div>
    );
  }

  const incoming = associations.filter((a) => a.is_incoming);
  const accepted = associations.filter((a) => a.status === "accepted");
  const pendingSent = associations.filter((a) => a.status === "pending" && !a.is_incoming);

  const TABS = [
    { key: "profile", label: "My Profile", icon: "🪪" },
    { key: "availability", label: "Availability", icon: "📅" },
    { key: "associations", label: `Vendors${incoming.length ? ` (${incoming.length})` : ""}`, icon: "🤝" },
    { key: "bookings", label: `Bookings${bookingReqs.filter((r) => r.status === "pending").length ? ` (${bookingReqs.filter((r) => r.status === "pending").length})` : ""}`, icon: "📖" },
  ];

  return (
    <div className="min-h-screen bg-[#070706] text-[#F4F0E7] px-4 sm:px-6 py-8 sm:py-12 relative overflow-hidden">
      <div className="pointer-events-none absolute -top-40 -right-40 w-[520px] h-[520px] rounded-full bg-[#7DD3FC]/10 blur-[120px]" />
      <div className="pointer-events-none absolute top-[35%] -left-48 w-[420px] h-[420px] rounded-full bg-[#7DD3FC]/6 blur-[110px]" />
      <div className="max-w-6xl mx-auto relative z-10">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-[28px] bg-[#11110F] border border-white/10 text-white p-6 sm:p-9 mb-6 relative overflow-hidden shadow-[0_30px_90px_rgba(0,0,0,.35)]"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(125,211,252,.18),transparent_35%),linear-gradient(135deg,rgba(255,255,255,.035),transparent_55%)] pointer-events-none" />
        <div className="relative flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-[#171714]/10 border border-white/15 flex items-center justify-center text-3xl backdrop-blur-sm overflow-hidden shadow-2xl">
            {service.image_url ? <img src={service.image_url} alt="" className="w-full h-full object-cover" /> : theme.icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] uppercase tracking-[4px] text-[#7DD3FC] font-bold mb-2">{theme.label} Dashboard</p>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold truncate tracking-[-.02em]">{service.name}</h1>
            <p className="text-sm text-white/55 mt-1">{user?.full_name}{service.city ? ` · ${service.city}` : ""}</p>
          </div>
          <Link
            to={`/professionals/${service.id}`}
            data-testid="view-public-page"
            className="hidden sm:inline-flex text-xs font-semibold bg-[#7DD3FC] text-[#05070B] hover:bg-[#B9EBFF] px-5 py-2.5 rounded-full transition-all hover:-translate-y-0.5"
          >
            View public page ↗
          </Link>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-1.5 bg-[#11110F] border border-white/10 rounded-full p-1.5 mb-7 w-fit overflow-x-auto max-w-full shadow-lg">
        {TABS.map((t) => (
          <button
            key={t.key}
            data-testid={`pro-tab-${t.key}`}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
              tab === t.key ? "bg-[#B9EBFF] text-[#05070B] shadow-md" : "text-white/65 hover:text-white"
            }`}
          >
            <span className="mr-1">{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      {msg && <p className="text-sm text-[#C8A96B] bg-[#151511] border border-[#C8A96B]/20 inline-block px-3 py-2 rounded-lg mb-4">{msg}</p>}

      {/* ---- Profile tab ---- */}
      {tab === "profile" && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-[#11110F] border border-white/10 rounded-[24px] p-6 sm:p-8 shadow-[0_24px_70px_rgba(0,0,0,.28)]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-lg sm:text-xl font-bold text-[#F4F0E7]">Public Profile</h2>
            <button
              data-testid="edit-profile-toggle"
              onClick={() => { setEditing((e) => !e); setMsg(""); }}
              className="border border-white/15 text-white/75 hover:bg-white/10 hover:text-white hover:border-[#C8A96B]/40 !py-1.5 !px-4 text-sm"
            >
              {editing ? "Cancel" : "Edit Profile"}
            </button>
          </div>

          {!editing ? (
            <div className="space-y-3 text-sm">
              {service.tagline && <p className="italic text-[#C8A96B]">“{service.tagline}”</p>}
              <p className="text-white/65">{service.description || "No description yet — add one to attract vendors & customers."}</p>
              <div className="flex flex-wrap gap-4 pt-3 text-white/70">
                <span>📍 {service.city || "—"}</span>
                <span>💰 from ₹{(service.price_from || 0).toLocaleString("en-IN")}</span>
                <span>🗓️ {service.experience_years || 0} yrs experience</span>
                <span>★ {(service.rating_avg || 0).toFixed(1)} ({service.rating_count || 0})</span>
              </div>
            </div>
          ) : (
            <form onSubmit={saveProfile} className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-white/45">Business / Studio Name</label>
                <input required className="input !bg-[#0C0C0B] !border-white/10 !text-white/80 placeholder:!text-white/25" value={profileForm.name} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} data-testid="profile-name" />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-white/45">Tagline</label>
                <input className="input !bg-[#0C0C0B] !border-white/10 !text-white/80 placeholder:!text-white/25" placeholder="A short catchy line" value={profileForm.tagline} onChange={(e) => setProfileForm({ ...profileForm, tagline: e.target.value })} data-testid="profile-tagline" />
              </div>
              <div>
                <label className="text-xs font-semibold text-white/45">City</label>
                <input className="input !bg-[#0C0C0B] !border-white/10 !text-white/80 placeholder:!text-white/25" value={profileForm.city} onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })} data-testid="profile-city" />
              </div>
              <div>
                <label className="text-xs font-semibold text-white/45">{theme.priceLabel}</label>
                <input type="number" className="input !bg-[#0C0C0B] !border-white/10 !text-white/80 placeholder:!text-white/25" value={profileForm.price_from} onChange={(e) => setProfileForm({ ...profileForm, price_from: e.target.value })} data-testid="profile-price" />
              </div>
              <div>
                <label className="text-xs font-semibold text-white/45">Experience (years)</label>
                <input type="number" className="input !bg-[#0C0C0B] !border-white/10 !text-white/80 placeholder:!text-white/25" value={profileForm.experience_years} onChange={(e) => setProfileForm({ ...profileForm, experience_years: e.target.value })} data-testid="profile-experience" />
              </div>
              <div>
                <label className="text-xs font-semibold text-white/45">Cover Image URL</label>
                <input className="input !bg-[#0C0C0B] !border-white/10 !text-white/80 placeholder:!text-white/25" placeholder="https://…" value={profileForm.image_url} onChange={(e) => setProfileForm({ ...profileForm, image_url: e.target.value })} data-testid="profile-image" />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-white/45">Description</label>
                <textarea rows={3} className="input !bg-[#0C0C0B] !border-white/10 !text-white/80 placeholder:!text-white/25" value={profileForm.description} onChange={(e) => setProfileForm({ ...profileForm, description: e.target.value })} data-testid="profile-description" />
              </div>
              <div className="sm:col-span-2">
                <button type="submit" className="bg-[#F4F0E7] text-[#11110F] hover:bg-[#E0C58B]" data-testid="profile-save">Save Profile</button>
              </div>
            </form>
          )}

          {/* Portfolio manager */}
          <div className="mt-10 pt-8 border-t border-white/10" data-testid="portfolio-manager">
            <h3 className="font-serif text-lg sm:text-xl font-bold text-[#F4F0E7] mb-1">Portfolio Gallery</h3>
            <p className="text-sm text-white/45 mb-4">Add work photos — these appear on your public page.</p>
            {portfolio.length > 0 && (
              <>
                <p className="text-[11px] text-white/35 mb-2">Drag photos to reorder — the first one is your public cover.</p>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-4">
                  {portfolio.map((img, idx) => (
                    <div
                      key={img.id}
                      draggable
                      onDragStart={() => setDragIndex(idx)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => handleDrop(idx)}
                      className="relative group rounded-lg overflow-hidden aspect-square cursor-move"
                      data-testid={`port-tile-${img.id}`}
                    >
                      <img src={img.image_url} alt={img.caption} className="w-full h-full object-cover pointer-events-none" />
                      {idx === 0 && <span className="absolute bottom-1 left-1 bg-[#C8A96B] text-[#F4F0E7] text-[9px] font-bold px-1.5 py-0.5 rounded">Cover</span>}
                      <button onClick={() => removeImage(img.id)} data-testid={`remove-img-${img.id}`} className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                    </div>
                  ))}
                </div>
              </>
            )}
            <div className="flex flex-wrap items-end gap-2">
              <div className="flex-1 min-w-[180px]">
                <label className="text-[11px] text-white/35 block">Image URL</label>
                <input className="!bg-[#0C0C0B] !border-white/10 !text-white/80 !py-1.5 !text-xs" placeholder="https://…" value={imgForm.image_url} onChange={(e) => setImgForm({ ...imgForm, image_url: e.target.value })} data-testid="img-url" />
              </div>
              <div className="flex-1 min-w-[140px]">
                <label className="text-[11px] text-white/35 block">Caption (optional)</label>
                <input className="!bg-[#0C0C0B] !border-white/10 !text-white/80 !py-1.5 !text-xs" value={imgForm.caption} onChange={(e) => setImgForm({ ...imgForm, caption: e.target.value })} data-testid="img-caption" />
              </div>
              <label className="text-xs font-semibold px-4 py-2 rounded-full bg-[#7DD3FC] text-[#05070B] hover:bg-[#B9EBFF] cursor-pointer whitespace-nowrap">
                ⬆ Upload
                <input type="file" accept="image/*" onChange={handleFile} className="hidden" data-testid="img-upload" />
              </label>
              <button onClick={addImage} className="text-xs font-semibold px-4 py-2 rounded-full bg-[#F4F0E7] text-[#11110F] hover:bg-[#E0C58B]" data-testid="img-add">Add URL</button>
            </div>
          </div>
        </motion.div>
      )}

      {/* ---- Availability tab ---- */}
      {tab === "availability" && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-[#11110F] border border-white/10 rounded-[24px] p-6 sm:p-8 shadow-[0_24px_70px_rgba(0,0,0,.28)]">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-serif text-lg sm:text-xl font-bold text-[#F4F0E7]">Availability</h2>
              <p className="text-sm text-white/45">Customers browsing Services see this live — with a red/green dot.</p>
            </div>
            <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold ${service.is_available ? "bg-[#6FB89A]/12 text-[#8ED0B1] border border-[#6FB89A]/20" : "bg-[#C96C73]/12 text-[#E58B91] border border-[#C96C73]/20"}`}>
              <span className={`w-2.5 h-2.5 rounded-full ${service.is_available ? "bg-[#6FB89A] animate-pulse" : "bg-[#C96C73]"}`} />
              {service.is_available ? "Available" : "Unavailable"}
            </span>
          </div>

          <button
            onClick={toggleAvailable}
            data-testid="toggle-availability"
            className={`text-sm font-semibold px-5 py-2.5 rounded-full transition-colors mb-6 ${
              service.is_available ? "bg-[#C96C73]/10 text-rose hover:bg-[#C96C73]/20" : "bg-[#6FB89A]/10 text-teal hover:bg-teal/20"
            }`}
          >
            {service.is_available ? "Mark as Unavailable" : "Mark as Available"}
          </button>

          <div className="rounded-xl bg-[#171714]/[0.035] border border-white/8 p-4">
            <p className="text-xs font-semibold text-white/45 mb-2">Booked / blocked date ranges</p>
            {service.unavailable_ranges.length === 0 ? (
              <p className="text-xs text-white/35 mb-3">No blocked dates — fully open right now.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {service.unavailable_ranges.map((r) => (
                  <div key={r.id} className="flex items-center gap-2 bg-[#171714] rounded-xl px-3 py-1.5 text-xs border border-white/10">
                    <span className="text-[#F4F0E7] font-medium">{r.start_date} → {r.end_date}</span>
                    <button onClick={() => removeBlockedRange(r.id)} className="text-rose font-bold" title="Remove" data-testid={`remove-range-${r.id}`}>✕</button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex flex-wrap items-end gap-2">
              <div>
                <label className="text-[11px] text-white/35 block">From</label>
                <input type="date" className="!bg-[#0C0C0B] !border-white/10 !text-white/80 !py-1.5 !text-xs !w-auto" value={blockForm.start_date} onChange={(e) => setBlockForm({ ...blockForm, start_date: e.target.value })} data-testid="block-start" />
              </div>
              <div>
                <label className="text-[11px] text-white/35 block">To</label>
                <input type="date" className="!bg-[#0C0C0B] !border-white/10 !text-white/80 !py-1.5 !text-xs !w-auto" value={blockForm.end_date} onChange={(e) => setBlockForm({ ...blockForm, end_date: e.target.value })} data-testid="block-end" />
              </div>
              <button onClick={addBlockedRange} className="text-xs font-semibold px-4 py-2 rounded-full bg-[#F4F0E7] text-[#11110F] hover:bg-[#E0C58B]" data-testid="block-add">Block Dates</button>
            </div>
          </div>
        </motion.div>
      )}

      {/* ---- Associations tab ---- */}
      {tab === "associations" && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {incoming.length > 0 && (
            <div className="bg-[#11110F] border border-white/10 rounded-[24px] p-6 sm:p-8 shadow-[0_24px_70px_rgba(0,0,0,.28)]">
              <h2 className="font-serif text-lg sm:text-xl font-bold text-[#F4F0E7] mb-3">Incoming Requests</h2>
              <div className="space-y-2">
                {incoming.map((a) => (
                  <div key={a.id} className="flex items-center justify-between bg-[#171714]/[0.035] border border-white/8 rounded-lg p-3" data-testid={`incoming-${a.id}`}>
                    <div>
                      <p className="font-semibold text-[#F4F0E7] text-sm">{a.party?.full_name}</p>
                      <p className="text-xs text-white/45">{a.party?.venue_count} venue(s) · wants to work with you</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => respond(a.id, "accepted")} className="text-xs font-semibold px-3 py-1.5 rounded-full bg-[#6FB89A]/15 text-teal hover:bg-[#6FB89A]/25" data-testid={`accept-${a.id}`}>Accept</button>
                      <button onClick={() => respond(a.id, "declined")} className="text-xs font-semibold px-3 py-1.5 rounded-full bg-[#C96C73]/10 text-rose hover:bg-[#C96C73]/20" data-testid={`decline-${a.id}`}>Decline</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-[#11110F] border border-white/10 rounded-[24px] p-6 sm:p-8 shadow-[0_24px_70px_rgba(0,0,0,.28)]">
            <h2 className="font-serif text-lg sm:text-xl font-bold text-[#F4F0E7] mb-1">My Vendors</h2>
            <p className="text-sm text-white/45 mb-3">Venue owners you are officially associated with.</p>
            {accepted.length === 0 ? (
              <p className="text-sm text-white/35">No accepted partners yet.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {accepted.map((a) => (
                  <span key={a.id} className="flex items-center gap-2 bg-[#6FB89A]/10 text-teal px-3 py-1.5 rounded-full text-sm font-semibold" data-testid={`partner-${a.id}`}>
                    {a.party?.full_name}
                    <button onClick={() => removeAssoc(a.id)} className="font-bold" title="Remove">✕</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="bg-[#11110F] border border-white/10 rounded-[24px] p-6 sm:p-8 shadow-[0_24px_70px_rgba(0,0,0,.28)]">
            <h2 className="font-serif text-lg sm:text-xl font-bold text-[#F4F0E7] mb-1">Find Vendors to Work With</h2>
            <p className="text-sm text-white/45 mb-4">Send a request to any venue owner — they accept based on your availability.</p>
            <div className="space-y-2">
              {vendors.map((v) => {
                const sent = pendingSent.find((a) => a.party?.id === v.id);
                return (
                  <div key={v.id} className="flex items-center justify-between bg-[#171714]/[0.03] border border-white/8 rounded-lg p-3" data-testid={`vendor-row-${v.id}`}>
                    <div>
                      <p className="font-semibold text-[#F4F0E7] text-sm">{v.full_name}</p>
                      <p className="text-xs text-white/45">{v.venue_count} venue(s) listed</p>
                    </div>
                    {v.association_status === "accepted" ? (
                      <span className="text-xs font-semibold text-teal">✓ Associated</span>
                    ) : v.association_status === "pending" || sent ? (
                      <span className="text-xs font-semibold text-gold">Pending…</span>
                    ) : (
                      <button onClick={() => requestVendor(v.id)} className="border border-white/15 text-white/75 hover:bg-white/10 hover:text-white hover:border-[#C8A96B]/40 !py-1.5 !px-3 text-xs" data-testid={`request-vendor-${v.id}`}>Request to Associate</button>
                    )}
                  </div>
                );
              })}
              {vendors.length === 0 && <p className="text-sm text-white/35">No venue owners found.</p>}
            </div>
          </div>
        </motion.div>
      )}

      {/* ---- Booking Requests tab ---- */}
      {tab === "bookings" && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-[#11110F] border border-white/10 rounded-[24px] p-6 sm:p-8 shadow-[0_24px_70px_rgba(0,0,0,.28)]">
          <h2 className="font-serif text-lg sm:text-xl font-bold text-[#F4F0E7] mb-1">Your Booking Requests</h2>
          <p className="text-sm text-white/45 mb-4">Event dates customers booked you for — confirm to lock the date (it turns red on your public calendar) or decline.</p>
          {bookingReqs.length === 0 ? (
            <p className="text-sm text-white/35">No booking requests yet.</p>
          ) : (
            <div className="space-y-2">
              {bookingReqs.map((r) => (
                <div key={r.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-[#171714]/[0.035] border border-white/8 rounded-lg p-3" data-testid={`booking-req-${r.id}`}>
                  <div className="min-w-0">
                    <p className="font-semibold text-[#F4F0E7] text-sm">{r.event_date} · {r.venue_name}</p>
                    <p className="text-xs text-white/45">{r.customer_name} · {r.guest_count} guests{r.city ? ` · ${r.city}` : ""}</p>
                    {(r.customer_email || r.customer_phone) && <p className="text-xs text-white/55">{[r.customer_email, r.customer_phone].filter(Boolean).join(" · ")}</p>}
                    {r.booking_id && <p className="mt-1 text-xs font-semibold text-[#C8A96B]">Booking #{r.booking_id} · Total ₹{Number(r.customer_total || 0).toLocaleString("en-IN")} · Paid ₹{Number(r.customer_paid || 0).toLocaleString("en-IN")} · Balance ₹{Number(r.customer_balance || 0).toLocaleString("en-IN")}</p>}
                    {r.note && <p className="mt-2 max-w-xl whitespace-pre-line text-xs leading-relaxed text-white/70">{r.note}</p>}
                  </div>
                  {r.status === "pending" ? (
                    <div className="flex gap-2">
                      <button onClick={() => respondReq(r.id, "confirmed")} className="text-xs font-semibold px-3 py-1.5 rounded-full bg-[#6FB89A]/15 text-teal hover:bg-[#6FB89A]/25" data-testid={`req-confirm-${r.id}`}>Confirm</button>
                      <button onClick={() => respondReq(r.id, "declined")} className="text-xs font-semibold px-3 py-1.5 rounded-full bg-[#C96C73]/10 text-rose hover:bg-[#C96C73]/20" data-testid={`req-decline-${r.id}`}>Decline</button>
                    </div>
                  ) : (
                    <span className={`text-xs font-bold capitalize ${r.status === "confirmed" ? "text-teal" : "text-rose"}`}>{r.status}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}
      </div>
    </div>
  );
}
