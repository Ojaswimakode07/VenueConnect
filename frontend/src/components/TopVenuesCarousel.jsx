import React, { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

// Horizontal carousel of exactly the top 5 rated venues (rating 4.0–5.0),
// used at the top of the venue discovery / detail experience.
export default function TopVenuesCarousel({ venues }) {
  const trackRef = useRef(null);
  const [index, setIndex] = useState(0);

  const top5 = [...venues]
    .filter((v) => v.rating_avg >= 4.0 && v.rating_avg <= 5.0)
    .sort((a, b) => b.rating_avg - a.rating_avg)
    .slice(0, 5);

  if (top5.length === 0) return null;

  function scrollByCard(dir) {
    const el = trackRef.current;
    if (!el) return;
    const cardWidth = el.firstChild ? el.firstChild.offsetWidth + 16 : 280;
    el.scrollBy({ left: dir * cardWidth, behavior: "smooth" });
    setIndex((i) => Math.min(Math.max(i + dir, 0), top5.length - 1));
  }

  return (
    <div className="mb-12">
      <div className="flex items-end justify-between mb-4">
        <div>
          <p className="section-eyebrow">Top Rated, Right Now</p>
          <h2 className="font-serif text-2xl font-bold text-plum-dark">5 Highest-Rated Venues</h2>
        </div>
        <div className="hidden sm:flex gap-2">
          <button
            onClick={() => scrollByCard(-1)}
            aria-label="Previous"
            className="w-9 h-9 rounded-full border border-black/10 flex items-center justify-center text-plum-dark hover:bg-panel transition-colors"
          >
            ‹
          </button>
          <button
            onClick={() => scrollByCard(1)}
            aria-label="Next"
            className="w-9 h-9 rounded-full border border-black/10 flex items-center justify-center text-plum-dark hover:bg-panel transition-colors"
          >
            ›
          </button>
        </div>
      </div>

      <motion.div
        ref={trackRef}
        className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 -mx-1 px-1 cursor-grab active:cursor-grabbing"
        style={{ scrollbarWidth: "thin" }}
        drag="x"
        dragConstraints={{ left: -9999, right: 0 }}
        dragElastic={0.06}
      >
        {top5.map((v) => (
          <Link
            key={v.id}
            to={`/venues/${v.id}`}
            className="snap-start shrink-0 w-64 card overflow-hidden hover:shadow-cardHover transition-shadow duration-300"
          >
            <div className="h-36 w-full overflow-hidden relative">
              <img src={v.image_url} alt={v.name} className="w-full h-full object-cover" draggable={false} loading="lazy" />
              <span className="absolute top-2 right-2 bg-white/95 text-plum-dark text-[11px] font-bold px-2 py-0.5 rounded-full">
                ★ {v.rating_avg.toFixed(1)}
              </span>
            </div>
            <div className="p-3">
              <h3 className="font-serif font-bold text-sm text-plum-dark leading-tight truncate">{v.name}</h3>
              <p className="text-xs text-gray-500 mt-0.5">{v.city}{v.state ? `, ${v.state}` : ""} · {v.rating_count} reviews</p>
            </div>
          </Link>
        ))}
      </motion.div>
    </div>
  );
}
