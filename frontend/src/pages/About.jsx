import React from "react";

const OBJECTIVES = [
  "Unified venue search & comparison by location, date, capacity and price.",
  "Real-time availability calendar preventing duplicate bookings.",
  "Interactive 3D preview of decoration themes before booking.",
  "Optional add-on services — catering, DJ, lighting, photography.",
  "Secure online payments with automatic invoice generation.",
  "Vendor dashboard for listings, pricing, packages and earnings.",
];

const STACK = [
  ["Frontend", "React.js + Tailwind CSS"],
  ["Backend / API", "FastAPI (Python)"],
  ["Database", "PostgreSQL"],
  ["3D Visualization", "Three.js + React Three Fiber"],
  ["Payments", "Razorpay (Test Mode)"],
  ["Scheduling", "Custom real-time availability engine"],
];

export default function About() {
  return (
    <div className="max-w-5xl mx-auto px-5 py-16">
      <p className="text-gold font-bold text-xs uppercase tracking-wider mb-2">About the Project</p>
      <h1 className="font-serif text-4xl font-bold text-plum-dark mb-4">VenueConnect</h1>
      <p className="text-gray-600 leading-relaxed mb-10 max-w-3xl">
        VenueConnect unifies venue discovery, real-time availability checking, add-on service
        selection, online payment, and — as a key differentiator — an interactive 3D preview of
        decoration themes before booking is confirmed. It was designed to remove the guesswork
        from event planning for customers, and the manual overhead of managing bookings for
        venue owners.
      </p>

      <h2 className="font-serif text-2xl font-bold text-plum-dark mb-4">Objectives</h2>
      <ul className="grid sm:grid-cols-2 gap-3 mb-12">
        {OBJECTIVES.map((o) => (
          <li key={o} className="card p-4 text-sm text-gray-600">{o}</li>
        ))}
      </ul>

      <h2 className="font-serif text-2xl font-bold text-plum-dark mb-4">Technology Stack</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-12">
        {STACK.map(([label, value]) => (
          <div key={label} className="card p-4">
            <p className="text-xs text-gray-400 uppercase font-semibold">{label}</p>
            <p className="font-semibold text-plum-dark">{value}</p>
          </div>
        ))}
      </div>

      <div className="card p-6 bg-plum-dark text-white">
        <h3 className="font-serif text-xl font-bold mb-2">Department of Artificial Intelligence & Data Science</h3>
        <p className="text-gray-300 text-sm">
          P. R. Pote Patil College of Engineering & Management, Amravati — Session 2026–2027
        </p>
      </div>
    </div>
  );
}
