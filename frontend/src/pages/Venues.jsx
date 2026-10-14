import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import api from "../api/axios.js";
import { EVENT_TYPES, categoriesForEvent } from "../data/eventTypes.js";

const VENUE_IMAGES = [
  "/venues/venues/Dark Romantic Wedding Reception _ Gothic Luxury Decor Inspiration.jpg",
  "/venues/venues/download (1).jpg",
  "/venues/venues/download (2).jpg",
  "/venues/venues/download.jpg",
  "/venues/venues/Dreamy Mandap Decoration Themes for Faridabad Weddings.jpg",
  "/venues/venues/Lotus Wedding Decor.jpg",
];

const AI_RECOMMENDED_VENUES = [
  {
    id: "taj-lands-end",
    name: "Taj Lands End",
    location: "Bandra, Mumbai",
    type: "Luxury Venue",
    image: "https://weddingsutra.com/images/taj-lands-end-img-nw4.jpg",
  },
  {
    id: "st-regis-mumbai",
    name: "The St. Regis Mumbai",
    location: "Lower Parel, Mumbai",
    type: "Luxury Venue",
    image: "https://www.marriottindiaweddings.com/resourcefiles/venuesgalleryimages/the-st-regis-mumbai-the-imperial-hall-featuring-round-table-setting.jpg",
  },
  {
    id: "itc-maratha-mumbai",
    name: "ITC Maratha",
    location: "Andheri East, Mumbai",
    type: "Wedding Venue",
    image: "https://www.itchotels.com/content/dam/itchotels/in/umbrella/itc/hotels/itcmaratha-mumbai/images/meetings-and-socials-landing-page/headmast/mobile/banquets.png",
  },
  {
    id: "the-leela-mumbai",
    name: "The Leela Mumbai",
    location: "Andheri East, Mumbai",
    type: "Celebration Venue",
    image: "https://www.weddingsutra.com/images/Vendor_Images/Venues/the-leela-mumbai/the-leela-mumbai-05.jpg",
  },
  {
    id: "sofitel-mumbai-bkc",
    name: "Sofitel Mumbai BKC",
    location: "Bandra Kurla Complex, Mumbai",
    type: "Event Venue",
    image: "https://thevendry.com/cdn-cgi/image/height%3D1920%2Cwidth%3D1920%2Cfit%3Dcontain%2Cmetadata%3Dnone/https%3A/s3.us-east-1.amazonaws.com/uploads.thevendry.co/36210/1726575656390_28.jpg",
  },
];

function FillLetter({ letter, index, total, progress }) {
  const start = Math.max(0, (index / total) * 0.82);
  const end = Math.min(1, start + 0.18);

  const color = useTransform(
    progress,
    [start, end],
    ["#696862", "#ffffff"]
  );

  return <motion.span style={{ color }}>{letter}</motion.span>;
}

function ScrollFillText({ children, className = "" }) {
  const ref = useRef(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 82%", "end 24%"],
  });

  const text = String(children || "").trim();
  const words = text.split(/\s+/);
  const totalLetters = Array.from(text.replace(/\s/g, "")).length || 1;
  let letterIndex = 0;

  return (
    <h2 ref={ref} className={className}>
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
    </h2>
  );
}

