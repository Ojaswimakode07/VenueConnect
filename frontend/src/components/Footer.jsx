import React from "react";

export default function Footer() {
  return (
    <footer className="bg-black border-t border-white/10">
      <div className="w-full px-6 md:px-12 py-5">

        <div className="flex flex-col md:grid md:grid-cols-3 md:items-center gap-2 md:gap-0 text-xs text-gray-500">

          {/* Left */}
          <div className="text-center md:text-left">
            © {new Date().getFullYear()} VenueConnect. All rights reserved.
          </div>

          {/* Center */}
          <div className="text-center">
            Dept. of AI & Data Science, PRPCEM Amravati
          </div>

          {/* Right */}
          <div className="flex items-center justify-center md:justify-end gap-4">
            <a
              href="mailto:support@venueconnect.com"
              className="hover:text-gold-light transition-colors"
            >
              support@venueconnect.com
            </a>

            <span className="text-white/20">|</span>

            <span>Since 2026</span>
          </div>

        </div>

      </div>
    </footer>
  );
}