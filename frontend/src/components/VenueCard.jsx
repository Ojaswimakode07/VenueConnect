import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { hasFlagshipPreview } from "../utils/venuePreview.js";

function mapUrlFor(venue) {
  const query = `${venue.name}, ${venue.address}, ${venue.city}${venue.state ? ", " + venue.state : ""}`;
  return `https://www.google.com/maps?q=${encodeURIComponent(query)}`;
}

export default function VenueCard({ venue, recommended = false }) {
  const has3DPreview = hasFlagshipPreview(venue);
  function handleViewMap(e) {
    e.preventDefault();
    e.stopPropagation();
    window.open(mapUrlFor(venue), "_blank", "noopener,noreferrer");
  }

  return (
    <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.25, ease: "easeOut" }} className="group h-full">
      <Link
        to={`/venues/${venue.id}`}
        className="card overflow-hidden hover:shadow-cardHover transition-shadow duration-300 flex flex-col h-full relative"
      >
        <div className="h-48 w-full overflow-hidden relative">
          <img
            src={venue.image_url}
            alt={venue.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          <div className="shine-sweep" />

          {/* Single top-left badge: either 3D preview or recommended — never both, to keep the image clean. */}
          {recommended ? (
            <span className="absolute top-3 left-3 text-white text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full bg-accent">
              Recommended
            </span>
          ) : has3DPreview ? (
            <span className="absolute top-3 left-3 text-plum-dark text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full bg-gold-light">
              3D Preview
            </span>
          ) : (
            <span className="absolute top-3 left-3 text-white text-[10px] font-semibold px-2.5 py-1 rounded-full bg-black/45 backdrop-blur-sm">
              {venue.category}
            </span>
          )}

          {venue.rating_count > 0 && (
            <span className="absolute top-3 right-3 bg-white/95 text-plum-dark text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
              ★ {venue.rating_avg.toFixed(1)}
              <span className="font-normal text-gray-500">({venue.rating_count})</span>
            </span>
          )}
        </div>

        <div className="p-4 flex flex-col gap-1.5 flex-1">
          {recommended && (
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{venue.category}</span>
          )}
          <h3 className="font-serif font-bold text-lg text-plum-dark leading-tight">{venue.name}</h3>
          <p className="text-sm text-gray-500">{venue.city}{venue.state ? `, ${venue.state}` : ""} · Up to {venue.capacity} guests</p>

          <div className="mt-auto pt-3 flex items-center justify-between">
            <div>
              <span className="text-plum font-bold text-lg">₹{venue.price_per_day.toLocaleString("en-IN")}</span>
              <span className="text-xs text-gray-400"> / day</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleViewMap}
                title="View on map"
                className="text-xs text-gray-500 hover:text-plum-dark transition-colors"
              >
                Map
              </button>
              <span className="text-xs font-semibold text-white bg-plum px-3 py-1.5 rounded-full group-hover:bg-gold transition-colors">
                View Venue
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
