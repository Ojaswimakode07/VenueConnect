import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import api from "../api/axios.js";

const TYPE_META = {
  photographer: { icon: "📷", label: "Photographer" },
  catering: { icon: "🍽️", label: "Caterer" },
  decor: { icon: "🎨", label: "Decorator" },
  music: { icon: "🎵", label: "Musician / DJ" },
};

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const EASE = [0.16, 1, 0.3, 1];

const PROFESSIONAL_VIDEOS = {
  photographer: "/professional-videos/photographer.mp4",
  catering: "/professional-videos/caterer.mp4",
  caterer: "/professional-videos/caterer.mp4",
  decor: "/professional-videos/decorator.mp4",
  decorator: "/professional-videos/decorator.mp4",
  music: "/professional-videos/musician.mp4",
  musician: "/professional-videos/musician.mp4",
  dj: "/professional-videos/musician.mp4",
};

function getProfessionalVideo(serviceType) {
  const type = String(serviceType || "").trim().toLowerCase();
  // Falls back to the existing VenueConnect story reel that already ships in /public.
  return PROFESSIONAL_VIDEOS[type] || "/venue-story.mp4";
}

function ProfessionalHeroVideo({ src, poster, alt }) {
  const videoRef = useRef(null);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.15 }
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isVisible) {
      const playPromise = video.play();
      if (playPromise?.catch) playPromise.catch(() => {});
    } else {
      video.pause();
    }
  }, [isVisible, src]);

  return (
    <div className="absolute inset-0 overflow-hidden" aria-label={`${alt} background video`}>
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        poster={poster || undefined}
        className="absolute -inset-y-[8%] left-0 h-[116%] w-full object-cover opacity-85"
      >
        <source src={src} type="video/mp4" />
      </video>
    </div>
  );
}

function buildBookedSet(ranges = []) {
  const set = new Set();
  ranges.forEach((r) => {
    const start = new Date(r.start_date + "T00:00:00");
    const end = new Date(r.end_date + "T00:00:00");
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      set.add(d.toISOString().slice(0, 10));
    }
  });
  return set;
}

function Stars({ value = 0, large = false }) {
  const rounded = Math.max(0, Math.min(5, Math.round(value)));
  return (
    <span className={large ? "text-[#7DD3FC] text-lg tracking-[2px]" : "text-[#7DD3FC] text-sm tracking-wide"} aria-label={`${value} out of 5 stars`}>
      {"★".repeat(rounded)}
      <span className="text-white/15">{"★".repeat(5 - rounded)}</span>
    </span>
  );
}

