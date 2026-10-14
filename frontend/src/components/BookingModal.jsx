import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";
import Calendar from "./Calendar.jsx";
import RatingPicker from "./RatingPicker.jsx";
import PlaylistBuilder from "./PlaylistBuilder.jsx";
import RefundPolicy from "./RefundPolicy.jsx";

const STEPS = ["Date & Guests", "Caterer & Menu", "Photographer", "Add-ons", "Playlist", "Review", "Pay via QR"];
const ADVANCE_RATE = 0.3;
const PAY_STEP = STEPS.length - 1; // index of the "Pay via QR" step

// Planning estimate for a custom menu before a caterer is chosen. A full
// package/caterer rate remains the authority once one is selected. Quantities
// are servings per guest, so a single roti is priced as one bread serving.
const DISH_ESTIMATE_RATES = [
  { match: /roti|chapati|phulka|naan|paratha|kulcha/i, rate: 18 },
  { match: /rice|pulao|biryani|jeera rice|fried rice/i, rate: 45 },
  { match: /dal|sambar|rasam/i, rate: 40 },
  { match: /paneer|chicken|mutton|fish|kebab|kofta|curry/i, rate: 120 },
  { match: /vegetable|veg|sabzi|mixed/i, rate: 65 },
  { match: /salad|raita|pickle|papad| chutney/i, rate: 25 },
  { match: /dessert|sweet|gulab|halwa|ice cream|kheer/i, rate: 55 },
];

function estimateDishRate(name) {
  return DISH_ESTIMATE_RATES.find(({ match }) => match.test(name))?.rate ?? 60;
}

function buildUpiQrUrl(payeeName, amount, note) {
  const upiString = `upi://pay?pa=venueconnect@upi&pn=${encodeURIComponent(payeeName)}&am=${Number(amount).toFixed(2)}&cu=INR&tn=${encodeURIComponent(note)}`;
  return `https://api.qrserver.com/v1/create-qr-code/?format=png&size=320x320&ecc=H&qzone=2&data=${encodeURIComponent(upiString)}`;
}

// Some "top recommended" venue cards on the homepage/venues page are backed
// by hardcoded preview data (not a real DB record) and may not include an
// `addons` array at all. Falling back to [] here is what stops the whole
// booking modal from crashing to a blank/white page the instant it opens.
function safeAddons(venue) {
  return Array.isArray(venue?.addons) ? venue.addons : [];
}

// FastAPI validation errors come back as an array of {msg, ...} objects
// (or occasionally a plain object) rather than a string. Rendering that
// directly as `{error}` crashes React ("Objects are not valid as a React
// child"), which is another way this modal could go blank — so always
// coerce whatever the API sends back into plain text first.
function extractErrorMessage(err, fallback) {
  const detail = err?.response?.data?.detail;
  if (typeof detail === "string" && detail.trim()) return detail;
  if (Array.isArray(detail) && detail.length) {
    return detail.map((d) => (typeof d === "string" ? d : d?.msg || JSON.stringify(d))).join(", ");
  }
  if (detail && typeof detail === "object") return JSON.stringify(detail);
  return fallback;
}

