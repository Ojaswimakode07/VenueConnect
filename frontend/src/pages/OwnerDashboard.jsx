import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";

const EMPTY_VENUE = {
  name: "", city: "", address: "", category: "Banquet Hall",
  capacity: 100, price_per_day: 50000, description: "", image_url: "",
  amenities: "",
};

const CARD = "bg-[#11110F] border border-white/10 rounded-[24px] p-6 sm:p-8 shadow-[0_24px_70px_rgba(0,0,0,.28)]";
const ROW = "bg-[#171714]/[0.035] border border-white/10 rounded-xl p-4";
const FIELD = "input !bg-[#0C0C0B] !border-white/10 !text-white/80 placeholder:!text-white/25";
const LABEL = "text-xs font-semibold text-white/45 block mb-1";
const GHOST = "border border-white/15 text-white/75 hover:bg-white/10 hover:text-white hover:border-[#C8A96B]/40 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors";
const DEMO_OWNER_EMAIL = "demo.owner@gmail.com";
const EMPTY_BOOKING_DETAILS = { caterers: {}, photographers: {}, menus: {}, venues: {}, reviews: {} };

function addonIds(value) {
  return String(value || "")
    .split(",")
    .map((id) => Number(id.trim()))
    .filter(Boolean);
}

function displayDate(value, options) {
  if (!value) return "—";
  const dateValue = `${value}`.includes("T") ? value : `${value}T00:00:00`;
  return new Date(dateValue).toLocaleDateString("en-IN", options);
}

const NAV_ITEMS = [
  { key: "overview", label: "Overview", icon: "📊" },
  { key: "venues", label: "My Venues", icon: "🏛️" },
  { key: "bookings", label: "Bookings", icon: "📅" },
  { key: "add", label: "Add Venue", icon: "➕" },
  { key: "associations", label: "Associations", icon: "🤝" },
];

