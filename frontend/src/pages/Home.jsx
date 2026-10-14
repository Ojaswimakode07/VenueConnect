import React, { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import api from "../api/axios.js";
import VenueCard from "../components/VenueCard.jsx";
import VenueScene3D from "../components/VenueScene3D.jsx";
import VenueGlobeSection from "../components/VenueGlobeSection.jsx";
import { EVENT_TYPES, categoriesForEvent } from "../data/eventTypes.js";
import { useAuth } from "../context/AuthContext.jsx";

// Plain-text feature phrases for the animated ribbon — no icons/emoji here,
// this headline runs as pure typography.
const RIBBON_ITEMS = [
  "Discover Pan-India",
  "Real-Time Availability",
  "Preview in 3D",
  "Caterer, Menu & Photographer",
  "Submit Your Playlist",
  "Pay Just 30% to Book",
];

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

// Two high-quality venue images. The second fades in over the first as the
// visitor scrolls through the hero — a slow, anchored crossfade rather than
// a parallax shift.
const HERO_IMAGES = [
  "https://images.unsplash.com/photo-1519741497674-611481863552?w=1600&q=80",
  "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=1600&q=80",
];

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [city, setCity] = useState("");
  const [eventType, setEventType] = useState("");
  const [date, setDate] = useState("");
  const [venues, setVenues] = useState([]);
  const [flagshipVariant, setFlagshipVariant] = useState("grand_mehfil");

  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 60]);
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0.35]);
  const secondImageOpacity = useTransform(scrollYProgress, [0, 1], [0, 1]);

  useEffect(() => {
    api.get("/venues").then((res) => setVenues(res.data.slice(0, 6)));
  }, []);

  function handleSearch(e) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (city) params.set("city", city);
    if (date) params.set("event_date", date);
    if (eventType) {
      // Route straight into "Search by Event" mode on the Venues page, with
      // the matching venue categories and city carried over, so the top-rated
      // matches for this event are recommended immediately.
      params.set("event_type", eventType);
      params.set("categories", categoriesForEvent(eventType).join(","));
    }
    navigate(`/venues?${params.toString()}`);
  }

  return (
    <div>
      {/* Hero — anchored venue photography with a slow, scroll-linked crossfade
          between two images. No parallax drift on the images themselves. */}
      <section ref={heroRef} className="relative text-white overflow-hidden">
        <div className="absolute inset-0">
          <img src={HERO_IMAGES[0]} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <motion.img
            src={HERO_IMAGES[1]}
            alt=""
            style={{ opacity: secondImageOpacity }}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-mesh-hero-neutral" />
        </div>

        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="relative max-w-7xl mx-auto px-5 py-24 md:py-32 text-center">
          {!user && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-5 flex justify-center"
            >
              <Link
                to="/login"
                className="inline-flex items-center gap-2 pl-4 pr-2 py-1.5 rounded-full bg-white/10 border border-white/15 backdrop-blur-sm text-sm text-white hover:bg-white/20 transition-colors"
              >
                Login to book faster
                <span className="px-2.5 py-0.5 rounded-full bg-gold text-plum-dark text-xs font-bold">Login</span>
              </Link>
            </motion.div>
          )}

          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="uppercase tracking-[3px] text-gold-light text-xs font-bold mb-4"
          >
            Event & Banquet Venue Booking, Reimagined — Now Live Across India
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="font-serif text-4xl md:text-6xl font-bold mb-5 leading-tight"
          >
            Find, Visualize & Book Your <br className="hidden md:block" />
            <span className="gradient-text-jewel">Perfect Venue</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.25 }}
            className="text-gray-300 max-w-2xl mx-auto mb-10"
          >
            Search real-time availability, preview decoration themes in interactive 3D, pick your
            caterer, menu and photographer by rating, submit your playlist — and pay just 30% to
            confirm.
          </motion.p>

          <motion.form
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            onSubmit={handleSearch}
            className="bg-white/95 backdrop-blur-sm rounded-2xl p-3 md:p-2 max-w-3xl mx-auto flex flex-col md:flex-row gap-2 shadow-2xl ring-1 ring-white/20"
          >
            <input
              className="flex-1 px-4 py-3 rounded-xl text-gray-800 focus:outline-none"
              placeholder="City, e.g. Mumbai, Jaipur, Amravati…"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
            <select
              className="select-event"
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
              aria-label="Event"
            >
              <option value="">Event (any)</option>
              {EVENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.icon} {t.value}</option>
              ))}
            </select>
            <input
              type="date"
              className="px-4 py-3 rounded-xl text-gray-800 focus:outline-none"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
            <button type="submit" className="btn-gold whitespace-nowrap">Search Venues</button>
          </motion.form>
        </motion.div>
      </section>

      <VenueGlobeSection />

      {/* Feature Ribbon — a running headline instead of a grid of boxes.
          Two bands scrolling in opposite directions; each item is clickable
          and reacts on hover. Pauses on hover for readability. */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 -mt-10 md:-mt-14 space-y-2"
      >
        {/* Main band — bold, large, dark. Straight, horizontal — no tilt. */}
        <div className="marquee-row relative overflow-hidden">
          <div className="w-full bg-plum-dark shadow-2xl py-6 md:py-9">
            <div className="marquee-track-left flex w-max whitespace-nowrap">
              {[...RIBBON_ITEMS, ...RIBBON_ITEMS].map((item, i) => (
                <button
                  key={i}
                  onClick={() => navigate("/venues")}
                  className="marquee-item px-8 flex items-center gap-8 font-serif font-bold text-3xl md:text-5xl uppercase tracking-tight text-gold-light/85 hover:text-white"
                >
                  {item}
                  <span className="text-gold/40 text-2xl md:text-3xl font-sans">·</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Counter band — thin, quiet, opposite direction. Straight, horizontal — no tilt. */}
        <div className="marquee-row relative overflow-hidden">
          <div className="w-full bg-panel border-y border-gold/20 py-3.5">
            <div className="marquee-track-right flex w-max whitespace-nowrap">
              {[...RIBBON_ITEMS, ...RIBBON_ITEMS].reverse().map((item, i) => (
                <span
                  key={i}
                  className="marquee-item px-6 flex items-center gap-6 font-sans font-semibold text-xs md:text-sm uppercase tracking-[3px] text-plum-dark/45 hover:text-gold cursor-default"
                >
                  {item}
                  <span className="text-gold/40">—</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </motion.section>

      {/* Flagship 3D Spotlight */}
      <motion.section
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.15 }}
        variants={stagger}
        className="max-w-7xl mx-auto px-5 py-24"
      >
        <motion.div variants={fadeUp} className="text-center mb-10">
          <p className="section-eyebrow justify-center flex">Every Venue, Visualized</p>
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-plum-dark mb-3">
            Every Venue Category, Fully Modelled in 3D
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto">
            Banquet halls, garden lawns, beach resorts, corporate stages and community
            halls — each category is hand-built as an interactive 3D scene. Rotate, zoom, and
            change the decoration palette live before you ever step inside.
          </p>
        </motion.div>

        <motion.div variants={fadeUp} className="flex flex-wrap justify-center gap-3 mb-6">
          {[
            { key: "grand_mehfil", label: "Banquet Hall" },
            { key: "rangoli_lawn", label: "Garden Lawn" },
            { key: "beach_resort", label: "Beach Resort" },
            { key: "corporate_hall", label: "Corporate Stage" },
            { key: "community_hall", label: "Community Hall" },
          ].map((v) => (
            <button
              key={v.key}
              onClick={() => setFlagshipVariant(v.key)}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
                flagshipVariant === v.key ? "text-white shadow-lg scale-105" : "bg-panel text-plum-dark hover:bg-gold/20"
              }`}
              style={flagshipVariant === v.key ? { background: "#26241F" } : undefined}
            >
              {v.label}
            </button>
          ))}
        </motion.div>

        <motion.div variants={fadeUp} className="h-[28rem] card p-2 mb-6">
          <VenueScene3D variant={flagshipVariant} primaryColor="#C9A227" secondaryColor="#4A1942" />
        </motion.div>

        <motion.div variants={fadeUp} className="text-center flex flex-wrap items-center justify-center gap-3">
          <Link to="/venues" className="btn-primary">Browse All Venues</Link>
          <Link to="/venues?view=map" className="btn-outline">📍 See All Venues on India Map</Link>
        </motion.div>
      </motion.section>

      {/* Featured Venues */}
      <motion.section
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.1 }}
        variants={stagger}
        className="max-w-7xl mx-auto px-5 py-20"
      >
        <motion.div variants={fadeUp} className="flex items-end justify-between mb-8">
          <div>
            <p className="section-eyebrow">Handpicked Across India</p>
            <h2 className="font-serif text-3xl font-bold text-plum-dark">Featured Venues</h2>
          </div>
          <button onClick={() => navigate("/venues")} className="btn-outline hidden sm:block">
            View All Venues
          </button>
        </motion.div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {venues.map((v) => (
            <motion.div key={v.id} variants={fadeUp}>
              <VenueCard venue={v} />
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Why VenueConnect */}
      <motion.section
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        variants={stagger}
        className="relative py-20 overflow-hidden bg-panel"
      >
        <div className="absolute inset-0 bg-mesh-panel pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-5 grid md:grid-cols-2 gap-12 items-center">
          <motion.div variants={fadeUp}>
            <p className="section-eyebrow">Why VenueConnect</p>
            <h2 className="font-serif text-3xl font-bold text-plum-dark mb-4">
              See your event before you book it
            </h2>
            <p className="text-gray-600 mb-6">
              Most platforms stop at photos. VenueConnect lets you rotate an interactive 3D model
              of the hall with your chosen decoration theme applied — mandap colours, lighting and
              table setup — so there are no surprises on the big day.
            </p>
            <ul className="space-y-3 text-sm text-gray-700">
              <li className="flex items-start gap-2">✅ Real-time availability — zero duplicate bookings</li>
              <li className="flex items-start gap-2">✅ Rating-ranked caterer, menu & photographer marketplace</li>
              <li className="flex items-start gap-2">✅ Pre-submit your event playlist</li>
              <li className="flex items-start gap-2">✅ Pay just 30% advance, transparent tiered refund policy</li>
            </ul>
          </motion.div>
          <motion.div variants={fadeUp} className="card p-3 h-80">
            <img
              src="https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=900"
              alt="Decorated banquet hall"
              className="w-full h-full object-cover rounded-xl"
            />
          </motion.div>
        </div>
      </motion.section>
    </div>
  );
}