function SectionLabel({ children }) {
  return (
    <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[3px] text-[#7DD3FC]">
      {children}
    </div>
  );
}

function AvailabilityCalendar({ ranges = [], allBlocked }) {
  const [cursor, setCursor] = useState(() => new Date());
  const booked = buildBookedSet(ranges);
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayIso = new Date().toISOString().slice(0, 10);

  const cells = [];
  for (let i = 0; i < firstDay; i += 1) cells.push(null);
  for (let d = 1; d <= daysInMonth; d += 1) {
    const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    cells.push({
      d,
      iso,
      isBooked: allBlocked || booked.has(iso),
      isPast: iso < todayIso,
    });
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-[#101A26] p-5 shadow-[0_24px_80px_-40px_rgba(0,0,0,0.9)]" data-testid="availability-calendar">
      <div className="flex items-center justify-between mb-5">
        <button
          type="button"
          onClick={() => setCursor(new Date(year, month - 1, 1))}
          className="h-9 w-9 rounded-full border border-white/10 text-[#F8FCFF] transition hover:border-[#7DD3FC] hover:text-[#7DD3FC]"
          aria-label="Previous month"
        >
          ←
        </button>
        <div className="text-center">
          <p className="font-serif text-lg font-bold text-[#F8FCFF]">{MONTHS[month]}</p>
          <p className="text-[10px] uppercase tracking-[2px] text-white/45">{year}</p>
        </div>
        <button
          type="button"
          onClick={() => setCursor(new Date(year, month + 1, 1))}
          className="h-9 w-9 rounded-full border border-white/10 text-[#F8FCFF] transition hover:border-[#7DD3FC] hover:text-[#7DD3FC]"
          aria-label="Next month"
        >
          →
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] font-bold uppercase tracking-wide text-white/35 mb-2">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => <div key={i}>{d}</div>)}
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {cells.map((c, i) => c === null ? (
          <div key={i} />
        ) : (
          <div
            key={i}
            title={c.isBooked ? "Booked / unavailable" : "Open"}
            className={`aspect-square rounded-lg flex items-center justify-center text-[11px] font-semibold transition ${
              c.isPast
                ? "text-white/15"
                : c.isBooked
                ? "bg-[#32191B] text-[#E58A8F]"
                : "bg-[#102536] text-[#7DD3FC] hover:-translate-y-0.5 hover:shadow-[0_12px_30px_-18px_rgba(0,0,0,0.8)]"
            }`}
          >
            {c.d}
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap gap-4 border-t border-white/10 pt-4 text-[10px] font-medium text-white/50">
        <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[#7DD3FC]" /> Available</span>
        <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[#C96C73]" /> Booked</span>
      </div>
    </div>
  );
}

function FillLetter({ letter, index, total, progress }) {
  const start = Math.max(0, index / Math.max(total, 1) - 0.08);
  const end = Math.min(1, start + 0.10);
  const color = useTransform(
    progress,
    [start, end],
    ["rgba(245,241,232,0.22)", "rgba(245,241,232,1)"]
  );
  const y = useTransform(progress, [start, end], [4, 0]);

  return (
    <motion.span
      style={{ color, y }}
      className="inline-block will-change-transform"
    >
      {letter === " " ? "\u00A0" : letter}
    </motion.span>
  );
}

function ScrollFillText({ children }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 82%", "end 24%"],
  });
  const text = String(children || "").trim();
  const words = text.split(/\s+/);
  const letters = Array.from(text);
  const totalLetters = letters.length;
  let letterIndex = 0;

  return (
    <p
      ref={ref}
      className="min-w-0 max-w-3xl font-display text-4xl leading-[1.05] tracking-[-1px] text-[#F8FCFF] sm:text-5xl lg:text-6xl break-normal"
    >
      {words.map((word, wordIndex) => {
        const wordLetters = Array.from(word);
        const renderedWord = (
          <span
            key={`${word}-${wordIndex}`}
            className="inline-block whitespace-nowrap"
          >
            {wordLetters.map((letter, index) => {
              const currentIndex = letterIndex++;
              return (
                <FillLetter
                  key={`${word}-${index}-${currentIndex}`}
                  letter={letter}
                  index={currentIndex}
                  total={totalLetters}
                  progress={scrollYProgress}
                />
              );
            })}
          </span>
        );

        return (
          <React.Fragment key={`word-${wordIndex}`}>
            {renderedWord}
            {wordIndex < words.length - 1 ? " " : null}
          </React.Fragment>
        );
      })}
    </p>
  );
}

function Reveal({ children, delay = 0, className = "" }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 35 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.7, delay, ease: EASE }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function ParallaxImage({ src, alt, className = "", speed = 60, scale = 1.08, overlay = false }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [speed, -speed]);
  const imageScale = useTransform(scrollYProgress, [0, 0.5, 1], [scale, 1, scale]);

  return (
    <div ref={ref} className="absolute inset-0 overflow-hidden">
      <motion.img
        src={src}
        alt={alt}
        style={{ y, scale: imageScale }}
        className={className}
      />
      {overlay && <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />}
    </div>
  );
}

export default function ProfessionalDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pro, setPro] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [lightbox, setLightbox] = useState(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
  const [reviewMsg, setReviewMsg] = useState("");

  async function load() {
    const res = await api.get(`/catalog/professionals/${id}`);
    setPro(res.data);
  }

  useEffect(() => {
    window.scrollTo(0, 0);
    load().catch(() => setNotFound(true));
  }, [id]);

  useEffect(() => {
    if (!lightbox) return undefined;
    const onKeyDown = (e) => e.key === "Escape" && setLightbox(null);
    window.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [lightbox]);

  async function submitReview(e) {
    e.preventDefault();
    setReviewMsg("");
    try {
      await api.post(`/catalog/professionals/${id}/reviews`, reviewForm);
      setReviewForm({ rating: 5, comment: "" });
      setReviewMsg("Thank you! Your review has been posted.");
      await load();
    } catch (err) {
      setReviewMsg(
        err?.response?.status === 401
          ? "Please log in to post a review."
          : (err?.response?.data?.detail || "Could not post review.")
      );
    }
  }

  if (notFound) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-5 text-center">
        <div>
          <p className="mb-4 text-white/50">This professional could not be found.</p>
          <Link to="/services" className="btn-primary">Back to Services</Link>
        </div>
      </div>
    );
  }

  if (!pro) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center text-white/45">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-[#7DD3FC]" />
          <p className="text-sm">Loading professional profile…</p>
        </div>
      </div>
    );
  }

  const meta = TYPE_META[pro.service_type] || { icon: "✨", label: "Professional" };
  const portfolio = pro.portfolio || [];
  const reviews = pro.reviews || [];
  const associatedVendors = pro.associated_vendors || [];
  const rating = Number(pro.rating_avg || 0);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#05070B] text-[#F8FCFF]" data-testid="professional-detail">
      <div className="pointer-events-none absolute -top-48 left-1/2 h-[620px] w-[620px] -translate-x-1/2 rounded-full bg-[#7DD3FC]/[0.06] blur-3xl" />
      <div className="pointer-events-none absolute left-[-220px] top-[900px] h-[520px] w-[520px] rounded-full bg-[#102536]/30 blur-3xl" />

      {/* HERO */}
      <section className="relative mx-auto max-w-[1500px] px-5 pb-14 pt-7 sm:px-8 lg:px-12 lg:pb-24 lg:pt-10">
        <div className="mb-7 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="group flex items-center gap-2 text-[11px] font-bold uppercase tracking-[2px] text-white/50 transition hover:text-[#F8FCFF]"
            data-testid="back-btn"
          >
            <span className="transition-transform group-hover:-translate-x-1">←</span>
            Back
          </button>
          <span className="hidden text-[10px] font-bold uppercase tracking-[3px] text-white/30 sm:block">VenueConnect / Professional</span>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: EASE }}
          className="relative min-h-[600px] overflow-hidden rounded-[28px] bg-[#05070B] shadow-[0_30px_90px_-45px_rgba(22,21,15,0.6)] sm:min-h-[650px] lg:min-h-[680px]"
        >
          <ProfessionalHeroVideo
            src={getProfessionalVideo(pro.service_type)}
            poster={pro.image_url}
            alt={pro.name}
          />
          {!pro.image_url && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-8xl opacity-20">{meta.icon}</div>
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-[#05070B] via-[#05070B]/65 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#05070B] via-transparent to-[#05070B]/35" />
          <div className="noise-overlay" />

          <div className="relative flex min-h-[600px] flex-col justify-between p-7 text-white sm:min-h-[650px] sm:p-10 lg:min-h-[680px] lg:p-14">
            <div className="flex items-start justify-between gap-6">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[3px] text-[#7DD3FC]">{meta.label}</p>
                <div className="mt-3 h-px w-14 bg-[#7DD3FC]" />
              </div>
              {rating > 0 && (
                <div className="rounded-full border border-white/20 bg-white/[0.06] px-4 py-2 backdrop-blur-md">
                  <span className="text-sm font-semibold">★ {rating.toFixed(1)}</span>
                  <span className="ml-1 text-xs text-white/55">({pro.rating_count || 0})</span>
                </div>
              )}
            </div>

            <div className="max-w-3xl">
              <motion.p
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.7, ease: EASE }}
                className="mb-4 text-xs font-semibold uppercase tracking-[2px] text-white/55"
              >
                {pro.city || "India"} {pro.provider_name ? `· by ${pro.provider_name}` : ""}
              </motion.p>
              <motion.h1
                initial={{ opacity: 0, y: 25 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.8, ease: EASE }}
                className="max-w-3xl font-display text-5xl font-medium leading-[0.92] tracking-[-2px] sm:text-7xl lg:text-[92px]"
              >
                {pro.name}
              </motion.h1>
              {pro.tagline && (
                <motion.p
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.7, ease: EASE }}
                  className="mt-7 max-w-xl font-serif text-lg italic leading-relaxed text-white/75 sm:text-xl"
                >
                  “{pro.tagline}”
                </motion.p>
              )}
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <a
                  href={pro.provider_phone ? `tel:${pro.provider_phone}` : "#booking"}
                  className="group inline-flex items-center gap-3 rounded-full bg-[#7DD3FC] px-6 py-3.5 text-xs font-bold uppercase tracking-[1.5px] text-[#05070B] transition hover:-translate-y-0.5 hover:bg-[#B9EBFF]"
                  data-testid="contact-btn"
                >
                  {pro.provider_phone ? "Call to Enquire" : "Enquire Now"}
                  <span className="transition-transform group-hover:translate-x-1">↗</span>
                </a>
                <a href="#portfolio" className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/[0.04] px-6 py-3.5 text-xs font-bold uppercase tracking-[1.5px] text-white backdrop-blur-sm transition hover:bg-white/[0.06]">
                  View Work ↓
                </a>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-7 gap-y-3 border-t border-white/15 pt-5 text-[10px] font-bold uppercase tracking-[2px] text-white/55">
              <span className="flex items-center gap-2"><span className={`h-2 w-2 rounded-full ${pro.is_available ? "bg-[#7DD3FC] animate-pulse" : "bg-[#C96C73]"}`} />{pro.is_available ? "Available for bookings" : "Currently unavailable"}</span>
              {pro.experience_years > 0 && <span>{pro.experience_years}+ years experience</span>}
              {pro.rating_count > 0 && <span>{pro.rating_count} client reviews</span>}
            </div>
          </div>
        </motion.div>
      </section>

      {/* ABOUT */}
      <section className="border-y border-white/[0.08] bg-[#0A111A]">
        <div className="mx-auto grid max-w-[1500px] gap-12 px-5 py-20 sm:px-8 lg:grid-cols-[0.75fr_1.6fr_0.7fr] lg:gap-16 lg:px-12 lg:py-28">
          <Reveal>
            <SectionLabel number="01">About the professional</SectionLabel>
          </Reveal>
          <Reveal delay={0.08}>
            <div className="min-w-0">
              <ScrollFillText>
              {pro.description || "A dedicated professional focused on creating memorable experiences for every celebration."}
              </ScrollFillText>
            </div>
          </Reveal>
          <Reveal delay={0.16}>
            <div className="space-y-6 border-t border-white/10 pt-5 lg:border-l lg:border-t-0 lg:pl-7 lg:pt-0">
              {pro.experience_years > 0 && <div><p className="font-display text-4xl">{pro.experience_years}+</p><p className="mt-1 text-[10px] font-bold uppercase tracking-[2px] text-white/45">Years experience</p></div>}
              {pro.rating_count > 0 && <div><p className="font-display text-4xl">{pro.rating_avg.toFixed(1)}</p><p className="mt-1 text-[10px] font-bold uppercase tracking-[2px] text-white/45">Average rating</p></div>}
              {pro.price_from > 0 && <div><p className="font-display text-4xl">₹{pro.price_from.toLocaleString("en-IN")}</p><p className="mt-1 text-[10px] font-bold uppercase tracking-[2px] text-white/45">Starting from</p></div>}
            </div>
          </Reveal>
        </div>
      </section>

      {/* PORTFOLIO */}
      {portfolio.length > 0 && (
        <section id="portfolio" className="mx-auto max-w-[1500px] px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
          <div className="mb-12 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <Reveal>
              <SectionLabel number="02">Selected work</SectionLabel>
              <h2 className="mt-5 max-w-2xl font-display text-5xl leading-[0.95] tracking-[-1.5px] sm:text-6xl lg:text-7xl">Moments worth remembering.</h2>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="max-w-xs text-sm leading-relaxed text-white/50">A curated collection of work. Click any image to explore it in detail.</p>
            </Reveal>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-12" data-testid="portfolio-gallery">
            {portfolio.map((img, index) => {
              const layout = index === 0 ? "lg:col-span-7 lg:row-span-2 aspect-[4/5]" : index === 1 ? "lg:col-span-5 aspect-[4/3]" : "lg:col-span-5 aspect-[4/3]";
              return (
                <Reveal key={img.id} delay={Math.min(index * 0.06, 0.25)} className={layout}>
                  <motion.button
                    type="button"
                    onClick={() => setLightbox(img)}
                    whileHover={{ y: -4 }}
                    transition={{ duration: 0.35, ease: EASE }}
                    className="group relative block h-full w-full overflow-hidden rounded-2xl bg-[#101A26] text-left"
                    data-testid={`portfolio-img-${img.id}`}
                  >
                    <ParallaxImage
                      src={img.image_url}
                      alt={img.caption || `${pro.name} portfolio ${index + 1}`}
                      speed={index % 2 === 0 ? 34 : 24}
                      scale={1.08}
                      className="absolute -inset-y-[8%] left-0 h-[116%] w-full object-cover transition duration-700 ease-out group-hover:scale-[1.045]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent opacity-60 transition-opacity group-hover:opacity-90" />
                    <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 text-white">
                      <div>
                        <span className="text-[9px] font-bold uppercase tracking-[2px] text-white/55">0{index + 1}</span>
                        {img.caption && <p className="mt-1 text-sm font-medium">{img.caption}</p>}
                      </div>
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/25 bg-white/[0.06] text-sm backdrop-blur-md transition group-hover:bg-[#7DD3FC] group-hover:text-[#F8FCFF]">↗</span>
                    </div>
                  </motion.button>
                </Reveal>
              );
            })}
          </div>
        </section>
      )}

      {/* BOOKING + AVAILABILITY */}
      <section id="booking" className="bg-[#05070B] text-white">
        <div className="mx-auto grid max-w-[1500px] gap-14 px-5 py-20 sm:px-8 lg:grid-cols-[1fr_0.8fr] lg:gap-24 lg:px-12 lg:py-28">
          <Reveal>
            <SectionLabel number="03">Plan your date</SectionLabel>
            <h2 className="mt-6 max-w-3xl font-display text-5xl leading-[0.95] tracking-[-1px] text-white sm:text-6xl lg:text-7xl">Good dates don't stay open forever.</h2>
            <p className="mt-6 max-w-xl text-sm leading-7 text-white/55">Check the live availability below, then contact the professional directly to discuss your event.</p>

            <div className="mt-10 grid max-w-xl grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/[0.06]">
              <div className="bg-white/[0.035] p-5"><p className="text-[10px] uppercase tracking-[2px] text-white/35">Location</p><p className="mt-2 font-serif text-lg">{pro.city || "Available in India"}</p></div>
              <div className="bg-white/[0.035] p-5"><p className="text-[10px] uppercase tracking-[2px] text-white/35">Starting price</p><p className="mt-2 font-serif text-lg">{pro.price_from > 0 ? `₹${pro.price_from.toLocaleString("en-IN")}` : "Enquire"}</p></div>
              <div className="bg-white/[0.035] p-5"><p className="text-[10px] uppercase tracking-[2px] text-white/35">Experience</p><p className="mt-2 font-serif text-lg">{pro.experience_years > 0 ? `${pro.experience_years}+ years` : "Professional"}</p></div>
              <div className="bg-white/[0.035] p-5"><p className="text-[10px] uppercase tracking-[2px] text-white/35">Rating</p><p className="mt-2 font-serif text-lg">{rating > 0 ? `★ ${rating.toFixed(1)}` : "New"}</p></div>
            </div>

            <a href={pro.provider_phone ? `tel:${pro.provider_phone}` : "#"} className="group mt-10 inline-flex items-center gap-4 rounded-full bg-[#7DD3FC] px-7 py-4 text-xs font-bold uppercase tracking-[1.5px] text-[#F8FCFF] transition hover:-translate-y-0.5 hover:bg-[#B9EBFF]">
              {pro.provider_phone ? "Call to enquire" : "Send enquiry"}
              <span className="transition-transform group-hover:translate-x-1">↗</span>
            </a>
          </Reveal>

          <Reveal delay={0.1}>
            <div>
              <div className="mb-5">
                <p className="font-serif text-2xl">Availability</p>
                <p className="mt-1 text-xs text-white/40">Light-blue dates are open for booking.</p>
              </div>
              <AvailabilityCalendar ranges={pro.unavailable_ranges} allBlocked={!pro.is_available} />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ASSOCIATED VENUES */}
      {associatedVendors.length > 0 && (
        <section className="mx-auto max-w-[1500px] px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
          <Reveal>
            <SectionLabel number="04">Trusted partnerships</SectionLabel>
            <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <h2 className="font-display text-5xl leading-none tracking-[-1px] sm:text-6xl">Works with these venues.</h2>
              <p className="max-w-sm text-sm leading-relaxed text-white/50">Official venue partnerships and collaborations connected to this professional.</p>
            </div>
          </Reveal>

          <div className="mt-12 grid gap-4 md:grid-cols-2">
            {associatedVendors.map((v, index) => (
              <Reveal key={v.owner_id} delay={index * 0.06}>
                <div className="group rounded-2xl border border-white/10 bg-[#101A26] p-6 transition hover:-translate-y-1 hover:border-[#7DD3FC]/50 hover:shadow-[0_22px_70px_-35px_rgba(0,0,0,0.85)]" data-testid={`assoc-vendor-${v.owner_id}`}>
                  <div className="flex items-center justify-between gap-4">
                    <p className="font-serif text-2xl text-[#F8FCFF]">{v.owner_name}</p>
                    <span className="text-[10px] font-bold uppercase tracking-[1.5px] text-white/35">{v.venue_count} venue{v.venue_count !== 1 ? "s" : ""}</span>
                  </div>
                  {v.venues.length > 0 && (
                    <div className="mt-5 flex flex-wrap gap-2">
                      {v.venues.map((venue) => (
                        <Link key={venue.id} to={`/venues/${venue.id}`} className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-white/60 transition hover:border-[#7DD3FC] hover:text-[#F8FCFF]">{venue.name} · {venue.city}</Link>
                      ))}
                    </div>
                  )}
                </div>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* REVIEWS */}
      <section className="border-t border-white/[0.08] bg-[#0A111A]">
        <div className="mx-auto max-w-[1500px] px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
          <Reveal>
            <SectionLabel number="05">Client stories</SectionLabel>
            <div className="mt-6 grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-24">
              <div>
                <h2 className="font-display text-5xl leading-none tracking-[-1px] sm:text-6xl">Loved by the people behind the moments.</h2>
                {rating > 0 && <div className="mt-7"><Stars value={rating} large /><p className="mt-2 text-xs text-white/50">{rating.toFixed(1)} average from {pro.rating_count || 0} reviews</p></div>}
              </div>

              <div>
                {reviews.length === 0 ? (
                  <p className="rounded-2xl border border-white/10 bg-[#101A26] p-7 text-sm text-white/50">No reviews yet — be the first to share your experience.</p>
                ) : (
                  <div className="divide-y divide-white/10 border-y border-white/10" data-testid="reviews-list">
                    {reviews.map((r) => (
                      <article key={r.id} className="py-7 first:pt-0 last:pb-0">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="font-serif text-xl text-[#F8FCFF]">{r.author_name}</p>
                            <Stars value={r.rating} />
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-[1.5px] text-white/30">{new Date(r.created_at).toLocaleDateString()}</span>
                        </div>
                        <p className="mt-4 max-w-2xl text-sm leading-7 text-white/60">“{r.comment}”</p>
                      </article>
                    ))}
                  </div>
                )}

                <form onSubmit={submitReview} className="mt-10 rounded-2xl border border-white/10 bg-[#101A26] p-6 sm:p-8" data-testid="review-form">
                  <div className="flex items-start justify-between gap-4">
                    <div><p className="font-serif text-2xl">Share your experience</p><p className="mt-1 text-xs text-white/45">Your review helps other couples choose with confidence.</p></div>
                    <span className="text-[#7DD3FC]">✦</span>
                  </div>
                  <div className="mt-6 flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button type="button" key={n} onClick={() => setReviewForm({ ...reviewForm, rating: n })} className={`text-2xl transition hover:scale-110 ${n <= reviewForm.rating ? "text-[#7DD3FC]" : "text-white/15"}`} data-testid={`star-${n}`}>★</button>
                    ))}
                  </div>
                  <textarea className="input mt-5 min-h-[120px] resize-y !rounded-xl !border-white/10 !bg-[#0A111A]" placeholder="Tell us about your experience…" value={reviewForm.comment} onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })} data-testid="review-comment" />
                  <div className="mt-4 flex flex-wrap items-center gap-4">
                    <button type="submit" className="rounded-full bg-[#7DD3FC] px-6 py-3 text-xs font-bold uppercase tracking-[1.5px] text-[#05070B] transition hover:-translate-y-0.5 hover:bg-[#B9EBFF]" data-testid="review-submit">Post Review ↗</button>
                    {reviewMsg && <p className="text-xs text-white/50">{reviewMsg}</p>}
                  </div>
                </form>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="relative overflow-hidden border-t border-[#7DD3FC]/20 bg-[#0A111A] px-5 py-20 text-[#F8FCFF] sm:px-8 lg:px-12 lg:py-28">
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-black/20 blur-3xl" />
        <div className="relative mx-auto flex max-w-[1500px] flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
          <Reveal>
            <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[3px] text-[#B9EBFF]/60"><span>06</span><span className="h-px w-8 bg-[#B9EBFF]/35" /><span>Make it memorable</span></div>
            <h2 className="mt-6 max-w-4xl font-display text-6xl leading-[0.9] tracking-[-2px] text-[#F8FCFF] sm:text-7xl lg:text-[96px]">Your celebration deserves the right people.</h2>
          </Reveal>
          <Reveal delay={0.1}>
            <a href="/venues" className="group inline-flex shrink-0 items-center gap-4 rounded-full bg-[#7DD3FC] px-7 py-4 text-xs font-bold uppercase tracking-[1.5px] text-[#05070B] transition hover:-translate-y-1 hover:bg-[#B9EBFF]">
              Start your booking <span className="transition-transform group-hover:translate-x-1">↗</span>
            </a>
          </Reveal>
        </div>
      </section>

      {/* LIGHTBOX */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 sm:p-8"
            onClick={() => setLightbox(null)}
            role="dialog"
            aria-modal="true"
            aria-label="Portfolio image preview"
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ duration: 0.35, ease: EASE }}
              className="relative max-h-[90vh] max-w-6xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button type="button" onClick={() => setLightbox(null)} className="absolute -right-2 -top-12 h-9 w-9 rounded-full border border-white/20 bg-white/[0.06] text-white backdrop-blur-md transition hover:bg-[#142231] hover:text-black sm:-right-12 sm:top-0" aria-label="Close image">×</button>
              <img src={lightbox.image_url} alt={lightbox.caption || "Portfolio preview"} className="max-h-[82vh] w-auto max-w-full rounded-2xl object-contain" />
              {lightbox.caption && <p className="mt-4 text-center text-sm text-white/70">{lightbox.caption}</p>}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