export default function Venues() {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();

  const [city, setCity] = useState(searchParams.get("city") || "");
  const [eventType, setEventType] = useState(
    searchParams.get("event_type") || ""
  );
  const [eventDate, setEventDate] = useState(
    searchParams.get("event_date") || ""
  );
  const [guests, setGuests] = useState(
    searchParams.get("min_capacity") || ""
  );

  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(
    searchParams.has("city") ||
      searchParams.has("event_type") ||
      searchParams.has("event_date") ||
      searchParams.has("min_capacity")
  );

  const [activeImage, setActiveImage] = useState(0);
  const [activeFeature, setActiveFeature] = useState(null);
  const [recommendedIndex, setRecommendedIndex] = useState(0);

  useEffect(() => {
    if (!location.state?.scrollToSearch) return;

    const scrollToSearch = () => {
      const searchSection = document.getElementById("search");
      if (searchSection) {
        const y =
          searchSection.getBoundingClientRect().top +
          window.scrollY -
          80;

        window.scrollTo({
          top: y,
          behavior: "smooth",
        });
      }
    };

    requestAnimationFrame(() => {
      requestAnimationFrame(scrollToSearch);
    });
  }, [location.state]);


  /*
   * ---------------------------------------------------------
   * CINEMATIC IMAGE TRANSITION
   * ---------------------------------------------------------
   */

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveImage((current) => (current + 1) % VENUE_IMAGES.length);
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setRecommendedIndex((current) =>
        current >= AI_RECOMMENDED_VENUES.length - 3 ? 0 : current + 1
      );
    }, 3500);

    return () => clearInterval(timer);
  }, []);

  /*
   * ---------------------------------------------------------
   * SEARCH
   * ---------------------------------------------------------
   */

  const runSearch = async (overrideValues = null) => {
    const values = overrideValues || {
      city,
      eventType,
      eventDate,
      guests,
    };

    setLoading(true);
    setSearched(true);

    try {
      const params = {};

      if (values.city?.trim()) {
        params.city = values.city.trim();
      }

      if (values.eventType) {
        const categories = categoriesForEvent(values.eventType);

        if (categories.length > 0) {
          params.categories = categories.join(",");
        }
      }

      if (values.eventDate) {
        params.event_date = values.eventDate;
      }

      if (values.guests) {
        params.min_capacity = values.guests;
      }

      /*
       * The backend accepts one venue category at a time. Search each
       * category mapped to the selected event and merge the results so
       * only venues matching the requested event requirements are shown.
       */
      const categories = values.eventType
        ? categoriesForEvent(values.eventType)
        : [];

      const searchCategories = categories.length ? categories : [null];

      const responses = await Promise.all(
        searchCategories.map((category) => {
          const categoryParams = { ...params };

          if (category) {
            categoryParams.category = category;
            delete categoryParams.categories;
          }

          return api.get("/venues", {
            params: categoryParams,
          });
        })
      );

      const merged = responses.flatMap((response) => {
        let data = response.data;

        if (!Array.isArray(data)) {
          data = data?.venues || data?.data || [];
        }

        return Array.isArray(data) ? data : [];
      });

      const unique = Array.from(
        new Map(
          merged.map((venue, index) => [
            venue.id ?? `venue-${index}`,
            venue,
          ])
        ).values()
      );

      const sorted = unique.sort((a, b) => {
        const ratingA = Number(a?.rating_avg || 0);
        const ratingB = Number(b?.rating_avg || 0);

        return ratingB - ratingA;
      });

      setVenues(sorted);

      /*
       * Keep URL synchronized with search.
       */

      const nextParams = {};

      if (values.city?.trim()) {
        nextParams.city = values.city.trim();
      }

      if (values.eventType) {
        nextParams.event_type = values.eventType;
      }

      if (values.eventDate) {
        nextParams.event_date = values.eventDate;
      }

      if (values.guests) {
        nextParams.min_capacity = values.guests;
      }

      setSearchParams(nextParams);
    } catch (error) {
      console.error("Venue search failed:", error);
      setVenues([]);
    } finally {
      setLoading(false);
    }
  };

  /*
   * Automatically perform search when the page is opened
   * with search parameters in the URL.
   */

  useEffect(() => {
    const hasSearch =
      searchParams.has("city") ||
      searchParams.has("event_type") ||
      searchParams.has("event_date") ||
      searchParams.has("min_capacity");

    if (!hasSearch) return;

    const urlCity = searchParams.get("city") || "";
    const urlEvent = searchParams.get("event_type") || "";
    const urlDate = searchParams.get("event_date") || "";
    const urlGuests = searchParams.get("min_capacity") || "";

    setCity(urlCity);
    setEventType(urlEvent);
    setEventDate(urlDate);
    setGuests(urlGuests);

    runSearch({
      city: urlCity,
      eventType: urlEvent,
      eventDate: urlDate,
      guests: urlGuests,
    });

    // Intentionally run once for URL-loaded searches.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /*
   * ---------------------------------------------------------
   * DATE DISPLAY
   * ---------------------------------------------------------
   */

  const formattedDate = useMemo(() => {
    if (!eventDate) return "";

    const date = new Date(`${eventDate}T00:00:00`);

    if (Number.isNaN(date.getTime())) return eventDate;

    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }, [eventDate]);

  /*
   * ---------------------------------------------------------
   * HERO TEXT
   * ---------------------------------------------------------
   */

  const heroLines = [
    "Built for the moments",
    "that matter.",
  ];

  useEffect(() => {
    if (window.location.hash !== "#results") return;

    requestAnimationFrame(() => {
      const resultsSection = document.getElementById("results");
      if (resultsSection) {
        const y =
          resultsSection.getBoundingClientRect().top +
          window.scrollY -
          70;

        window.scrollTo({
          top: y,
          behavior: "smooth",
        });
      }
    });
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=DM+Serif+Display&display=swap');

        :root {
          --vc-black: #000000;
          --vc-deep: #000000;
          --vc-white: #ffffff;
          --vc-muted: #777770;
          --vc-line: rgba(240,239,232,.14);
          --vc-blue: #2f80ff;
        }

        html {
          background: var(--vc-black);
        }

        body {
          margin: 0;
          background: var(--vc-black);
        }

        html::-webkit-scrollbar {
          width: 3px;
        }

        html::-webkit-scrollbar-track {
          background: #000000;
        }

        html::-webkit-scrollbar-thumb {
          background: #2f80ff;
          border-radius: 10px;
          min-height: 75px;
        }

        html {
          scrollbar-width: thin;
          scrollbar-color: #2f80ff #000000;
        }

        * {
          box-sizing: border-box;
        }

        .vc-page {
          width: 100%;
          min-height: 100vh;
          background: var(--vc-black);
          color: var(--vc-white);
          font-family: "DM Sans", sans-serif;
          overflow-x: hidden;
        }

        /*
        ---------------------------------------------------------
        NAVBAR
        ---------------------------------------------------------
        */

        /* Keep the Venues page header exactly the same black as the page */
        body:has(.vc-page) header,
        body:has(.vc-page) nav {
          background: var(--vc-black) !important;
          border-color: var(--vc-line) !important;
        }

        body:has(.vc-page) header a,
        body:has(.vc-page) nav a,
        body:has(.vc-page) header button,
        body:has(.vc-page) nav button {
          color: var(--vc-white) !important;
        }

        /* Make both parts of the VenueConnect logo visible on black */
        body:has(.vc-page) header a:first-child span:first-child,
        body:has(.vc-page) nav a:first-child span:first-child {
          color: var(--vc-white) !important;
        }

        body:has(.vc-page) header a:first-child span:last-child,
        body:has(.vc-page) nav a:first-child span:last-child {
          color: #c79b3b !important;
        }

        /* Navbar underline: hidden by default, white only on hover */
        body:has(.vc-page) header nav a > span:last-child,
        body:has(.vc-page) nav a > span:last-child {
          background: transparent !important;
        }

        body:has(.vc-page) header nav a:hover > span:last-child,
        body:has(.vc-page) nav a:hover > span:last-child {
          background: #ffffff !important;
        }

        /*
        ---------------------------------------------------------
        CINEMATIC HERO
        ---------------------------------------------------------
        */

        .vc-hero {
          position: relative;
          height: calc(100vh - 20px);
          min-height: 0;
          overflow: hidden;
          background: #000000;
        }

        .vc-hero-images {
          position: absolute;
          inset: 0;
          overflow: hidden;
        }

        .vc-hero-image {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center center;
          filter: blur(3px);
          opacity: 0;
          transform: scale(1.045);
          transition:
            opacity 1.8s cubic-bezier(.65,0,.25,1),
            transform 6s cubic-bezier(.2,.65,.25,1);
          will-change: opacity, transform;
        }

        .vc-hero-image.active {
          opacity: 1;
          transform: scale(1);
        }

        .vc-hero-overlay {
          position: absolute;
          inset: 0;
          background:
            linear-gradient(
              180deg,
              rgba(0,0,0,.48) 0%,
              rgba(0,0,0,.10) 42%,
              rgba(0,0,0,.58) 100%
            );
          z-index: 2;
        }

        .vc-hero-content {
          position: absolute;
          z-index: 3;
          left: 7vw;
          bottom: 27vh;
          width: min(760px, 82vw);
        }

        .vc-eyebrow {
          display: none;
        }

        .vc-hero-title {
          margin: 0;
          font-family: Georgia, "Times New Roman", serif;
          font-size: clamp(55px, 8vw, 125px);
          font-weight: 500;
          line-height: 1.10;
          letter-spacing: -.065em;
          word-spacing: .06em;
          color: var(--vc-white);
        }

        .vc-hero-title-line {
          display: block;
          overflow: hidden;
        }

        .vc-hero-title-line span {
          display: block;
          animation: vcLineReveal 1.1s cubic-bezier(.22,.61,.36,1) both;
        }

        .vc-hero-title-line:nth-child(2) span {
          animation-delay: .12s;
        }

        .vc-hero-title-line:nth-child(3) span {
          animation-delay: .24s;
        }

        @keyframes vcLineReveal {
          from {
            opacity: 0;
            transform: translateY(90%);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .vc-hero-description {
          margin-top: 30px;
          max-width: 460px;
          color: rgba(240,239,232,.72);
          font-size: 17px;
          line-height: 1.65;
        }

        /*
        ---------------------------------------------------------
        INTRO
        ---------------------------------------------------------
        */

        .vc-intro {
          padding: 150px 7vw 130px;
          background: var(--vc-black);
        }

        .vc-intro-grid {
          display: grid;
          grid-template-columns: 1fr 2fr;
          gap: 60px;
          align-items: start;
        }

        .vc-small-label {
          display: none;
        }

        .vc-intro-title {
          margin: 0;
          max-width: 1050px;
          font-family: Georgia, "Times New Roman", serif;
          font-size: clamp(48px, 6.5vw, 100px);
          line-height: .96;
          letter-spacing: -.065em;
          font-weight: 500;
          color: var(--vc-muted);
        }

        @keyframes vcSentenceFill {
          from {
            background-position: 0% 0;
          }
          to {
            background-position: 100% 0;
          }
        }

        .vc-intro-copy {
          max-width: 560px;
          margin-top: 45px;
          margin-left: auto;
          color: var(--vc-muted);
          font-size: 17px;
          line-height: 1.7;
        }

        /*
        ---------------------------------------------------------
        SEARCH SECTION
        ---------------------------------------------------------
        */

        .vc-search-section {
          padding: 85px 8vw 95px;
          background: #000000;
        }

        .vc-search-layout {
          display: grid;
          grid-template-columns: minmax(300px, .9fr) minmax(450px, 1.25fr);
          gap: clamp(55px, 7vw, 110px);
          max-width: 1280px;
          margin: 0 auto;
          align-items: center;
        }

        .vc-search-heading {
          max-width: 500px;
        }

        .vc-search-heading h2 {
          margin: 32px 0 28px;
          font-family: Georgia, "Times New Roman", serif;
          font-size: clamp(58px, 6.4vw, 96px);
          line-height: .9;
          letter-spacing: -.07em;
          font-weight: 500;
          color: var(--vc-white);
        }

        .vc-search-heading p {
          max-width: 460px;
          color: var(--vc-muted);
          font-size: 16px;
          line-height: 1.7;
        }

        /*
        SEARCH BOX
        Similar structure to your screenshot.
        */

        .vc-search-box {
          width: 100%;
          border-top: 1px solid var(--vc-line);
        }

        .vc-field {
          position: relative;
          min-height: 88px;
          padding: 21px 0 16px;
          border-bottom: 1px solid var(--vc-line);
        }

        .vc-field label {
          display: block;
          margin-bottom: 13px;
          color: #8a8982;
          font-family: "DM Mono", monospace;
          font-size: 10px;
          letter-spacing: .15em;
        }

        .vc-field input,
        .vc-field select {
          width: 100%;
          border: 0;
          outline: 0;
          background: transparent;
          color: var(--vc-white);
          font-family: "DM Sans", sans-serif;
          font-size: 18px;
          appearance: none;
        }

        .vc-field input::placeholder {
          color: #676760;
        }

        .vc-field select {
          cursor: pointer;
        }

        .vc-field select option {
          background: #151513;
          color: var(--vc-white);
        }

        .vc-field-arrow {
          position: absolute;
          right: 4px;
          bottom: 22px;
          color: #85857e;
          font-size: 14px;
          pointer-events: none;
        }

        .vc-date-wrap {
          position: relative;
        }

        .vc-date-wrap {
          position: relative;
        }

        .vc-date-wrap input {
          color-scheme: dark;
          padding-right: 42px;
        }

        .vc-date-wrap input::-webkit-calendar-picker-indicator {
          opacity: 0;
          cursor: pointer;
          position: absolute;
          right: 0;
          width: 42px;
          height: 42px;
        }

        .vc-date-icon {
          position: absolute;
          right: 4px;
          bottom: 18px;
          width: 22px;
          height: 22px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #85857e;
          pointer-events: none;
        }

        .vc-date-icon svg {
          width: 19px;
          height: 19px;
          stroke: currentColor;
          fill: none;
          stroke-width: 1.8;
          stroke-linecap: round;
          stroke-linejoin: round;
        }

        .vc-search-button {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          min-height: 64px;
          margin-top: 24px;
          padding: 0 24px;
          border: 0;
          background: var(--vc-blue);
          color: #07111f;
          cursor: pointer;
          font-family: "DM Mono", monospace;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: .12em;
          text-transform: uppercase;
          transition:
            transform .3s ease,
            background .3s ease;
        }

        .vc-search-button:hover {
          transform: translateY(-2px);
          background: #4b91ff;
        }

        .vc-search-button:disabled {
          opacity: .65;
          cursor: wait;
          transform: none;
        }

        .vc-search-button-arrow {
          font-size: 24px;
          line-height: 1.28;
        }

        /*
        ---------------------------------------------------------
        SEARCH SUMMARY
        ---------------------------------------------------------
        */

        .vc-search-summary {
          max-width: 1280px;
          margin: 65px auto 0;
          padding-top: 25px;
          border-top: 1px solid var(--vc-line);
          display: flex;
          justify-content: space-between;
          gap: 30px;
          align-items: center;
        }

        .vc-summary-text {
          color: var(--vc-muted);
          font-size: 14px;
        }

        .vc-summary-text strong {
          color: var(--vc-white);
          font-weight: 500;
        }

        /*
        ---------------------------------------------------------
        RESULTS
        ---------------------------------------------------------
        */

        .vc-results {
          padding: 110px 7vw 150px;
          background: var(--vc-black);
        }

        .vc-results-top {
          display: flex;
          justify-content: space-between;
          align-items: end;
          gap: 40px;
          margin-bottom: 60px;
          padding-bottom: 25px;
          border-bottom: 1px solid var(--vc-line);
        }

        .vc-results-title {
          margin: 15px 0 0;
          font-size: clamp(48px, 6vw, 90px);
          font-weight: 500;
          line-height: .92;
          letter-spacing: -.065em;
        }

        .vc-results-count {
          color: var(--vc-muted);
          font-family: "DM Mono", monospace;
          font-size: 11px;
          letter-spacing: .12em;
        }

        .vc-venue-list {
          width: 100%;
        }

        .vc-venue-row {
          position: relative;
          display: grid;
          grid-template-columns: 70px minmax(260px, 1.7fr) minmax(160px, .8fr) minmax(130px, .6fr) 45px;
          gap: 25px;
          align-items: center;
          min-height: 145px;
          border-bottom: 1px solid var(--vc-line);
          color: var(--vc-white);
          text-decoration: none;
          overflow: hidden;
        }

        .vc-venue-row::before {
          content: "";
          position: absolute;
          inset: 0;
          background: rgba(47,128,255,.055);
          transform: translateX(-100%);
          transition: transform .6s cubic-bezier(.22,.61,.36,1);
        }

        .vc-venue-row:hover::before {
          transform: translateX(0);
        }

        .vc-venue-number,
        .vc-venue-name,
        .vc-venue-meta,
        .vc-venue-arrow {
          position: relative;
          z-index: 1;
        }

        .vc-venue-number {
          color: var(--vc-blue);
          font-family: "DM Mono", monospace;
          font-size: 10px;
          letter-spacing: .1em;
        }

        .vc-venue-name {
          font-size: clamp(25px, 3vw, 43px);
          line-height: 1;
          letter-spacing: -.045em;
          font-weight: 500;
        }

        .vc-venue-meta {
          color: #8b8b84;
          font-size: 13px;
          line-height: 1.6;
        }

        .vc-venue-arrow {
          color: var(--vc-blue);
          font-size: 25px;
          transition: transform .4s ease;
        }

        .vc-venue-row:hover .vc-venue-arrow {
          transform: translate(5px, -5px);
        }

        /*
        ---------------------------------------------------------
        NO RESULTS
        ---------------------------------------------------------
        */

        .vc-empty {
          padding: 80px 0 30px;
        }

        .vc-empty-label {
          color: var(--vc-blue);
          font-family: "DM Mono", monospace;
          font-size: 10px;
          letter-spacing: .15em;
          text-transform: uppercase;
        }

        .vc-empty h3 {
          font-family: Georgia, "Times New Roman", serif;
          margin: 25px 0 0;
          max-width: 900px;
          font-size: clamp(55px, 7vw, 105px);
          line-height: .9;
          letter-spacing: -.07em;
          font-weight: 500;
        }

        .vc-empty p {
          max-width: 450px;
          margin-top: 35px;
          color: var(--vc-muted);
          line-height: 1.7;
        }

        /*
        ---------------------------------------------------------
        AI RECOMMENDATIONS
        ---------------------------------------------------------
        */

        .vc-ai-recommendations {
          margin-top: 90px;
          overflow: hidden;
        }

        .vc-ai-recommendations-head {
          display: flex;
          justify-content: space-between;
          align-items: end;
          gap: 30px;
          margin-bottom: 35px;
        }

        .vc-ai-recommendations-title {
          font-family: Georgia, "Times New Roman", serif;
          margin: 12px 0 0;
          font-size: clamp(32px, 4vw, 58px);
          line-height: .95;
          letter-spacing: -.055em;
          font-weight: 500;
        }

        .vc-ai-carousel-controls {
          display: flex;
          gap: 10px;
        }

        .vc-ai-carousel-button {
          width: 42px;
          height: 42px;
          border: 1px solid var(--vc-line);
          background: transparent;
          color: var(--vc-white);
          cursor: pointer;
          font-size: 18px;
          transition: background .3s ease, transform .3s ease;
        }

        .vc-ai-carousel-button:hover {
          background: rgba(240,239,232,.08);
          transform: translateY(-2px);
        }

        .vc-ai-carousel-window {
          overflow: hidden;
          --vc-ai-card-width: calc((100% - 40px) / 3);
        }

        .vc-ai-carousel-track {
          display: flex;
          gap: 20px;
          transform: translateX(
            calc(var(--vc-ai-index) * -1 * (var(--vc-ai-card-width) + 20px))
          );
          transition: transform .8s cubic-bezier(.16,1,.3,1);
          will-change: transform;
        }

        .vc-ai-card {
          flex: 0 0 var(--vc-ai-card-width);
          min-width: 0;
          background: #111110;
          overflow: hidden;
        }

        .vc-ai-card-image {
          height: 240px;
          overflow: hidden;
        }

        .vc-ai-card-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          transition: transform .8s cubic-bezier(.16,1,.3,1);
        }

        .vc-ai-card:hover .vc-ai-card-image img {
          transform: scale(1.04);
        }

        .vc-ai-card-info {
          padding: 22px 22px 25px;
        }

        .vc-ai-card-type {
          color: var(--vc-blue);
          font-family: "DM Mono", monospace;
          font-size: 10px;
          letter-spacing: .12em;
          text-transform: uppercase;
        }

        .vc-ai-card-name {
          font-family: Georgia, "Times New Roman", serif;
          margin: 12px 0 8px;
          font-size: 25px;
          line-height: 1;
          letter-spacing: -.04em;
        }

        .vc-ai-card-location {
          color: var(--vc-muted);
          font-size: 13px;
        }

        /*
        ---------------------------------------------------------
        FEATURES
        ---------------------------------------------------------
        */

        .vc-features {
          padding: 130px 7vw 145px;
          background: #000000;
        }

        .vc-features-header {
          display: grid;
          grid-template-columns: 1fr 2fr;
          gap: 50px;
          padding-bottom: 80px;
        }

        .vc-features-title {
          font-family: Georgia, "Times New Roman", serif;
          margin: 0;
          max-width: 1000px;
          font-size: clamp(48px, 6.4vw, 98px);
          line-height: 1;
          letter-spacing: -.07em;
          font-weight: 500;
          color: var(--vc-muted);
        }

        .vc-feature-grid {
          display: grid;
          grid-template-columns: 1fr;
          border-top: 1px solid var(--vc-line);
        }

        .vc-feature {
          position: relative;
          min-height: 190px;
          padding: 24px 30px 24px 0;
          border-bottom: 1px solid var(--vc-line);
          cursor: pointer;
          overflow: hidden;
          transition:
            background .45s ease,
            transform .45s cubic-bezier(.22,.61,.36,1);
        }

        .vc-feature::before {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(
            105deg,
            rgba(47,128,255,.12),
            rgba(47,128,255,.035) 52%,
            transparent 82%
          );
          transform: translateX(-105%);
          transition: transform .65s cubic-bezier(.22,.61,.36,1);
          pointer-events: none;
        }

        .vc-feature::after {
          content: "";
          position: absolute;
          left: 0;
          top: 0;
          width: 2px;
          height: 100%;
          background: var(--vc-blue);
          transform: scaleY(0);
          transform-origin: bottom;
          transition: transform .45s cubic-bezier(.22,.61,.36,1);
          pointer-events: none;
        }

        .vc-feature > * {
          position: relative;
          z-index: 1;
        }

        .vc-feature:hover {
          background: rgba(255,255,255,.018);
          transform: translateY(-3px);
        }

        .vc-feature:hover::before,
        .vc-feature.is-active::before {
          transform: translateX(0);
        }

        .vc-feature.is-active {
          background: rgba(47,128,255,.035);
          transform: translateY(-5px);
        }

        .vc-feature.is-active::after {
          transform: scaleY(1);
        }

        .vc-feature + .vc-feature {
          padding-left: 0;
          border-left: 0;
        }

        .vc-feature-number {
          color: var(--vc-blue);
          font-family: "DM Mono", monospace;
          font-size: 11px;
          letter-spacing: .12em;
          transition: color .35s ease, transform .4s ease;
        }

        .vc-feature h3 {
          font-family: Georgia, "Times New Roman", serif;
          margin: 42px 0 14px;
          font-size: 28px;
          line-height: 1;
          letter-spacing: -.04em;
          font-weight: 500;
          transition:
            color .35s ease,
            transform .45s cubic-bezier(.22,.61,.36,1);
        }

        .vc-feature p {
          max-width: 300px;
          color: var(--vc-muted);
          font-size: 14px;
          line-height: 1.7;
          transition:
            color .35s ease,
            transform .45s cubic-bezier(.22,.61,.36,1);
        }

        .vc-feature.is-active .vc-feature-number {
          color: var(--vc-white);
          transform: translateX(5px);
        }

        .vc-feature.is-active h3 {
          color: var(--vc-blue);
          transform: translateX(10px);
        }

        .vc-feature.is-active p {
          color: rgba(240,239,232,.78);
          transform: translateX(10px);
        }

        .vc-feature p {
          max-width: 300px;
          color: var(--vc-muted);
          font-size: 14px;
          line-height: 1.7;
        }

        /*
        ---------------------------------------------------------
        FINAL SECTION
        ---------------------------------------------------------
        */

        .vc-final {
          padding: 150px 7vw;
          min-height: 65vh;
          display: flex;
          align-items: center;
          background: var(--vc-black);
        }

        .vc-final-inner {
          width: 100%;
        }

        .vc-final h2 {
          max-width: 1150px;
          margin: 25px 0 0;
          font-size: clamp(55px, 8vw, 125px);
          line-height: .9;
          letter-spacing: -.075em;
          font-weight: 500;
        }

        .vc-final h2 span {
          color: #d7e0ff;
        }

        /*
        ---------------------------------------------------------
        MOBILE
        ---------------------------------------------------------
        */

        @media (max-width: 900px) {
          .vc-hero {
            height: 75vh;
            min-height: 580px;
          }

          .vc-hero-content {
            left: 6vw;
            bottom: 8vh;
            width: 88vw;
          }

          .vc-intro-grid,
          .vc-features-header {
            grid-template-columns: 1fr;
          }

          .vc-intro {
            padding: 110px 6vw;
          }

          .vc-search-section {
            padding: 100px 6vw;
          }

          .vc-search-layout {
            grid-template-columns: 1fr;
            gap: 70px;
          }

          .vc-search-heading h2 {
            font-size: clamp(55px, 14vw, 85px);
          }

          .vc-results {
            padding: 90px 6vw;
          }

          .vc-venue-row {
            grid-template-columns: 45px 1fr 35px;
            gap: 15px;
            min-height: 120px;
          }

          .vc-venue-meta {
            display: none;
          }

          .vc-feature-grid {
            grid-template-columns: 1fr;
          }

          .vc-feature {
            padding: 30px 0;
          }

          .vc-feature + .vc-feature {
            padding-left: 0;
            border-left: 0;
          }

          .vc-feature h3 {
            margin-top: 45px;
          }
        }

        @media (max-width: 760px) {
          .vc-ai-carousel-window {
            --vc-ai-card-width: calc((100% - 20px) / 2);
          }

          .vc-ai-card {
            flex-basis: var(--vc-ai-card-width);
          }
        }

        @media (max-width: 560px) {
          .vc-hero-title {
            font-size: 54px;
          }

          .vc-hero-description {
            font-size: 15px;
          }

          .vc-field {
            min-height: 90px;
          }

          .vc-search-button {
            min-height: 65px;
          }

          .vc-results-top {
            align-items: start;
            flex-direction: column;
          }

          .vc-venue-name {
            font-size: 25px;
          }

          .vc-final {
            min-height: 50vh;
            padding: 100px 6vw;
          }
          .vc-hero-content {
  position: absolute !important;
  z-index: 3;
  left: 7vw;
  bottom: 10vh !important;
  width: min(760px, 82vw);

  /* MOVE TEXT UP */
  transform: translateY(-100px) !important;
}
}
        }
      `}</style>

      <main className="vc-page">

        {/* =====================================================
            CINEMATIC HERO
        ====================================================== */}

        <section className="vc-hero">

          <div className="vc-hero-images">
            {VENUE_IMAGES.map((image, index) => (
              <img
                key={image}
                src={image}
                alt=""
                className={`vc-hero-image ${
                  activeImage === index ? "active" : ""
                }`}
              />
            ))}
          </div>

          <div className="vc-hero-overlay" />

          <div className="vc-hero-content">
            <div className="vc-eyebrow">
              FIND YOUR SPACE
            </div>

            <h1 className="vc-hero-title">
              {heroLines.map((line) => (
                <span
                  className="vc-hero-title-line"
                  key={line}
                >
                  <span>{line}</span>
                </span>
              ))}
            </h1>

            <p className="vc-hero-description">
              Discover spaces designed for weddings, celebrations,
              gatherings and everything worth remembering.
            </p>
          </div>

        </section>

        {/* =====================================================
            INTRO
        ====================================================== */}

        <section className="vc-intro">

          <div className="vc-intro-grid">

            <div>
              <div className="vc-small-label">
                VENUECONNECT
              </div>
            </div>

            <div>
              <ScrollFillText className="vc-intro-title">
                Every celebration deserves a place that feels right.
              </ScrollFillText>

              <p className="vc-intro-copy">
                Explore inspiring venues, compare the details that
                matter and find a setting that fits your celebration.
                From intimate gatherings to unforgettable weddings,
                VenueConnect keeps the search simple.
              </p>
            </div>

          </div>

        </section>

        {/* =====================================================
            SEARCH
        ====================================================== */}

        <section className="vc-search-section" id="search">

          <div className="vc-search-layout">

            {/* LEFT */}

            <div className="vc-search-heading">

              <div className="vc-small-label">
                PLAN YOUR EVENT
              </div>

              <h2>
                Filter your
                <br />
                search.
              </h2>

              <p>
                Search by location, celebration, date and guest
                count — we'll help you find the right space for
                your moment.
              </p>

            </div>

            {/* RIGHT */}

            <form
              className="vc-search-box"
              onSubmit={(e) => {
                e.preventDefault();

                runSearch();
              }}
            >

              {/* LOCATION */}

              <div className="vc-field">

                <label>
                  CITY
                </label>

                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Mumbai, Pune, Amravati..."
                />

              </div>

              {/* EVENT */}

              <div className="vc-field">

                <label>
                  EVENT TYPE
                </label>

                <select
                  value={eventType}
                  onChange={(e) =>
                    setEventType(e.target.value)
                  }
                >

                  <option value="">
                    Any event
                  </option>

                  {EVENT_TYPES.map((event) => (
                    <option
                      key={event.value}
                      value={event.value}
                    >
                      {event.value}
                    </option>
                  ))}

                </select>

                <span className="vc-field-arrow">
                  ↓
                </span>

              </div>

              {/* DATE */}

              <div className="vc-field">

                <label>
                  EVENT DATE
                </label>

                <div className="vc-date-wrap">

                  <input
                    type="date"
                    value={eventDate}
                    onChange={(e) =>
                      setEventDate(e.target.value)
                    }
                  />

                  <span className="vc-date-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24">
                      <rect x="3.5" y="5" width="17" height="15.5" rx="1.5" />
                      <path d="M7 3.5v3M17 3.5v3M3.5 9h17" />
                    </svg>
                  </span>

                </div>

              </div>

              {/* GUESTS */}

              <div className="vc-field">

                <label>
                  GUESTS
                </label>

                <input
                  type="number"
                  min="1"
                  value={guests}
                  onChange={(e) =>
                    setGuests(e.target.value)
                  }
                  placeholder="Number of guests"
                />

              </div>

              {/* BUTTON */}

              <button
                className="vc-search-button"
                type="submit"
                disabled={loading}
              >

                <span>
                  {loading
                    ? "SEARCHING..."
                    : "SEARCH VENUES"}
                </span>

                <span className="vc-search-button-arrow">
                  ↗
                </span>

              </button>

            </form>

          </div>

          {searched && (
            <div className="vc-search-summary">

              <div className="vc-summary-text">

                {loading ? (
                  "Finding suitable venues..."
                ) : (
                  <>
                    <strong>
                      {venues.length}
                    </strong>{" "}
                    venue{venues.length === 1 ? "" : "s"} found
                    {city ? ` in ${city}` : ""}
                    {formattedDate
                      ? ` for ${formattedDate}`
                      : ""}
                  </>
                )}

              </div>

            </div>
          )}

        </section>

        {/* =====================================================
            RESULTS
        ====================================================== */}

        {searched && (
          <section className="vc-results" id="results">

            {venues.length > 0 ? (
              <>
                <div className="vc-results-top">

                  <div>

                    <div className="vc-small-label">
                      AVAILABLE SPACES
                    </div>

                    <h2 className="vc-results-title">
                      Your venues.
                    </h2>

                  </div>

                  <div className="vc-results-count">
                    {venues.length
                      .toString()
                      .padStart(2, "0")}{" "}
                    RESULTS
                  </div>

                </div>

                <div className="vc-venue-list">

                  {venues.map((venue, index) => (
                    <Link
                      key={venue.id}
                      to={`/venues/${venue.id}`}
                      className="vc-venue-row"
                    >

                      <div className="vc-venue-number">
                        {String(index + 1).padStart(2, "0")}
                      </div>

                      <div className="vc-venue-name">
                        {venue.name || "Venue"}
                      </div>

                      <div className="vc-venue-meta">
                        {venue.city || ""}
                        {venue.state
                          ? `, ${venue.state}`
                          : ""}
                        <br />

                        {venue.category || "Event Space"}
                      </div>

                      <div className="vc-venue-meta">

                        {venue.capacity
                          ? `Up to ${venue.capacity} guests`
                          : "Capacity available"}

                        <br />

                        {venue.rating_avg
                          ? `★ ${Number(
                              venue.rating_avg
                            ).toFixed(1)}`
                          : "Highly rated"}

                      </div>

                      <div className="vc-venue-arrow">
                        ↗
                      </div>

                    </Link>
                  ))}

                </div>
              </>
            ) : (
              <div className="vc-empty">

                <div className="vc-empty-label">
                  NO MATCHES
                </div>

                <h3>
                  Nothing found.
                </h3>

                <p>
                  Try changing the city, event type, date or
                  guest count and search again.
                </p>

              </div>
            )}



          </section>
        )}

        <div className="vc-ai-recommendations">

                <div className="vc-ai-recommendations-head">
                  <div>
                    <div className="vc-small-label">
                      AI RECOMMENDED
                    </div>
                    <h3 className="vc-ai-recommendations-title">
                      Top Recommended Venues
                    </h3>
                  </div>

                  <div className="vc-ai-carousel-controls">
                    <button
                      type="button"
                      className="vc-ai-carousel-button"
                      onClick={() =>
                        setRecommendedIndex((current) =>
                          Math.max(0, current - 1)
                        )
                      }
                      aria-label="Previous recommended venue"
                    >
                      ←
                    </button>
                    <button
                      type="button"
                      className="vc-ai-carousel-button"
                      onClick={() =>
                        setRecommendedIndex((current) =>
                          Math.min(
                            AI_RECOMMENDED_VENUES.length - 3,
                            current + 1
                          )
                        )
                      }
                      aria-label="Next recommended venue"
                    >
                      →
                    </button>
                  </div>
                </div>

                <div className="vc-ai-carousel-window">
                  <div
                    className="vc-ai-carousel-track"
                    style={{
                      "--vc-ai-index": recommendedIndex,
                    }}
                  >
                    {AI_RECOMMENDED_VENUES.map((venue, index) => (
                      <Link
                        to={`/venues/${venue.id}`}
                        className="vc-ai-card"
                        key={`${venue.name}-${index}`}
                      >
                        <div className="vc-ai-card-image">
                          <img src={venue.image} alt={venue.name} />
                        </div>
                        <div className="vc-ai-card-info">
                          <div className="vc-ai-card-type">
                            {venue.type}
                          </div>
                          <h4 className="vc-ai-card-name">
                            {venue.name}
                          </h4>
                          <div className="vc-ai-card-location">
                            {venue.location}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>

        </div>

        {/* =====================================================
            FEATURES
        ====================================================== */}

        <section className="vc-features">

          <div className="vc-features-header">

            <div>
              <div className="vc-small-label">
                WHY VENUECONNECT
              </div>
            </div>

            <ScrollFillText className="vc-features-title">
              Finding the right place should feel effortless.
            </ScrollFillText>

          </div>

          <div className="vc-feature-grid">

            <div
              className={`vc-feature ${activeFeature === 0 ? "is-active" : ""}`}
              role="button"
              tabIndex={0}
              onClick={() =>
                setActiveFeature(activeFeature === 0 ? null : 0)
              }
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setActiveFeature(activeFeature === 0 ? null : 0);
                }
              }}
            >

              <h3>
                Discover
              </h3>

              <p>
                Find spaces based on your city, event,
                date and guest requirements.
              </p>

            </div>

            <div
              className={`vc-feature ${activeFeature === 1 ? "is-active" : ""}`}
              role="button"
              tabIndex={0}
              onClick={() =>
                setActiveFeature(activeFeature === 1 ? null : 1)
              }
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setActiveFeature(activeFeature === 1 ? null : 1);
                }
              }}
            >

              <h3>
                Compare
              </h3>

              <p>
                Explore venue details, capacity, ratings
                and pricing before making your choice.
              </p>

            </div>

            <div
              className={`vc-feature ${activeFeature === 2 ? "is-active" : ""}`}
              role="button"
              tabIndex={0}
              onClick={() =>
                setActiveFeature(activeFeature === 2 ? null : 2)
              }
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setActiveFeature(activeFeature === 2 ? null : 2);
                }
              }}
            >

              <h3>
                Celebrate
              </h3>

              <p>
                Choose a setting that fits your occasion
                and turn the search into the beginning of
                something memorable.
              </p>

            </div>

          </div>

        </section>

        {/* =====================================================
            FINAL
        ====================================================== */}

        <section className="vc-final">

          <div className="vc-final-inner">

            <div className="vc-small-label">
              YOUR MOMENT STARTS HERE
            </div>

            <h2>
              Find the place.
              <br />
              Make it <span>yours.</span>
            </h2>

          </div>

        </section>

      </main>
    </>
  );
}