export default function BookingModal({ venue, selectedTheme, customColors, onClose, initialDate = null }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [date, setDate] = useState(initialDate);
  const [guests, setGuests] = useState(Math.min(200, venue.capacity));
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [caterer, setCaterer] = useState(null);
  const [menu, setMenu] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [menuEditorOpen, setMenuEditorOpen] = useState(false);
  const [newDish, setNewDish] = useState("");
  const [photographer, setPhotographer] = useState(null);
  const [playlist, setPlaylist] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const [pendingBooking, setPendingBooking] = useState(null);
  const [validating, setValidating] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState("idle"); // idle | waiting | failed
  const [qrFailed, setQrFailed] = useState(false);
  const [skippedSteps, setSkippedSteps] = useState([]);

  const themePrice = selectedTheme?.price || 0;
  const addons = safeAddons(venue);
  const addonTotal = addons
    .filter((a) => selectedAddons.includes(a.id))
    .reduce((sum, a) => sum + a.price, 0);
  const cateringRate = Number(caterer?.price_from || caterer?.price_per_plate || menu?.price_per_plate || 0);
  const menuEstimatePerGuest = menuItems.length
    ? (caterer || menu
        ? cateringRate * menuItems.reduce((sum, item) => sum + item.quantity_per_guest, 0) / menuItems.length
        : menuItems.reduce((sum, item) => sum + estimateDishRate(item.name) * item.quantity_per_guest, 0))
    : menu ? Number(menu.price_per_plate || 0) : cateringRate;
  const menuItemEstimate = menuItems.length ? menuEstimatePerGuest * guests : 0;
  const catererBaseTotal = caterer && !menuItems.length ? cateringRate * guests : 0;
  const menuTotal = menuItems.length ? menuItemEstimate : menu ? menu.price_per_plate * guests : 0;
  const catererTotal = menuItems.length ? menuItemEstimate : catererBaseTotal;
  const photographerTotal = photographer ? photographer.package_price : 0;
  const baseTotal = venue.price_per_day + themePrice;
  const grandTotal = baseTotal + addonTotal + catererBaseTotal + menuTotal + photographerTotal;
  const advance = Math.round(grandTotal * ADVANCE_RATE);

  function toggleAddon(id) {
    setSelectedAddons((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function isStepComplete(currentStep) {
    if (currentStep === 0) return Boolean(date);

    if (currentStep === 1) {
      // A selected package can proceed on its own; a manually built menu
      // still needs a caterer so the request has a vendor to receive it.
      return Boolean(caterer || menu) || skippedSteps.includes(1);
    }

    if (currentStep === 2) {
      // Photographer: selected, or explicitly skipped.
      return Boolean(photographer) || skippedSteps.includes(2);
    }

    if (currentStep === 3) {
      // Add-ons: at least one selected, or explicitly skipped.
      return selectedAddons.length > 0 || skippedSteps.includes(3);
    }

    if (currentStep === 4) {
      // Playlist: at least one song, or explicitly skipped.
      return playlist.length > 0 || skippedSteps.includes(4);
    }

    return true;
  }

  function handleSkip() {
    if (step < 1 || step > 4) return;

    setSkippedSteps((prev) =>
      prev.includes(step) ? prev : [...prev, step]
    );

    setError("");
    setStep(step + 1);
  }

  function handleSelectionChange() {
    // Once the user makes a selection, remove the explicit skip marker
    // for that step so the state accurately reflects the current choice.
    setSkippedSteps((prev) => prev.filter((s) => s !== step));
  }

  function selectMenuPackage(value) {
    setMenu(value);
    if (value) {
      setMenuItems(value.items.split(",").map((name) => name.trim()).filter(Boolean).map((name) => ({ name, quantity_per_guest: 1 })));
      setMenuEditorOpen(true);
    }
    setSkippedSteps((prev) => prev.filter((s) => s !== 1));
  }

  function addMenuDish(rawName) {
    const name = rawName.trim();
    if (!name || menuItems.length >= 30 || menuItems.some((item) => item.name.toLowerCase() === name.toLowerCase())) return false;
    setMenuItems((items) => [...items, { name, quantity_per_guest: 1 }]);
    setSkippedSteps((prev) => prev.filter((s) => s !== 1));
    return true;
  }

  async function handleProceedToPayment() {
    if (!user) {
      navigate("/login", { state: { from: `/venues/${venue.id}` } });
      return;
    }
    // Reuse an already-created pending booking (e.g. user went back and
    // forth between Review and the QR screen without changing anything).
    if (pendingBooking) {
      setPaymentStatus("waiting");
      setStep(PAY_STEP);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const bookingRes = await api.post("/bookings", {
        venue_id: venue.id,
        theme_id: selectedTheme?.id || null,
        caterer_id: caterer?.price_from !== undefined ? null : (caterer?.id || null),
        catering_service_id: caterer?.price_from !== undefined ? caterer.id : null,
        photographer_id: photographer?.id || null,
        menu_package_id: menu?.id || null,
        menu_selection: menuItems,
        event_date: date,
        guest_count: guests,
        addon_ids: selectedAddons,
        custom_primary_color: customColors?.primary || "",
        custom_secondary_color: customColors?.secondary || "",
        playlist,
      });
      setPendingBooking(bookingRes.data);
      setQrFailed(false);
      setPaymentStatus("waiting");
      setStep(PAY_STEP);
    } catch (err) {
      setError(extractErrorMessage(err, "Something went wrong. Please try again."));
    } finally {
      setLoading(false);
    }
  }

  async function handleValidatePayment() {
    if (!user) {
      navigate("/login", { state: { from: `/venues/${venue.id}` } });
      return;
    }
    if (!pendingBooking) return;
    setValidating(true);
    setError("");
    try {
      // Mock Razorpay (test mode) verification — in production this would
      // verify the Razorpay payment signature server-side before confirming.
      const payRes = await api.post("/bookings/pay", {
        booking_id: pendingBooking.id,
        payment_ref: `rzp_test_${Date.now()}`,
        amount_paid: paymentAmount,
      });
      setPaymentStatus("idle");
      setConfirmedBooking(payRes.data);
      setStep(STEPS.length);
    } catch (err) {
      setPaymentStatus("failed");
      setError(extractErrorMessage(err, "We couldn't confirm your payment. Please try again."));
    } finally {
      setValidating(false);
    }
  }

  function handleBackFromPayment() {
    // Abandon the pending (unpaid) booking if the user backs out and
    // changes their selections; a fresh one is created on re-entry.
    setPendingBooking(null);
    setPaymentStatus("idle");
    setError("");
    setStep(PAY_STEP - 1);
  }

  const isDone = step === STEPS.length;
  const paymentAmount = pendingBooking
    ? Math.round(Number(pendingBooking.total_amount) * (Number(pendingBooking.advance_percent) / 100) * 100) / 100
    : advance;
  const qrUrl = pendingBooking ? buildUpiQrUrl(venue.name, paymentAmount, `Booking ${pendingBooking.id} advance`) : "";

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">

        <style>{`
          .booking-modal-scroll {
            overflow-x: hidden !important;
            scrollbar-width: thin;
            scrollbar-color: #2f80ff transparent;
          }

          /* Main modal scrollbar — thin and compact */
          .booking-modal-scroll::-webkit-scrollbar {
            width: 4px;
            height: 0;
          }
          .booking-modal-scroll::-webkit-scrollbar-track {
            background: transparent;
          }
          .booking-modal-scroll::-webkit-scrollbar-thumb {
            background: #2f80ff;
            border-radius: 999px;
            border-top: 42px solid transparent;
            border-bottom: 42px solid transparent;
            background-clip: padding-box;
          }
          .booking-modal-scroll::-webkit-scrollbar-thumb:hover {
            background: #2f80ff;
            background-clip: padding-box;
          }

          /* Every inner scroll area — thinner than the main scrollbar */
          .booking-modal-scroll * {
            scrollbar-width: thin;
            scrollbar-color: #2f80ff transparent;
          }
          .booking-modal-scroll *::-webkit-scrollbar {
            width: 3px;
            height: 0;
          }
          .booking-modal-scroll *::-webkit-scrollbar-track {
            background: transparent;
          }
          .booking-modal-scroll *::-webkit-scrollbar-thumb {
            background: #2f80ff;
            border-radius: 999px;
          }
          .booking-modal-scroll *::-webkit-scrollbar-thumb:hover {
            background: #2f80ff;
          }

          /* Step tabs: no horizontal scrollbar */
          .booking-step-tabs {
            overflow-x: hidden !important;
            overflow-y: hidden !important;
            scrollbar-width: none !important;
          }
          .booking-step-tabs::-webkit-scrollbar {
            display: none !important;
            width: 0 !important;
            height: 0 !important;
          }
        `}</style>
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="booking-modal-scroll bg-black text-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl border border-zinc-800"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 sticky top-0 bg-black z-10">
          <h3 className="font-serif text-xl font-bold text-white">Book {venue.name}</h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 text-2xl leading-none">×</button>
        </div>

        {!isDone && (
          <div className="booking-step-tabs flex items-center gap-1.5 px-6 pt-4 text-[11px] font-semibold">
            {STEPS.map((s, i) => (
              <React.Fragment key={s}>
                <span className={`px-2.5 py-1 rounded-full whitespace-nowrap ${i === step ? "bg-plum text-white" : i < step ? "bg-gold-light text-white" : "bg-[#111111] text-zinc-400"}`}>
                  {i + 1}. {s}
                </span>
                {i < STEPS.length - 1 && <span className="text-gray-300">—</span>}
              </React.Fragment>
            ))}
          </div>
        )}

        <div className="p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.22 }}
            >
              {step === 0 && (
                <div className="grid md:grid-cols-2 gap-6">
                  <Calendar venueId={venue.id} selectedDate={date} onSelect={setDate} />
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-zinc-300 mb-1">Guest Count</label>
                      <input
                        type="number"
                        className="input !bg-[#111111] !text-white !border-zinc-700 placeholder:!text-zinc-500"
                        value={guests}
                        min={1}
                        max={venue.capacity}
                        onChange={(e) => setGuests(Number(e.target.value))}
                      />
                      <p className="text-xs text-zinc-500 mt-1">Venue capacity: {venue.capacity} guests</p>
                    </div>
                    {selectedTheme && (
                      <div className="p-3 rounded-lg bg-[#111111]">
                        <p className="text-xs text-zinc-400">Selected Decoration Theme</p>
                        <p className="font-semibold text-white">{selectedTheme.name}</p>
                        <p className="text-sm text-gold font-bold">+ ₹{selectedTheme.price.toLocaleString("en-IN")}</p>
                      </div>
                    )}
                    <RefundPolicy compact />
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="space-y-6">
                  <section className="rounded-xl border border-zinc-700 bg-[#101010] p-4 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <h4 className="font-serif font-bold text-white">Build your menu first</h4>
                          <p className="text-xs text-zinc-400">Choose a package or add dishes manually, then set quantity per guest.</p>
                        </div>
                        <button type="button" onClick={() => setMenuEditorOpen((open) => !open)} className="btn-gold !py-2 !px-4 text-sm">
                          {menuEditorOpen ? "Hide custom menu" : menuItems.length ? "Edit custom menu" : "+ Create custom menu"}
                        </button>
                      </div>
                      {menuEditorOpen && (
                        <div className="space-y-3">
                          <div className="flex flex-wrap gap-2">
                            {["Roti", "Rice", "Dal", "Paneer curry", "Mixed vegetables", "Salad", "Dessert"].map((dish) => (
                              <button key={dish} type="button" onClick={() => addMenuDish(dish)} className="rounded-full border border-zinc-700 px-3 py-1 text-xs text-zinc-200 hover:border-gold">
                                + {dish}
                              </button>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <input value={newDish} onChange={(event) => setNewDish(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); if (addMenuDish(newDish)) setNewDish(""); } }} placeholder="Type a dish name (e.g. Jeera rice)" className="input !bg-black !text-white !border-zinc-700" />
                            <button type="button" onClick={() => { if (addMenuDish(newDish)) setNewDish(""); }} className="btn-outline !px-4">Add dish</button>
                          </div>
                          {menuItems.length === 0 ? <p className="text-xs text-zinc-500">Choose a dish above or add your own.</p> : (
                            <div className="space-y-2">
                              {menuItems.map((item, index) => (
                                <div key={`${item.name}-${index}`} className="grid grid-cols-[1fr_6rem_auto] sm:grid-cols-[1fr_7rem_auto] items-center gap-2 rounded-lg bg-black/60 px-3 py-2">
                                  <span className="text-sm text-white">{item.name}</span>
                                  <label className="text-[10px] text-zinc-400">Per guest<input type="number" min="1" max="50" value={item.quantity_per_guest} onChange={(event) => { const quantity = Math.max(1, Math.min(50, Number(event.target.value) || 1)); setMenuItems((items) => items.map((entry, i) => i === index ? { ...entry, quantity_per_guest: quantity } : entry)); }} className="input !mt-1 !py-1 !px-2 !bg-[#171717] !text-white !border-zinc-700" /></label>
                                  <button type="button" aria-label={`Remove ${item.name}`} onClick={() => setMenuItems((items) => items.filter((_, i) => i !== index))} className="text-xs text-red-300">Remove</button>
                                </div>
                              ))}
                              <div className="rounded-lg border border-gold/20 bg-gold/5 p-3 text-sm text-zinc-300">
                                <div className="flex justify-between"><span>Estimate per guest</span><strong className="text-gold">₹{menuEstimatePerGuest.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</strong></div>
                                <div className="mt-1 flex justify-between"><span>{guests} guests · estimated menu total</span><strong className="text-gold">₹{menuItemEstimate.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</strong></div>
                                <p className="mt-1 text-[11px] text-zinc-500">{caterer || menu ? "Estimate uses the selected caterer or package rate." : "Planning estimate uses typical per-serving dish prices; the caterer confirms the final price."} The caterer confirms the final price.</p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                  </section>
                  <div>
                    <h4 className="font-serif font-bold text-white mb-2">Choose a Menu Package</h4>
                    <RatingPicker
                      endpoint="/catalog/menus"
                      selectedId={menu?.id}
                      onSelect={(value) => {
                        selectMenuPackage(value);
                      }}
                      priceLabel={(m) => `₹${m.price_per_plate}/plate`}
                      subtitle={(m) => m.items.split(",").slice(0, 3).join(", ")}
                    />
                  </div>

                  <div>
                    <h4 className="font-serif font-bold text-white mb-2">Choose a Caterer</h4>
                    <p className="text-xs text-zinc-500 mb-3">Your menu estimate updates when you select a caterer and its rate is applied.</p>
                    <RatingPicker
                      endpoint="/catalog/catering-services"
                      selectedId={caterer?.id}
                      onSelect={(value) => {
                        setCaterer(value);
                        setSkippedSteps((prev) => prev.filter((s) => s !== 1));
                      }}
                      priceLabel={(c) => `₹${Number(c.price_from || 850).toLocaleString("en-IN")}/guest from`}
                      subtitle={(c) => [c.provider_name, c.city].filter(Boolean).join(" · ") || c.description || "Catering service"}
                    />
                  </div>

                  {!isStepComplete(1) && (
                    <p className="text-xs text-amber-400 mt-2">
                      {menuItems.length ? "Choose a caterer to estimate and send this menu, or click Skip." : "Choose a menu or caterer, or click Skip."}
                    </p>
                  )}
                </div>
              )}

              {step === 2 && (
                <div>
                  <h4 className="font-serif font-bold text-white mb-2">Choose a Photographer</h4>
                  <RatingPicker
                    endpoint="/catalog/photographers"
                    selectedId={photographer?.id}
                    onSelect={(value) => {
                      setPhotographer(value);
                      setSkippedSteps((prev) => prev.filter((s) => s !== 2));
                    }}
                    priceLabel={(p) => `₹${p.package_price.toLocaleString("en-IN")}`}
                    subtitle={(p) => p.style}
                  />

                  {!isStepComplete(2) && (
                    <p className="text-xs text-amber-400 mt-2">
                      Select a photographer or click Skip.
                    </p>
                  )}
                </div>
              )}

              {step === 3 && (
                <div className="grid sm:grid-cols-2 gap-3">
                  {addons.length === 0 && (
                    <p className="text-sm text-zinc-500 col-span-full">No add-ons available for this venue — click Continue or Skip.</p>
                  )}
                  {addons.map((addon) => (
                    <label
                      key={addon.id}
                      className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedAddons.includes(addon.id) ? "border-gold bg-[#111111]" : "border-zinc-800"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedAddons.includes(addon.id)}
                        onChange={() => {
                          toggleAddon(addon.id);
                          setSkippedSteps((prev) => prev.filter((s) => s !== 3));
                        }}
                        className="mt-1 accent-plum"
                      />
                      <span className="flex-1">
                        <span className="block font-semibold text-sm text-white">{addon.name}</span>
                        <span className="block text-xs text-zinc-500 capitalize">{addon.category}</span>
                      </span>
                      <span className="text-sm font-bold text-plum">₹{addon.price.toLocaleString("en-IN")}</span>
                    </label>
                  ))}
                </div>
              )}

              {step === 4 && (
                <PlaylistBuilder
                  playlist={playlist}
                  setPlaylist={(value) => {
                    setPlaylist(value);
                    setSkippedSteps((prev) => prev.filter((s) => s !== 4));
                  }}
                />
              )}

              {step === 5 && (
                <div className="space-y-4">
                  <div className="rounded-lg border border-zinc-800 divide-y">
                    <div className="flex justify-between px-4 py-2.5 text-sm">
                      <span>Event Date</span><span className="font-semibold">{date}</span>
                    </div>
                    <div className="flex justify-between px-4 py-2.5 text-sm">
                      <span>Guests</span><span className="font-semibold">{guests}</span>
                    </div>
                    <div className="flex justify-between px-4 py-2.5 text-sm">
                      <span>Venue Charge</span><span className="font-semibold">₹{venue.price_per_day.toLocaleString("en-IN")}</span>
                    </div>
                    {selectedTheme && (
                      <div className="flex justify-between px-4 py-2.5 text-sm">
                        <span>Theme — {selectedTheme.name}</span><span className="font-semibold">₹{themePrice.toLocaleString("en-IN")}</span>
                      </div>
                    )}
                    {caterer && (
                      <div className="flex justify-between px-4 py-2.5 text-sm">
                        <span>Caterer — {caterer.name}{menuItems.length ? " (menu estimate shown below)" : ` (${guests}×₹${catererRate.toLocaleString("en-IN")}/guest)`}</span>{!menuItems.length && <span className="font-semibold">₹{catererTotal.toLocaleString("en-IN")}</span>}
                      </div>
                    )}
                    {menuItems.length > 0 && (
                      <div className="px-4 py-2.5 text-sm">
                        <div className="flex justify-between"><span>Custom menu estimate</span><span className="font-semibold">₹{menuItemEstimate.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span></div>
                        <ul className="mt-2 space-y-1 text-xs text-zinc-400">{menuItems.map((item, index) => <li key={`${item.name}-${index}`}>{item.name}: {item.quantity_per_guest} per guest · {item.quantity_per_guest * guests} portions</li>)}</ul>
                      </div>
                    )}
                    {menu && (
                      <div className="flex justify-between px-4 py-2.5 text-sm">
                        <span>Menu — {menu.name} ({guests}×₹{menu.price_per_plate})</span><span className="font-semibold">₹{menuTotal.toLocaleString("en-IN")}</span>
                      </div>
                    )}
                    {photographer && (
                      <div className="flex justify-between px-4 py-2.5 text-sm">
                        <span>Photographer — {photographer.name}</span><span className="font-semibold">₹{photographerTotal.toLocaleString("en-IN")}</span>
                      </div>
                    )}
                    <div className="flex justify-between px-4 py-2.5 text-sm">
                      <span>Add-ons ({selectedAddons.length})</span><span className="font-semibold">₹{addonTotal.toLocaleString("en-IN")}</span>
                    </div>
                    {playlist.length > 0 && (
                      <div className="flex justify-between px-4 py-2.5 text-sm">
                        <span>Playlist submitted</span><span className="font-semibold">{playlist.length} songs</span>
                      </div>
                    )}
                    <div className="flex justify-between px-4 py-3 text-base bg-[#111111] font-bold text-white">
                      <span>Total</span><span>₹{grandTotal.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between px-4 py-2.5 text-sm text-gold font-semibold">
                      <span>Pay Now (30% advance)</span><span>₹{advance.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between px-4 py-2.5 text-xs text-zinc-500">
                      <span>Balance due at venue</span><span>₹{(grandTotal - advance).toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                  <RefundPolicy />
                  {error && <p className="text-sm text-red-500">{error}</p>}
                  <p className="text-xs text-zinc-500">
                    Secure test-mode payment via Razorpay. Your card / UPI details are never stored on our servers.
                  </p>
                </div>
              )}

              {step === PAY_STEP && pendingBooking && !user && (
                <div className="flex flex-col items-center text-center py-10">
                  <h4 className="font-serif text-xl font-bold text-white mb-2">Login required</h4>
                  <p className="text-sm text-zinc-400 mb-5 max-w-xs">
                    Sign in to view payment details and continue with this booking.
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate("/login", { state: { from: `/venues/${venue.id}` } })}
                    className="btn-gold !py-2.5 !px-6 text-sm"
                  >
                    Log in to continue
                  </button>
                </div>
              )}

              {step === PAY_STEP && pendingBooking && user && (
                <div className="flex flex-col items-center text-center py-2">
                  <h4 className="font-serif text-xl font-bold text-white mb-1">Scan & Pay</h4>
                  <p className="text-sm text-zinc-400 mb-5 max-w-xs">
                    Scan the QR to pay the advance for Booking #{pendingBooking.id}, or use the test button below to verify the owner and caterer booking flow.
                  </p>

                  <div className="p-3 rounded-2xl border-2 border-zinc-700 bg-white shadow-sm">
                    {!qrFailed ? (
                      <img
                        src={qrUrl}
                        alt={`UPI payment QR for ₹${paymentAmount.toFixed(2)}`}
                        width={320}
                        height={320}
                        onError={() => setQrFailed(true)}
                        className="h-64 w-64 sm:h-80 sm:w-80 rounded-lg"
                      />
                    ) : (
                      <div className="flex h-64 w-64 sm:h-80 sm:w-80 flex-col items-center justify-center rounded-lg bg-zinc-100 px-6 text-center text-zinc-700">
                        <span className="text-3xl">QR</span>
                        <p className="mt-2 text-sm font-semibold">QR image unavailable</p>
                        <p className="mt-1 text-xs">You can still use the test confirmation button below.</p>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 mb-1">
                    <p className="text-2xl font-bold text-white">₹{paymentAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    <p className="text-xs text-zinc-500">UPI address: venueconnect@upi</p>
                  </div>

                  <div className="mt-3 flex items-center gap-2 text-sm font-semibold">
                    {paymentStatus === "waiting" && !validating && (
                      <span className="flex items-center gap-2 text-zinc-400">
                        <span className="w-2 h-2 rounded-full bg-gold animate-pulse" />
                        Waiting for payment…
                      </span>
                    )}
                    {validating && (
                      <span className="flex items-center gap-2 text-plum">
                        <span className="w-2 h-2 rounded-full bg-plum animate-pulse" />
                        Validating payment…
                      </span>
                    )}
                    {paymentStatus === "failed" && (
                      <span className="text-red-500">Payment not verified yet.</span>
                    )}
                  </div>

                  {error && <p className="text-sm text-red-500 mt-2 max-w-xs">{error}</p>}

                  <button
                    disabled={validating}
                    onClick={handleValidatePayment}
                    className="btn-gold !py-2.5 !px-6 text-sm mt-5 disabled:opacity-50"
                  >
                    {validating ? "Confirming test payment…" : "Confirm Test Payment & Send Booking"}
                  </button>
                  <p className="text-xs text-zinc-500 mt-3 max-w-xs">
                    Test mode: this button records the displayed advance and sends the booking to the owner and caterer. It does not charge money.
                  </p>
                </div>
              )}

              {isDone && confirmedBooking && (
                <div className="text-center py-6">
                  <div className="w-16 h-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-3xl mx-auto mb-4">✓</div>
                  <h4 className="font-serif text-2xl font-bold text-white mb-1">{confirmedBooking.status === "pending" ? "Booking Request Sent" : "Booking Confirmed!"}</h4>
                  <p className="text-zinc-400 text-sm mb-4">{confirmedBooking.status === "pending" ? "Your payment was received. The caterer still needs to confirm your menu; you’ll see an update in My Bookings." : "Your booking has been confirmed. Reference: " + confirmedBooking.payment_ref}</p>
                  <div className="inline-block text-left rounded-lg border border-zinc-800 px-5 py-3 text-sm">
                    <p><span className="text-zinc-500">Venue:</span> <span className="font-semibold">{venue.name}</span></p>
                    <p><span className="text-zinc-500">Date:</span> <span className="font-semibold">{confirmedBooking.event_date}</span></p>
                    <p><span className="text-zinc-500">Advance Paid (30%):</span> <span className="font-semibold">₹{confirmedBooking.advance_paid.toLocaleString("en-IN")}</span></p>
                  </div>
                  <div className="mt-4">
                    <a
                      href={`https://www.google.com/maps?q=${encodeURIComponent(`${venue.name}, ${venue.address}, ${venue.city}${venue.state ? ", " + venue.state : ""}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-outline !py-2 !px-4 text-sm inline-flex items-center gap-1.5"
                    >
                      📍 View Venue on Map
                    </a>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-800 sticky bottom-0 bg-black">
          {!isDone ? (
            <>
              <button
                onClick={() => (step === 0 ? onClose() : step === PAY_STEP ? handleBackFromPayment() : setStep(step - 1))}
                className="btn-outline !py-2 !px-4 text-sm"
              >
                {step === 0 ? "Cancel" : "Back"}
              </button>
              {step < PAY_STEP - 1 ? (
                <div className="flex items-center gap-2">
                  {step >= 1 && step <= 4 && (
                    <button
                      type="button"
                      onClick={handleSkip}
                      className="btn-outline !py-1.5 !px-3 text-xs"
                    >
                      Skip
                    </button>
                  )}

                  <button
                    disabled={!isStepComplete(step)}
                    onClick={() => {
                      if (!isStepComplete(step)) return;
                      setError("");
                      setStep(step + 1);
                    }}
                    className="btn-primary !py-2 !px-5 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Continue
                  </button>
                </div>
              ) : step === PAY_STEP - 1 ? (
                <button
                  disabled={loading}
                  onClick={handleProceedToPayment}
                  className="btn-gold !py-2 !px-5 text-sm disabled:opacity-40"
                >
                  {loading ? "Preparing…" : `Continue to Payment (₹${advance.toLocaleString("en-IN")})`}
                </button>
              ) : step === PAY_STEP && !user ? (
                <span className="text-xs text-zinc-500 pr-1">Log in to continue to payment</span>
              ) : (
                <span className="text-xs text-zinc-500 pr-1">Scan the QR to complete payment above</span>
              )}
            </>
          ) : (
            <button onClick={onClose} className="btn-primary !py-2 !px-5 text-sm ml-auto">Done</button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
