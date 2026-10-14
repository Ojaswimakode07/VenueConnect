import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import api from "../api/axios.js";
import VenueDecorationModel from "../components/VenueDecorationModel.jsx";
import BookingModal from "../components/BookingModal.jsx";
import { getFlagshipPreviewVariant, hasFlagshipPreview } from "../utils/venuePreview.js";
import { useAuth } from "../context/AuthContext.jsx";


const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

const TOP_SUGGESTED_VENUES = {
  "taj-lands-end": {
    id: "taj-lands-end",
    name: "Taj Lands End",
    category: "Luxury Venue",
    address: "Bandstand, Bandra West",
    city: "Mumbai",
    state: "Maharashtra",
    capacity: 1000,
    price_per_day: 250000,
    rating_avg: 4.8,
    rating_count: 0,
    image_url:
      "https://weddingsutra.com/images/taj-lands-end-img-nw4.jpg",
    description:
      "A luxurious waterfront venue in Bandra, Mumbai, ideal for elegant weddings, receptions and premium celebrations.",
    amenities:
      "Luxury Banquet Hall, Waterfront Setting, Valet Parking, Air Conditioning, Bridal Room",
    themes: [],
    has_3d_model: false,
    model_variant: null,
  },

  "st-regis-mumbai": {
    id: "st-regis-mumbai",
    name: "The St. Regis Mumbai",
    category: "Luxury Venue",
    address: "Lower Parel",
    city: "Mumbai",
    state: "Maharashtra",
    capacity: 800,
    price_per_day: 300000,
    rating_avg: 4.8,
    rating_count: 0,
    image_url:
      "https://www.marriottindiaweddings.com/resourcefiles/venuesgalleryimages/the-st-regis-mumbai-the-imperial-hall-featuring-round-table-setting.jpg",
    description:
      "An iconic luxury venue in Lower Parel, Mumbai, designed for sophisticated weddings and grand celebrations.",
    amenities:
      "Grand Ballroom, Luxury Rooms, Valet Parking, Air Conditioning, Premium Dining",
    themes: [],
    has_3d_model: false,
    model_variant: null,
  },

  "itc-maratha-mumbai": {
    id: "itc-maratha-mumbai",
    name: "ITC Maratha",
    category: "Wedding Venue",
    address: "Sahar Airport Road, Andheri East",
    city: "Mumbai",
    state: "Maharashtra",
    capacity: 1200,
    price_per_day: 275000,
    rating_avg: 4.7,
    rating_count: 0,
    image_url:
      "https://www.itchotels.com/content/dam/itchotels/in/umbrella/itc/hotels/itcmaratha-mumbai/images/meetings-and-socials-landing-page/headmast/mobile/banquets.png",
    description:
      "A grand five-star venue in Andheri East, Mumbai, suited for weddings, receptions and large-scale celebrations.",
    amenities:
      "Banquet Halls, Parking, Air Conditioning, Catering, Bridal Suite",
    themes: [],
    has_3d_model: false,
    model_variant: null,
  },

  "the-leela-mumbai": {
    id: "the-leela-mumbai",
    name: "The Leela Mumbai",
    category: "Celebration Venue",
    address: "Andheri East",
    city: "Mumbai",
    state: "Maharashtra",
    capacity: 1000,
    price_per_day: 260000,
    rating_avg: 4.7,
    rating_count: 0,
    image_url:
      "https://www.weddingsutra.com/images/Vendor_Images/Venues/the-leela-mumbai/the-leela-mumbai-05.jpg",
    description:
      "A premium celebration venue in Andheri East offering elegant spaces for weddings, receptions and social events.",
    amenities:
      "Ballrooms, Garden Space, Parking, Air Conditioning, Catering",
    themes: [],
    has_3d_model: false,
    model_variant: null,
  },

  "sofitel-mumbai-bkc": {
    id: "sofitel-mumbai-bkc",
    name: "Sofitel Mumbai BKC",
    category: "Event Venue",
    address: "Bandra Kurla Complex",
    city: "Mumbai",
    state: "Maharashtra",
    capacity: 700,
    price_per_day: 225000,
    rating_avg: 4.6,
    rating_count: 0,
    image_url:
      "https://thevendry.com/cdn-cgi/image/height%3D1920%2Cwidth%3D1920%2Cfit%3Dcontain%2Cmetadata%3Dnone/https%3A/s3.us-east-1.amazonaws.com/uploads.thevendry.co/36210/1726575656390_28.jpg",
    description:
      "A contemporary premium event venue in BKC, Mumbai, perfect for stylish weddings, corporate events and celebrations.",
    amenities:
      "Event Halls, Parking, Air Conditioning, Catering, Luxury Accommodation",
    themes: [],
    has_3d_model: false,
    model_variant: null,
  },
};