// Venue-owner dashboard — shares the dark, sky-accent "professional dashboard"
// theme used by VendorProfileDashboard (header card + pill tabs + dark cards).
export default function OwnerDashboard() {
  const { user } = useAuth();
  const isDemoVenueOwner = user?.email?.toLowerCase() === DEMO_OWNER_EMAIL;
  const [tab, setTab] = useState("overview");
  const [venues, setVenues] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [earnings, setEarnings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_VENUE);
  const [msg, setMsg] = useState("");
  const [associations, setAssociations] = useState([]);
  const [bookingDetails, setBookingDetails] = useState(EMPTY_BOOKING_DETAILS);
  const [notifications, setNotifications] = useState([]);

  async function loadAll() {
    setLoading(true);
    const [v, b, e, a, requests, notificationRes] = await Promise.all([
      api.get("/vendor/venues"),
      api.get("/vendor/bookings"),
      api.get("/vendor/earnings"),
      api.get("/vendor/associations"),
      api.get("/vendor/booking-requests").catch(() => ({ data: [] })),
      api.get("/bookings/notifications").catch(() => ({ data: [] })),
    ]);
    setVenues(v.data);
    const venueBookings = b.data;
    const cateringBookings = requests.data
      .filter((request) => request.booking_id && !venueBookings.some((booking) => booking.id === request.booking_id))
      .map((request) => request.booking);
    setBookings([...venueBookings, ...cateringBookings.filter(Boolean)]);
    setEarnings(e.data);
    setAssociations(a.data);
    setNotifications(notificationRes.data);

    const [caterers, photographers, menus, cateringServices] = await Promise.all([
      api.get("/catalog/caterers"),
      api.get("/catalog/photographers"),
      api.get("/catalog/menus"),
      api.get("/catalog/catering-services").catch(() => ({ data: [] })),
    ]);
    const venueIds = [...new Set(venueBookings.map((booking) => booking.venue_id))];
    // BookingOut stores selections by id, so resolve the demo data through
    // the existing read-only catalog, venue-detail, and review endpoints.
    const venueData = await Promise.all(
      venueIds.map(async (id) => {
        const [venue, reviews] = await Promise.allSettled([
          api.get(`/venues/${id}`),
          api.get(`/reviews/venue/${id}`),
        ]);
        return {
          id,
          venue: venue.status === "fulfilled" ? venue.value.data : null,
          reviews: reviews.status === "fulfilled" ? reviews.value.data : [],
        };
      })
    );
    setBookingDetails({
      caterers: Object.fromEntries(caterers.data.map((item) => [item.id, item])),
      cateringServices: Object.fromEntries(cateringServices.data.map((item) => [item.id, item])),
      photographers: Object.fromEntries(photographers.data.map((item) => [item.id, item])),
      menus: Object.fromEntries(menus.data.map((item) => [item.id, item])),
      venues: Object.fromEntries(venueData.filter((item) => item.venue).map((item) => [item.id, item.venue])),
      reviews: Object.fromEntries(venueData.map((item) => [item.id, item.reviews])),
    });
    setLoading(false);
  }

  useEffect(() => {
    loadAll();
  }, [isDemoVenueOwner]);

  useEffect(() => {
    const timer = window.setInterval(() => loadAll(), 15000);
    return () => window.clearInterval(timer);
  }, [isDemoVenueOwner]);

  async function respondAssociation(id, status) {
    try {
      await api.patch(`/vendor/associations/${id}`, { status });
      await loadAll();
    } catch (err) {
      setMsg(err?.response?.data?.detail || "Could not update association request.");
    }
  }

  async function markOwnerNotificationRead(notification) {
    if (notification.is_read) return;
    try {
      const result = await api.patch(`/bookings/notifications/${notification.id}`, { is_read: true });
      setNotifications((items) => items.map((item) => item.id === notification.id ? result.data : item));
    } catch (error) {
      console.warn("Unable to mark notification as read", error);
    }
  }

  async function disconnectAssociation(id, partnerName) {
    const confirmed = window.confirm(
      `Disconnect ${partnerName || "this professional"} from your vendor network?`
    );
    if (!confirmed) return;

    setMsg("");
    try {
      await api.delete(`/vendor/associations/${id}`);
      setMsg(`${partnerName || "Professional"} was disconnected successfully.`);
      await loadAll();
    } catch (err) {
      setMsg(err?.response?.data?.detail || "Could not disconnect this professional.");
    }
  }

  async function handleAddVenue(e) {
    e.preventDefault();
    setMsg("");
    try {
      await api.post("/venues", { ...form, capacity: Number(form.capacity), price_per_day: Number(form.price_per_day) });
      setMsg("Venue listed successfully!");
      setForm(EMPTY_VENUE);
      await loadAll();
      setTab("venues");
    } catch (err) {
      setMsg(err?.response?.data?.detail || "Failed to add venue.");
    }
  }

  const incoming = associations.filter((a) => a.is_incoming && a.status === "pending");
  const accepted = associations.filter((a) => a.status === "accepted");

  const pendingCount = bookings.filter((b) => b.status === "pending").length;
  const rupee = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
  const statusTone = (st) =>
    st === "confirmed" ? "bg-[#6FB89A]/15 text-teal" : st === "pending" ? "bg-[#C8A96B]/15 text-[#C8A96B]" : "bg-[#C96C73]/10 text-rose";

  return (
    <div className="min-h-screen bg-[#070706] text-[#F4F0E7] px-4 sm:px-6 py-8 sm:py-12 relative overflow-hidden">
      <div className="pointer-events-none absolute -top-40 -right-40 w-[520px] h-[520px] rounded-full bg-[#7DD3FC]/10 blur-[120px]" />
      <div className="pointer-events-none absolute top-[35%] -left-48 w-[420px] h-[420px] rounded-full bg-[#7DD3FC]/5 blur-[110px]" />
      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[28px] bg-[#11110F] border border-white/10 p-6 sm:p-9 mb-6 relative overflow-hidden shadow-[0_30px_90px_rgba(0,0,0,.35)]"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(125,211,252,.18),transparent_35%),linear-gradient(135deg,rgba(255,255,255,.035),transparent_55%)] pointer-events-none" />
          <div className="relative flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/15 flex items-center justify-center text-3xl shadow-2xl">🏛️</div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] uppercase tracking-[4px] text-[#7DD3FC] font-bold mb-2">Venue Owner Dashboard</p>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold truncate tracking-[-.02em]">
                {user?.full_name?.split(" ")[0] || "Owner"}'s Venues
              </h1>
              <p className="text-sm text-white/55 mt-1">{user?.full_name}</p>
            </div>
            {earnings && (
              <div className="hidden sm:block text-right">
                <p className="text-[10px] uppercase tracking-[3px] text-white/40 font-bold">Total Earnings</p>
                <p className="text-2xl font-bold text-[#7DD3FC]">{rupee(earnings.total_earnings)}</p>
              </div>
            )}
            <Link
              to="/venues"
              className="hidden md:inline-flex text-xs font-semibold bg-[#7DD3FC] text-[#05070B] hover:bg-[#B9EBFF] px-5 py-2.5 rounded-full transition-all hover:-translate-y-0.5"
            >
              View public venues ↗
            </Link>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-1.5 bg-[#11110F] border border-white/10 rounded-full p-1.5 mb-7 w-fit overflow-x-auto max-w-full shadow-lg">
          {NAV_ITEMS.map((n) => (
            <button
              key={n.key}
              onClick={() => setTab(n.key)}
              className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${
                tab === n.key ? "bg-[#B9EBFF] text-[#05070B] shadow-md" : "text-white/65 hover:text-white"
              }`}
            >
              <span className="mr-1">{n.icon}</span>
              {n.key === "associations" && incoming.length > 0 ? `${n.label} (${incoming.length})` : n.label}
            </button>
          ))}
        </div>

        {msg && tab !== "add" && (
          <p className="text-sm text-[#C8A96B] bg-[#151511] border border-[#C8A96B]/20 inline-block px-3 py-2 rounded-lg mb-4">{msg}</p>
        )}

        {notifications.length > 0 && (
          <section className="mb-5 rounded-2xl border border-sky-400/20 bg-[#11110F] p-4">
            <div className="mb-2 flex items-center justify-between"><h2 className="font-semibold">Booking notifications</h2><span className="text-xs text-sky-300">{notifications.filter((item) => !item.is_read).length} unread</span></div>
            <div className="space-y-2">{notifications.slice(0, 4).map((item) => <button key={item.id} type="button" onClick={() => markOwnerNotificationRead(item)} className={`w-full rounded-lg border p-3 text-left ${item.is_read ? "border-white/5" : "border-sky-300/20 bg-sky-300/[0.04]"}`}><span className="block text-sm font-semibold">{item.title}</span><span className="mt-1 block whitespace-pre-line text-xs text-white/55">{item.message}</span></button>)}</div>
          </section>
        )}

        {loading ? (
          <p className="text-white/35 py-16 text-center">Loading your business overview…</p>
        ) : (
          <>
            {tab === "overview" && earnings && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  {[
                    { label: "Total Earnings", value: rupee(earnings.total_earnings), color: "text-[#7DD3FC]" },
                    { label: "Total Bookings", value: earnings.total_bookings, color: "text-[#F4F0E7]" },
                    { label: "Confirmed", value: earnings.confirmed_bookings, color: "text-teal" },
                    { label: "Listed Venues", value: earnings.venue_count, color: "text-[#C8A96B]" },
                  ].map((s) => (
                    <div key={s.label} className="bg-[#11110F] border border-white/10 rounded-[20px] p-6 shadow-[0_24px_70px_rgba(0,0,0,.28)]">
                      <p className="text-[10px] uppercase tracking-[2px] text-white/40 font-bold mb-2">{s.label}</p>
                      <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                    </div>
                  ))}
                </div>
                <div className={CARD}>
                  <h2 className="font-serif text-lg sm:text-xl font-bold mb-1">Recent Bookings</h2>
                  <p className="text-sm text-white/45 mb-4">Latest activity across your venues.</p>
                  <div className="space-y-2">
                    {bookings.slice(0, 5).map((b) => (
                      <div key={b.id} className={`${ROW} flex items-center justify-between text-sm gap-3`}>
                        <span className="font-medium">Booking #{b.id} · Venue #{b.venue_id}</span>
                        <span className="flex items-center gap-3 text-white/50">
                          {b.event_date}
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${statusTone(b.status)}`}>{b.status}</span>
                        </span>
                      </div>
                    ))}
                    {bookings.length === 0 && <p className="text-sm text-white/35">No bookings yet.</p>}
                  </div>
                </div>
              </motion.div>
            )}

            {tab === "venues" && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={CARD}>
                <h2 className="font-serif text-lg sm:text-xl font-bold mb-1">My Venues</h2>
                <p className="text-sm text-white/45 mb-5">Everything you currently have listed.</p>
                {venues.length === 0 && <p className="text-sm text-white/35">You have not listed any venues yet — add your first one.</p>}
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {venues.map((v) => (
                    <div key={v.id} className="bg-[#171714]/[0.035] border border-white/10 rounded-2xl overflow-hidden hover:border-[#7DD3FC]/40 transition-colors">
                      <img src={v.image_url} alt={v.name} className="h-36 w-full object-cover" />
                      <div className="p-4">
                        <h3 className="font-serif font-bold">{v.name}</h3>
                        <p className="text-xs text-white/45 mb-1">{v.city} · {v.category}</p>
                        <p className="text-sm font-semibold text-[#C8A96B]">{rupee(v.price_per_day)}/day</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {tab === "bookings" && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={CARD}>
                <h2 className="font-serif text-lg sm:text-xl font-bold mb-1">Bookings</h2>
                <p className="text-sm text-white/45 mb-5">Every booking placed across all your venues.</p>
                <div className="space-y-2">
                  {bookings.length === 0 && <p className="text-sm text-white/35">No bookings yet for your venues.</p>}
                  {bookings.map((b) => {
                    const caterer = bookingDetails.cateringServices?.[b.catering_service_id] || bookingDetails.caterers[b.caterer_id];
                    const photographer = bookingDetails.photographers[b.photographer_id];
                    const menu = bookingDetails.menus[b.menu_package_id];
                    const venue = bookingDetails.venues[b.venue_id];
                    const selectedAddons = addonIds(b.addon_ids)
                      .map((id) => bookingDetails.venues[b.venue_id]?.addons?.find((addon) => addon.id === id))
                      .filter(Boolean);
                    const review = (bookingDetails.reviews[b.venue_id] || [])
                      .find((item) => item.author_id === b.customer_id);
                    const balance = Math.max(0, Number(b.total_amount || 0) - Number(b.advance_paid || 0));

                    return (
                      <div key={b.id} className={`${ROW} space-y-4`}>
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="font-semibold text-sm">Booking #{b.id} · Venue #{b.venue_id}</p>
                            <p className="text-xs text-white/45">{displayDate(b.event_date, { day: "numeric", month: "short", year: "numeric" })} · {b.guest_count} guests</p>
                            {b.customer_name && <p className="text-xs text-white/60 mt-1">Customer: {b.customer_name}{b.customer_email ? ` · ${b.customer_email}` : ""}{b.customer_phone ? ` · ${b.customer_phone}` : ""}</p>}
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${statusTone(b.status)}`}>{b.status}</span>
                            <p className="font-bold text-[#C8A96B]">{rupee(b.total_amount)}</p>
                          </div>
                        </div>

                        {(
                          <div className="grid gap-3 lg:grid-cols-2 text-sm">
                          <div className="rounded-lg border border-white/10 bg-black/10 p-3">
                            <p className="text-[10px] uppercase tracking-[2px] text-white/40 font-bold mb-2">Venue Details</p>
                            <p className="text-white/80">{venue?.name || `Venue #${b.venue_id}`}</p>
                            <p className="text-xs text-white/45 mt-1">{[venue?.category, venue?.city, venue?.state].filter(Boolean).join(" · ") || "Venue details unavailable"}</p>
                            {venue?.address && <p className="text-xs text-white/45 mt-1">{venue.address}</p>}
                          </div>

                          <div className="rounded-lg border border-white/10 bg-black/10 p-3">
                            <p className="text-[10px] uppercase tracking-[2px] text-white/40 font-bold mb-2">Caterer & Menu</p>
                            <p className="text-white/80">{b.catering_service_name || (caterer ? caterer.name : "No caterer selected")} · {rupee(b.caterer_amount)}</p>
                            {b.catering_request_status && <p className="text-xs text-white/45 mt-1">Catering request: <span className="capitalize">{b.catering_request_status}</span></p>}
                            {b.catering_request_note && <p className="text-xs text-white/65 mt-2 whitespace-pre-line">{b.catering_request_note}</p>}
                            {b.catering_service_id && <p className="text-xs text-white/50 mt-2">Service: Catering · {b.guest_count} guests · Status: {b.catering_request_status || b.status}</p>}
                            <p className="text-xs text-white/45 mt-1">{menu ? `${menu.name} · ${rupee(b.menu_amount)}` : "No menu selected"}</p>
                          </div>

                          <div className="rounded-lg border border-white/10 bg-black/10 p-3">
                            <p className="text-[10px] uppercase tracking-[2px] text-white/40 font-bold mb-2">Photographer</p>
                            <p className="text-white/80">{photographer ? `${photographer.name} · ${rupee(b.photographer_amount)}` : "No photographer selected"}</p>
                            {photographer?.style && <p className="text-xs text-white/45 mt-1">{photographer.style}</p>}
                          </div>

                          <div className="rounded-lg border border-white/10 bg-black/10 p-3">
                            <p className="text-[10px] uppercase tracking-[2px] text-white/40 font-bold mb-2">Add-ons</p>
                            <p className="text-white/80">{selectedAddons.length ? selectedAddons.map((addon) => addon.name).join(", ") : "No add-ons selected"}</p>
                            {selectedAddons.length > 0 && <p className="text-xs text-white/45 mt-1">{rupee(b.addon_amount)} total</p>}
                          </div>

                          <div className="rounded-lg border border-white/10 bg-black/10 p-3">
                            <p className="text-[10px] uppercase tracking-[2px] text-white/40 font-bold mb-2">Playlist</p>
                            {b.playlist?.length ? (
                              <ul className="space-y-1 text-white/80">
                                {b.playlist.map((song) => <li key={song.id}>♪ {song.title}{song.artist ? ` — ${song.artist}` : ""}{song.note ? ` (${song.note})` : ""}</li>)}
                              </ul>
                            ) : <p className="text-white/80">No playlist submitted</p>}
                          </div>

                          <div className="rounded-lg border border-white/10 bg-black/10 p-3">
                            <p className="text-[10px] uppercase tracking-[2px] text-white/40 font-bold mb-2">Customer Review</p>
                            {review ? (
                              <>
                                <p className="text-white/80">{review.rating.toFixed(1)} / 5 ★</p>
                                <p className="text-xs text-white/45 mt-1">{review.comment || "No written feedback."}</p>
                              </>
                            ) : <p className="text-white/80">No review submitted</p>}
                          </div>

                          <div className="rounded-lg border border-white/10 bg-black/10 p-3">
                            <p className="text-[10px] uppercase tracking-[2px] text-white/40 font-bold mb-2">Payment History</p>
                            <p className="text-white/80">Booking created · {displayDate(b.created_at, { day: "numeric", month: "short", year: "numeric" })}</p>
                            <p className="text-xs text-white/45 mt-1">{b.advance_paid > 0 ? `Advance paid: ${rupee(b.advance_paid)} · Ref ${b.payment_ref || "—"}` : `Advance pending: ${rupee(Number(b.total_amount || 0) * (Number(b.advance_percent || 0) / 100))}`}</p>
                            <p className="text-xs text-white/45 mt-1">Balance due at venue: {rupee(balance)}</p>
                            {b.refund_amount > 0 && <p className="text-xs text-rose mt-1">Refund: {rupee(b.refund_amount)} ({b.refund_percent}%)</p>}
                          </div>

                        </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {tab === "associations" && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className={CARD}>
                  <h2 className="font-serif text-lg sm:text-xl font-bold mb-1">Incoming Requests</h2>
                  <p className="text-sm text-white/45 mb-4">Review professionals who want to work with your venues.</p>
                  {incoming.length === 0 ? (
                    <p className="text-sm text-white/35">No pending association requests.</p>
                  ) : (
                    <div className="space-y-2">
                      {incoming.map((a) => (
                        <div key={a.id} className={`${ROW} flex flex-wrap items-center justify-between gap-3`}>
                          <div>
                            <p className="font-semibold text-sm">{a.party?.full_name || "Professional"}</p>
                            <p className="text-xs text-white/45">{a.party?.vendor_type || "Service provider"} · {a.party?.venue_count ?? 0} venue(s)</p>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => respondAssociation(a.id, "accepted")} className="text-xs font-semibold px-3 py-1.5 rounded-full bg-[#6FB89A]/15 text-teal hover:bg-[#6FB89A]/25">Accept</button>
                            <button onClick={() => respondAssociation(a.id, "declined")} className="text-xs font-semibold px-3 py-1.5 rounded-full bg-[#C96C73]/10 text-rose hover:bg-[#C96C73]/20">Decline</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className={CARD}>
                  <h2 className="font-serif text-lg sm:text-xl font-bold mb-4">Accepted Partners</h2>
                  {accepted.length === 0 ? (
                    <p className="text-sm text-white/35">No accepted partners yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {accepted.map((a) => (
                        <div key={a.id} className={`${ROW} flex items-center justify-between`}>
                          <div>
                            <p className="font-semibold text-sm">{a.party?.full_name || "Partner"}</p>
                            <p className="text-xs text-white/45 capitalize">{a.party?.vendor_type || "Service provider"}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#6FB89A]/15 text-teal">Accepted</span>
                            <button type="button" onClick={() => disconnectAssociation(a.id, a.party?.full_name)} className={GHOST}>
                              Disconnect
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {tab === "add" && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={CARD}>
                <h2 className="font-serif text-lg sm:text-xl font-bold mb-1">List a New Venue</h2>
                <p className="text-sm text-white/45 mb-6">Add another property to your portfolio.</p>
                <form onSubmit={handleAddVenue} className="grid sm:grid-cols-2 gap-4 max-w-3xl">
                  <div className="sm:col-span-2">
                    <label className={LABEL}>Venue Name</label>
                    <input required className={FIELD} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  </div>
                  <div>
                    <label className={LABEL}>City</label>
                    <input required className={FIELD} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
                  </div>
                  <div>
                    <label className={LABEL}>Category</label>
                    <select className={FIELD} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                      {["Banquet Hall", "Outdoor Lawn", "Corporate Space", "Community Hall", "Resort"].map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className={LABEL}>Address</label>
                    <input className={FIELD} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
                  </div>
                  <div>
                    <label className={LABEL}>Capacity (guests)</label>
                    <input type="number" className={FIELD} value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} />
                  </div>
                  <div>
                    <label className={LABEL}>Price / day (₹)</label>
                    <input type="number" className={FIELD} value={form.price_per_day} onChange={(e) => setForm({ ...form, price_per_day: e.target.value })} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={LABEL}>Image URL</label>
                    <input className={FIELD} placeholder="https://…" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={LABEL}>Amenities (comma separated)</label>
                    <input className={FIELD} placeholder="Parking, AC, Stage" value={form.amenities} onChange={(e) => setForm({ ...form, amenities: e.target.value })} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={LABEL}>Description</label>
                    <textarea className={FIELD} rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                  </div>
                  {msg && <p className="sm:col-span-2 text-sm text-[#C8A96B] font-semibold">{msg}</p>}
                  <div className="sm:col-span-2">
                    <button type="submit" className="text-sm font-semibold bg-[#7DD3FC] text-[#05070B] hover:bg-[#B9EBFF] px-6 py-2.5 rounded-full transition-all hover:-translate-y-0.5">
                      List Venue
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