export default function VenueDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [venue, setVenue] = useState(null);
  const [selectedTheme, setSelectedTheme] = useState(null);

  const [customPrimary, setCustomPrimary] = useState("#C9A227");
  const [customSecondary, setCustomSecondary] = useState("#4A1942");

  // 3D decoration controls
  const [decorationOptions, setDecorationOptions] = useState({
    flowers: true,
    chairs: true,
    tables: true,
    lighting: true,
    backdrop: true,
  });

  const [reviews, setReviews] = useState([]);
  const [showBooking, setShowBooking] = useState(false);
  const [show3D, setShow3D] = useState(false);
  const [previewDate, setPreviewDate] = useState(null);

  const [reviewForm, setReviewForm] = useState({
    rating: 0,
    decoration_quality: 0,
    cleanliness: 0,
    punctuality: 0,
    value_for_money: 0,
    comment: "",
  });

  const [reviewStep, setReviewStep] = useState(0);
  const [reviewMsg, setReviewMsg] = useState("");

  useEffect(() => {
    window.scrollTo(0, 0);

    document.body.classList.add("venue-detail-dark-active");

    api
      .get(`/venues/${id}`)
      .then((res) => {
        const data = res.data;

        setVenue(data);

        const firstTheme = data.themes?.[0] || null;

        setSelectedTheme(firstTheme);

        setCustomPrimary(
          firstTheme?.primary_color || "#C9A227"
        );

        setCustomSecondary(
          firstTheme?.secondary_color || "#4A1942"
        );
      })
      .catch(() => {
        const suggestedVenue = TOP_SUGGESTED_VENUES[id];

        if (suggestedVenue) {
          setVenue(suggestedVenue);
          setSelectedTheme(null);
          setCustomPrimary("#C9A227");
          setCustomSecondary("#4A1942");
        }
      });

    api
      .get(`/reviews/venue/${id}`)
      .then((res) => setReviews(res.data))
      .catch(() => setReviews([]));

    return () => {
      document.body.classList.remove("venue-detail-dark-active");
    };
  }, [id]);

  function pickTheme(theme) {
    setSelectedTheme(theme);
    setCustomPrimary(theme.primary_color);
    setCustomSecondary(theme.secondary_color);
  }

  async function submitReview(e) {
    e.preventDefault();

    try {
      await api.post("/reviews", {
        venue_id: Number(id),
        ...reviewForm,
      });

      setReviewMsg("Thank you! Your review has been posted.");

      const res = await api.get(`/reviews/venue/${id}`);
      setReviews(res.data);

      setReviewForm({
        rating: 0,
        decoration_quality: 0,
        cleanliness: 0,
        punctuality: 0,
        value_for_money: 0,
        comment: "",
      });

      setReviewStep(0);
    } catch (err) {
      setReviewMsg(
        err?.response?.data?.detail ||
          "Please log in to post a review."
      );
    }
  }

  if (!venue) {
    return (
      <p className="text-center py-24 text-gray-400">
        Loading venue…
      </p>
    );
  }

  const has3D = hasFlagshipPreview(venue);
  const previewVariant = getFlagshipPreviewVariant(venue);

  const mapQuery = `${venue.name}, ${venue.address}, ${venue.city}${
    venue.state ? ", " + venue.state : ""
  }`;

  const mapOpenUrl = `https://www.google.com/maps?q=${encodeURIComponent(
    mapQuery
  )}`;

  return (
    <div className="venue-detail-dark max-w-7xl mx-auto px-5 py-10">
      <style>{`

        /* =========================
           DARK VENUE PAGE
        ========================= */

        body.venue-detail-dark-active {
          background: #000 !important;
          color: #fff !important;
        }

        body.venue-detail-dark-active,
        body.venue-detail-dark-active #root {
          background: #000 !important;
          color: #fff !important;
        }

        body.venue-detail-dark-active header {
          background: #000 !important;
          border-bottom: 1px solid rgba(240,239,232,.14) !important;
        }

        body.venue-detail-dark-active header a,
        body.venue-detail-dark-active header button,
        body.venue-detail-dark-active header nav span {
          color: #f0efe8 !important;
        }

        body.venue-detail-dark-active
        .venue-detail-dark h1,
        body.venue-detail-dark-active
        .venue-detail-dark h2,
        body.venue-detail-dark-active
        .venue-detail-dark h3,
        body.venue-detail-dark-active
        .venue-detail-dark .text-plum-dark {
          color: #fff !important;
        }

        body.venue-detail-dark-active
        .venue-detail-dark .text-gray-500,
        body.venue-detail-dark-active
        .venue-detail-dark .text-gray-600,
        body.venue-detail-dark-active
        .venue-detail-dark .text-gray-400 {
          color: #888 !important;
        }

        body.venue-detail-dark-active
        .venue-detail-dark .card {
          background: #111 !important;
          border-color: rgba(255,255,255,.12) !important;
          box-shadow: none !important;
        }

        body.venue-detail-dark-active
        .venue-detail-dark .bg-panel {
          background: #171717 !important;
          color: #f0efe8 !important;
        }

        body.venue-detail-dark-active
        .venue-detail-dark .input {
          background: #111 !important;
          color: #fff !important;
          border-color: #333 !important;
        }

        body.venue-detail-dark-active
        .venue-detail-dark textarea::placeholder,
        body.venue-detail-dark-active
        .venue-detail-dark input::placeholder {
          color: #666 !important;
        }

        /* Scrollbar */

        body.venue-detail-dark-active::-webkit-scrollbar,
        html:has(body.venue-detail-dark-active)::-webkit-scrollbar {
          width: 3px;
        }

        body.venue-detail-dark-active::-webkit-scrollbar-thumb,
        html:has(body.venue-detail-dark-active)::-webkit-scrollbar-thumb {
          background: #149ce5;
          border-radius: 10px;
        }

        /* Gold becomes blue on this page */

        body.venue-detail-dark-active
        .venue-detail-dark .text-gold {
          color: #2f80ff !important;
        }

        /* =========================
           THEME CARDS
        ========================= */

        body.venue-detail-dark-active .venue-theme-option {
          position: relative;
          overflow: hidden;
          isolation: isolate;
          background: #111 !important;
          border-color: transparent !important;
          transform: translateY(0);
          transition:
            transform .45s ease,
            box-shadow .45s ease;
        }

        body.venue-detail-dark-active
        .venue-theme-option::before {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(
            105deg,
            rgba(47,128,255,.20),
            rgba(47,128,255,.06) 55%,
            transparent 85%
          );
          transform: translateX(-105%);
          transition: transform .6s ease;
          pointer-events: none;
          z-index: 0;
        }

        body.venue-detail-dark-active
        .venue-theme-option > * {
          position: relative;
          z-index: 1;
        }

        body.venue-detail-dark-active
        .venue-theme-option:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 30px rgba(0,0,0,.3);
        }

        body.venue-detail-dark-active
        .venue-theme-option:hover::before,
        body.venue-detail-dark-active
        .venue-theme-option:focus-visible::before {
          transform: translateX(0);
        }

        /* =========================
           CUSTOM THEME
        ========================= */

        body.venue-detail-dark-active
        .venue-custom-theme {
          position: relative;
          overflow: hidden;
          isolation: isolate;
          background: #111 !important;
          border-color: rgba(255,255,255,.12) !important;
        }

        body.venue-detail-dark-active
        .venue-custom-theme::before {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(
            105deg,
            rgba(47,128,255,.16),
            rgba(47,128,255,.04),
            transparent 85%
          );
          transform: translateX(-105%);
          transition: transform .6s ease;
          pointer-events: none;
        }

        body.venue-detail-dark-active
        .venue-custom-theme:hover::before {
          transform: translateX(0);
        }

        /* =========================
           3D AREA
        ========================= */

        body.venue-detail-dark-active
        .venue-3d-container {
          position: relative;
          overflow: hidden;
          background:
            radial-gradient(
              circle at 50% 30%,
              rgba(47,128,255,.08),
              transparent 55%
            ),
            #080808 !important;
          border: 1px solid rgba(255,255,255,.12);
          border-radius: 18px;
        }

        body.venue-detail-dark-active
        .venue-3d-container::after {
          content: "DRAG TO ROTATE  •  SCROLL TO ZOOM";
          position: absolute;
          bottom: 12px;
          left: 50%;
          transform: translateX(-50%);
          padding: 6px 12px;
          border-radius: 999px;
          background: rgba(0,0,0,.65);
          border: 1px solid rgba(255,255,255,.12);
          color: #999;
          font-size: 9px;
          letter-spacing: .12em;
          pointer-events: none;
          white-space: nowrap;
        }

        /* =========================
           DECORATION CONTROLS
        ========================= */

        .decoration-toggle {
          border: 1px solid rgba(255,255,255,.14);
          background: #111;
          color: #999;
          transition: all .3s ease;
        }

        .decoration-toggle:hover {
          transform: translateY(-2px);
          border-color: #2f80ff;
          color: #fff;
        }

        .decoration-toggle.active {
          background: rgba(47,128,255,.12);
          border-color: #2f80ff;
          color: #2f80ff;
        }

        /* =========================
           REVIEW SECTION
        ========================= */

        .review-section-modern {
          margin-top: 2.5rem;
          padding-top: 2rem;
          border-top: 1px solid rgba(255,255,255,.1);
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
          column-gap: 3.5rem;
          row-gap: 1.5rem;
          align-items: start;
        }

        .review-summary-modern {
          display: block;
          padding: 0;
          grid-column: 1;
          grid-row: 1;
        }

        .review-distribution-modern {
          display: flex;
          flex-direction: column;
          gap: .7rem;
        }

        .review-distribution-row {
          display: grid;
          grid-template-columns: 42px 20px minmax(80px,1fr) 48px;
          align-items: center;
          gap: .35rem;
          font-size: .78rem;
        }

        .review-distribution-label {
          color: #f0efe8;
        }

        .review-distribution-star {
          color: #f5c542;
        }

        .review-distribution-track {
          height: 6px;
          overflow: hidden;
          border-radius: 999px;
          background: rgba(255,255,255,.09);
        }

        .review-distribution-fill {
          display: block;
          height: 100%;
          border-radius: inherit;
          background: #2f80ff;
          transition: width .5s ease;
        }

        .review-distribution-count {
          color: #777;
          text-align: right;
        }

        .review-overall-modern {
          width: min(100%, 420px);
          min-height: 96px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: .7rem 1rem;
          border-radius: 18px;
          background:
            radial-gradient(
              circle at 50% 0%,
              rgba(47,128,255,.16),
              transparent 65%
            ),
            #111;
          border: 1px solid rgba(255,255,255,.1);
        }

        .review-overall-number {
          font-family: Georgia, "Times New Roman", serif;
          font-size: 2rem;
          color: #fff;
          font-weight: 700;
        }

        .review-overall-stars {
          display: flex;
          gap: .25rem;
          margin-top: .75rem;
          color: #f5c542;
          font-size: 1.4rem;
        }

        .review-overall-count {
          margin-top: .55rem;
          color: #999;
          font-size: .78rem;
        }

        .review-content-modern {
          display: contents;
        }

        .review-feedback-modern {
          grid-column: 1;
          grid-row: 2;
        }

        .review-form-modern {
          grid-column: 2;
          grid-row: 1 / span 2;
          align-self: start;
        }

        .review-section-heading {
          margin-bottom: 1.35rem;
        }

        .review-eyebrow {
          display: block;
          margin-bottom: .45rem;
          color: #2f80ff;
          font-size: .65rem;
          font-weight: 700;
          letter-spacing: .18em;
        }

        .review-section-heading h2 {
          margin: 0;
          color: #fff !important;
          font-family: Georgia, "Times New Roman", serif;
          font-size: 1.55rem;
          font-weight: 700;
        }

        .review-section-heading p {
          margin-top: .4rem;
          color: #888;
          font-size: .82rem;
        }

        .review-feedback-list {
          display: flex;
          flex-direction: column;
          gap: .9rem;
        }

        .review-feedback-item {
          display: flex;
          gap: 1rem;
          padding: 1.05rem 0;
          border-bottom: 1px solid rgba(255,255,255,.09);
          transition: transform .3s ease, border-color .3s ease;
        }

        .review-feedback-item:hover {
          transform: translateX(4px);
          border-color: rgba(47,128,255,.35);
        }

        .review-avatar-modern {
          width: 48px;
          height: 48px;
          flex: 0 0 48px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          color: #fff;
          font-size: .75rem;
          font-weight: 700;
          background: linear-gradient(145deg,#1a1a1a,#0c0c0c);
          border: 1px solid rgba(47,128,255,.35);
        }

        .review-feedback-body {
          min-width: 0;
          flex: 1;
        }

        .review-feedback-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 1rem;
        }

        .review-feedback-name {
          color: #f0efe8;
          font-size: .9rem;
          font-weight: 600;
        }

        .review-feedback-date {
          margin-top: .15rem;
          color: #666;
          font-size: .68rem;
        }

        .review-feedback-rating {
          display: flex;
          gap: .08rem;
          color: #4b4b4b;
          font-size: .8rem;
        }

        .review-feedback-rating .active {
          color: #f5c542;
        }

        .review-feedback-comment {
          margin-top: .65rem;
          color: #a5a5a5;
          font-size: .8rem;
          line-height: 1.65;
        }

        .review-feedback-metrics {
          display: flex;
          flex-wrap: wrap;
          gap: .45rem 1rem;
          margin-top: .65rem;
          color: #707070;
          font-size: .67rem;
        }

        .review-empty-modern {
          padding: 2rem 0;
          color: #777;
        }

        .review-empty-star {
          display: block;
          margin-bottom: .5rem;
          color: #f5c542;
          font-size: 1.8rem;
        }

        .review-empty-modern p {
          color: #f0efe8;
          font-size: .9rem;
        }

        .review-form-modern {
          padding-left: 2.25rem;
          border-left: 1px solid rgba(255,255,255,.1);
        }

        .review-rating-fields-modern {
          display: flex;
          flex-direction: column;
          gap: .65rem;
        }

        .review-rating-field-modern {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          min-height: 35px;
        }

        .review-rating-field-modern > span {
          color: #bdbdbd;
          font-size: .78rem;
        }

        .review-stars-modern {
          display: flex;
          gap: .1rem;
        }

        .review-star-modern {
          padding: 0;
          border: 0;
          background: transparent;
          color: #4d4d4d;
          font-size: 1.35rem;
          line-height: 1;
          cursor: pointer;
          transition: color .2s ease, transform .2s ease;
        }

        .review-star-modern:hover,
        .review-star-modern.selected {
          color: #f5c542;
        }

        .review-star-modern:hover {
          transform: translateY(-2px) scale(1.08);
        }

        .review-message-modern {
          margin-top: 1.3rem;
        }

        .review-message-modern label {
          display: block;
          margin-bottom: .5rem;
          color: #bdbdbd;
          font-size: .78rem;
        }

        .review-message-modern label span {
          color: #2f80ff;
        }

        .review-message-modern textarea {
          width: 100%;
          min-height: 100px;
          resize: vertical;
          padding: .9rem 1rem;
          border: 1px solid rgba(255,255,255,.14);
          border-radius: 12px;
          outline: none;
          background: #0d0d0d;
          color: #fff;
          font: inherit;
          font-size: .82rem;
        }

        .review-message-modern textarea:focus {
          border-color: rgba(47,128,255,.75);
          box-shadow: 0 0 0 3px rgba(47,128,255,.08);
        }

        .review-message-modern small {
          display: block;
          margin-top: .45rem;
          color: #666;
          font-size: .67rem;
        }

        .review-submit-modern {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 1rem;
          padding: .8rem 1rem;
          border: 1px solid #2f80ff;
          border-radius: 10px;
          background: #2f80ff;
          color: #fff;
          font-size: .82rem;
          font-weight: 700;
          cursor: pointer;
          transition: transform .25s ease, box-shadow .25s ease;
        }

        .review-submit-modern:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 28px rgba(47,128,255,.2);
        }

        .review-message-status-modern {
          margin-top: .7rem;
          color: #ff9d9d;
          font-size: .72rem;
        }

        /* =========================
           BUTTONS
        ========================= */

        body.venue-detail-dark-active
        .venue-detail-dark .btn-gold {
          background: #2f80ff !important;
          color: #fff !important;
          border-color: #2f80ff !important;
          transition: transform .35s ease, box-shadow .35s ease;
        }

        body.venue-detail-dark-active
        .venue-detail-dark .btn-gold:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 28px rgba(47,128,255,.22);
        }

        body.venue-detail-dark-active
        .venue-detail-dark .btn-outline {
          background: transparent !important;
          color: #f0efe8 !important;
          border-color: rgba(255,255,255,.22) !important;
          transition: all .35s ease;
        }

        body.venue-detail-dark-active
        .venue-detail-dark .btn-outline:hover {
          background: rgba(47,128,255,.08) !important;
          border-color: #2f80ff !important;
          transform: translateY(-2px);
        }

        .venue-price,
        .venue-price * {
          color: #fff !important;
        }

        @media (max-width: 900px) {
          .review-section-modern {
            grid-template-columns: 1fr;
          }

          .review-summary-modern,
          .review-feedback-modern,
          .review-form-modern {
            grid-column: 1;
          }

          .review-summary-modern {
            grid-row: auto;
          }

          .review-feedback-modern {
            grid-row: auto;
          }

          .review-form-modern {
            grid-row: auto;
            padding-left: 0;
            padding-top: 2rem;
            border-left: 0;
            border-top: 1px solid rgba(255,255,255,.1);
          }
        }

      `}</style>

      {/* =========================
          HEADER
      ========================= */}

      <motion.div
        initial="hidden"
        animate="show"
        variants={fadeUp}
        className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6"
      >
        <div>
          <span className="text-xs font-semibold text-gold uppercase tracking-wide">
            {venue.category}
          </span>

          {has3D && (
            <span className="ml-2 text-[10px] font-bold uppercase tracking-wide bg-plum text-white px-2 py-0.5 rounded-full align-middle">
              ✨ Live 3D Preview
            </span>
          )}

          <h1 className="font-serif text-3xl md:text-4xl font-bold text-plum-dark">
            {venue.name}
          </h1>

          <p className="text-gray-500 mt-1">
            {venue.address}, {venue.city}
            {venue.state ? `, ${venue.state}` : ""} · Capacity{" "}
            {venue.capacity} guests
          </p>
        </div>

        <div className="text-right">
          <p className="venue-price text-3xl font-bold">
            ₹{venue.price_per_day.toLocaleString("en-IN")}
            <span className="text-sm font-normal"> /day</span>
          </p>

          {venue.rating_count > 0 && (
            <p className="text-sm text-gold font-semibold">
              ★ {Number(venue.rating_avg).toFixed(1)} (
              {venue.rating_count} reviews)
            </p>
          )}
        </div>
      </motion.div>

      {/* =========================
          MAIN VENUE IMAGE
      ========================= */}

      <motion.img
        initial={{ opacity: 0, scale: 1.03 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        src={venue.image_url}
        alt={venue.name}
        className="w-full h-80 object-cover rounded-2xl mb-10"
      />

      <div className="grid lg:grid-cols-3 gap-10">

        {/* =========================
            LEFT COLUMN
        ========================= */}

        <div className="lg:col-span-2 space-y-10">

          {/* About */}

          <div>
            <div className="flex items-center gap-2 mb-2">
              <h2 className="font-serif text-xl font-bold text-plum-dark">
                About this venue
              </h2>

              {has3D && (
                <button
                  type="button"
                  onClick={() => setShow3D(true)}
                  className="group flex h-8 w-8 items-center justify-center rounded-md border border-cyan-400/50 bg-cyan-400/10 transition hover:border-cyan-300 hover:bg-cyan-400/20 focus:outline-none focus:ring-2 focus:ring-cyan-300"
                  aria-label="Open 3D venue model"
                  title="View 3D model"
                >
                  <img
                    src="/cube.png"
                    alt=""
                    className="h-5 w-5 object-contain transition-transform group-hover:scale-110"
                  />
                </button>
              )}

              {has3D && show3D && createPortal(
                <div
                  className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-sm flex items-center justify-center"
                  onClick={() => setShow3D(false)}
                >
                  <div
                    className="relative w-full h-full overflow-hidden bg-[#0b0e1a]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <iframe
                      src={previewVariant === "rangoli_lawn" ? "/rangoli-venue.html" : "/venue-3d.html"}
                      title={previewVariant === "rangoli_lawn" ? "Rangoli Lawns 3D venue model" : "Grand Mehfil 3D venue model"}
                      className="w-full h-full border-0"
                      allowFullScreen
                    />
                    <button
                      type="button"
                      onClick={() => setShow3D(false)}
                      className="absolute top-3 right-3 h-9 w-9 rounded-full bg-black/60 border border-white/25 text-white hover:bg-black/80 flex items-center justify-center text-lg"
                      aria-label="Close 3D model"
                    >
                      ✕
                    </button>
                  </div>
                </div>,
                document.body
              )}
            </div>

            <p className="text-gray-600 leading-relaxed">
              {venue.description}
            </p>
          </div>




          {/* Amenities */}

          <div>
            <h2 className="font-serif text-xl font-bold text-plum-dark mb-3">
              Amenities
            </h2>

            <div className="flex flex-wrap gap-2">
              {(venue.amenities || "")
                .split(",")
                .filter(Boolean)
                .map((amenity) => (
                  <span
                    key={amenity}
                    className="text-sm bg-panel text-plum-dark px-3 py-1.5 rounded-full"
                  >
                    {amenity.trim()}
                  </span>
                ))}
            </div>
          </div>



          {/* =========================
              REVIEWS
          ========================= */}

          <section className="review-section-modern">

            {/* Rating summary */}

            <div className="review-summary-modern">

              <div className="review-overall-modern">

                <div className="review-overall-number">
                  {Number(
                    venue.rating_avg || 0
                  ).toFixed(1)}
                </div>

                <div className="review-overall-stars">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span key={star}>★</span>
                  ))}
                </div>

                <div className="review-overall-count">
                  {venue.rating_count ||
                    reviews.length ||
                    0}{" "}
                  Ratings
                </div>

              </div>

            </div>

            {/* Review content */}

            <div className="review-content-modern">

              {/* Existing reviews */}

              <div className="review-feedback-modern">

                <div className="review-section-heading">
                  <span className="review-eyebrow">
                    WHAT PEOPLE SAY
                  </span>

                  <h2>Recent Feedback</h2>
                </div>

                {reviews.length === 0 ? (
                  <div className="review-empty-modern">
                    <span className="review-empty-star">
                      ☆
                    </span>

                    <p>No reviews yet.</p>

                    <span>
                      Be the first to share your experience.
                    </span>
                  </div>
                ) : (
                  <div className="review-feedback-list">

                    {reviews.slice(0, 5).map((review) => {

                      const initials =
                        (
                          review.user_name ||
                          review.name ||
                          "Guest"
                        )
                          .trim()
                          .split(/\s+/)
                          .slice(0, 2)
                          .map(
                            (part) =>
                              part[0]?.toUpperCase()
                          )
                          .join("") || "G";

                      return (
                        <article
                          className="review-feedback-item"
                          key={review.id}
                        >

                          <div className="review-avatar-modern">
                            {initials}
                          </div>

                          <div className="review-feedback-body">

                            <div className="review-feedback-top">

                              <div>
                                <div className="review-feedback-name">
                                  {review.user_name ||
                                    review.name ||
                                    "Guest"}
                                </div>

                                <div className="review-feedback-date">
                                  {new Date(
                                    review.created_at
                                  ).toLocaleDateString()}
                                </div>
                              </div>

                              <div className="review-feedback-rating">
                                {[1, 2, 3, 4, 5].map(
                                  (star) => (
                                    <span
                                      key={star}
                                      className={
                                        star <=
                                        Math.round(
                                          Number(
                                            review.rating
                                          )
                                        )
                                          ? "active"
                                          : ""
                                      }
                                    >
                                      ★
                                    </span>
                                  )
                                )}
                              </div>

                            </div>

                            <p className="review-feedback-comment">
                              {review.comment}
                            </p>

                            <div className="review-feedback-metrics">
                              <span>
                                Decoration{" "}
                                {review.decoration_quality}★
                              </span>

                              <span>
                                Cleanliness{" "}
                                {review.cleanliness}★
                              </span>

                              <span>
                                Punctuality{" "}
                                {review.punctuality}★
                              </span>

                              <span>
                                Value{" "}
                                {review.value_for_money}★
                              </span>
                            </div>

                          </div>

                        </article>
                      );
                    })}

                  </div>
                )}

              </div>

              {/* Add review */}

              <div className="review-form-modern">

                <div className="review-section-heading">

                  <span className="review-eyebrow">
                    SHARE YOUR EXPERIENCE
                  </span>

                  <h2>Add a Review</h2>

                  <p>
                    Tell us how your experience was.
                  </p>

                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();

                    if (!reviewForm.comment.trim()) {
                      setReviewMsg(
                        "Please write your review message before posting."
                      );
                      return;
                    }

                    if (
                      reviewForm.rating < 1 ||
                      reviewForm.decoration_quality < 1 ||
                      reviewForm.cleanliness < 1 ||
                      reviewForm.punctuality < 1 ||
                      reviewForm.value_for_money < 1
                    ) {
                      setReviewMsg(
                        "Please complete all ratings before posting."
                      );
                      return;
                    }

                    submitReview(e);
                  }}
                >

                  <div className="review-rating-fields-modern">

                    <AnimatePresence
                      mode="wait"
                      initial={false}
                    >

                      {/* Decoration */}

                      {reviewStep === 0 && (
                        <motion.div
                          key="decoration"
                          initial={{
                            opacity: 0,
                            x: 35,
                            scale: 0.96,
                          }}
                          animate={{
                            opacity: 1,
                            x: 0,
                            scale: 1,
                          }}
                          exit={{
                            opacity: 0,
                            x: -35,
                            scale: 0.96,
                          }}
                          transition={{
                            duration: 0.35,
                          }}
                          className="review-rating-field-modern"
                        >
                          <span>
                            Decoration Quality
                          </span>

                          <div className="review-stars-modern">
                            {[1, 2, 3, 4, 5].map(
                              (star) => (
                                <button
                                  key={star}
                                  type="button"
                                  onClick={() => {
                                    setReviewForm(
                                      (prev) => ({
                                        ...prev,
                                        decoration_quality:
                                          star,
                                      })
                                    );

                                    setReviewMsg("");
                                    setReviewStep(1);
                                  }}
                                  className={`review-star-modern ${
                                    star <=
                                    reviewForm.decoration_quality
                                      ? "selected"
                                      : ""
                                  }`}
                                >
                                  ★
                                </button>
                              )
                            )}
                          </div>
                        </motion.div>
                      )}

                      {/* Cleanliness */}

                      {reviewStep === 1 && (
                        <motion.div
                          key="cleanliness"
                          initial={{
                            opacity: 0,
                            x: 35,
                            scale: 0.96,
                          }}
                          animate={{
                            opacity: 1,
                            x: 0,
                            scale: 1,
                          }}
                          exit={{
                            opacity: 0,
                            x: -35,
                            scale: 0.96,
                          }}
                          transition={{
                            duration: 0.35,
                          }}
                          className="review-rating-field-modern"
                        >
                          <span>
                            Cleanliness
                          </span>

                          <div className="review-stars-modern">
                            {[1, 2, 3, 4, 5].map(
                              (star) => (
                                <button
                                  key={star}
                                  type="button"
                                  onClick={() => {
                                    setReviewForm(
                                      (prev) => ({
                                        ...prev,
                                        cleanliness:
                                          star,
                                      })
                                    );

                                    setReviewMsg("");
                                    setReviewStep(2);
                                  }}
                                  className={`review-star-modern ${
                                    star <=
                                    reviewForm.cleanliness
                                      ? "selected"
                                      : ""
                                  }`}
                                >
                                  ★
                                </button>
                              )
                            )}
                          </div>
                        </motion.div>
                      )}

                      {/* Punctuality */}

                      {reviewStep === 2 && (
                        <motion.div
                          key="punctuality"
                          initial={{
                            opacity: 0,
                            x: 35,
                            scale: 0.96,
                          }}
                          animate={{
                            opacity: 1,
                            x: 0,
                            scale: 1,
                          }}
                          exit={{
                            opacity: 0,
                            x: -35,
                            scale: 0.96,
                          }}
                          transition={{
                            duration: 0.35,
                          }}
                          className="review-rating-field-modern"
                        >
                          <span>
                            Punctuality
                          </span>

                          <div className="review-stars-modern">
                            {[1, 2, 3, 4, 5].map(
                              (star) => (
                                <button
                                  key={star}
                                  type="button"
                                  onClick={() => {
                                    setReviewForm(
                                      (prev) => ({
                                        ...prev,
                                        punctuality:
                                          star,
                                      })
                                    );

                                    setReviewMsg("");
                                    setReviewStep(3);
                                  }}
                                  className={`review-star-modern ${
                                    star <=
                                    reviewForm.punctuality
                                      ? "selected"
                                      : ""
                                  }`}
                                >
                                  ★
                                </button>
                              )
                            )}
                          </div>
                        </motion.div>
                      )}

                      {/* Value */}

                      {reviewStep === 3 && (
                        <motion.div
                          key="value"
                          initial={{
                            opacity: 0,
                            x: 35,
                            scale: 0.96,
                          }}
                          animate={{
                            opacity: 1,
                            x: 0,
                            scale: 1,
                          }}
                          exit={{
                            opacity: 0,
                            x: -35,
                            scale: 0.96,
                          }}
                          transition={{
                            duration: 0.35,
                          }}
                          className="review-rating-field-modern"
                        >
                          <span>
                            Value for Money
                          </span>

                          <div className="review-stars-modern">
                            {[1, 2, 3, 4, 5].map(
                              (star) => (
                                <button
                                  key={star}
                                  type="button"
                                  onClick={() => {
                                    setReviewForm(
                                      (prev) => ({
                                        ...prev,
                                        value_for_money:
                                          star,
                                        rating: Math.round(
                                          (
                                            prev.decoration_quality +
                                            prev.cleanliness +
                                            prev.punctuality +
                                            star
                                          ) / 4
                                        ),
                                      })
                                    );

                                    setReviewMsg("");
                                    setReviewStep(4);
                                  }}
                                  className={`review-star-modern ${
                                    star <=
                                    reviewForm.value_for_money
                                      ? "selected"
                                      : ""
                                  }`}
                                >
                                  ★
                                </button>
                              )
                            )}
                          </div>
                        </motion.div>
                      )}

                      {/* Overall */}

                      {reviewStep === 4 && (
                        <motion.div
                          key="overall"
                          initial={{
                            opacity: 0,
                            x: 35,
                          }}
                          animate={{
                            opacity: 1,
                            x: 0,
                          }}
                          transition={{
                            duration: 0.4,
                          }}
                          className="review-rating-field-modern"
                        >
                          <span>
                            Overall Rating
                          </span>

                          <div className="review-stars-modern">
                            {[1, 2, 3, 4, 5].map(
                              (star) => (
                                <span
                                  key={star}
                                  className={`review-star-modern ${
                                    star <=
                                    reviewForm.rating
                                      ? "selected"
                                      : ""
                                  }`}
                                >
                                  ★
                                </span>
                              )
                            )}
                          </div>
                        </motion.div>
                      )}

                    </AnimatePresence>

                  </div>

                  <div className="review-message-modern">

                    <label>
                      Your review{" "}
                      <span>*</span>
                    </label>

                    <textarea
                      rows={5}
                      required
                      placeholder="Tell us about your experience…"
                      value={reviewForm.comment}
                      onChange={(e) => {
                        setReviewForm({
                          ...reviewForm,
                          comment: e.target.value,
                        });

                        setReviewMsg("");
                      }}
                    />

                    <small>
                      Your review message is required
                      before posting.
                    </small>

                  </div>

                  <button
                    type="submit"
                    className="review-submit-modern"
                  >
                    Post Review
                    <span>→</span>
                  </button>

                  {reviewMsg && (
                    <p className="review-message-status-modern">
                      {reviewMsg}
                    </p>
                  )}

                </form>

              </div>

            </div>

          </section>

        </div>

        {/* =========================
            RIGHT BOOKING CARD
        ========================= */}

        <div>

          <div className="card p-5 sticky top-24">

            <h3 className="font-serif text-lg font-bold text-plum-dark mb-3">
              Ready to book?
            </h3>

            <div className="space-y-2 text-sm text-gray-600 mb-4">

              <p className="flex justify-between">
                <span>Venue charge</span>

                <span className="font-semibold">
                  ₹
                  {venue.price_per_day.toLocaleString(
                    "en-IN"
                  )}
                </span>
              </p>

              {selectedTheme && (
                <p className="flex justify-between">
                  <span>
                    Theme — {selectedTheme.name}
                  </span>

                  <span className="font-semibold">
                    ₹
                    {Number(
                      selectedTheme.price || 0
                    ).toLocaleString("en-IN")}
                  </span>
                </p>
              )}

              <p className="text-xs text-gray-400 pt-2 border-t">
                Caterer, photographer, menu & add-ons
                are selected during checkout.
              </p>

            </div>

            <button
              onClick={() => setShowBooking(true)}
              className="btn-gold w-full"
            >
              Check Availability & Book
            </button>

            <a
              href={mapOpenUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-outline w-full mt-2 flex items-center justify-center gap-1.5"
            >
              📍 View on Map
            </a>

            <p className="text-xs text-gray-400 mt-2 text-center">
              Pay just 30% now to confirm — balance due
              at the venue.
            </p>

            {!user && (
              <p className="text-xs text-gray-400 mt-1 text-center">
                You'll be asked to log in before payment.
              </p>
            )}

          </div>

        </div>

      </div>

      {/* =========================
          BOOKING MODAL
      ========================= */}

      {showBooking && (
        <BookingModal
          venue={venue}
          selectedTheme={selectedTheme}
          customColors={{
            primary: customPrimary,
            secondary: customSecondary,
          }}
          onClose={() => setShowBooking(false)}
          initialDate={previewDate}
        />
      )}

    </div>
  );
}
