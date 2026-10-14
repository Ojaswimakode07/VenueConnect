import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "../api/axios.js";

const SERVICE_TYPES = [
  { value: "", label: "All", icon: "✨" },
  { value: "photographer", label: "Photographer", icon: "📷" },
  { value: "decor", label: "Decoration", icon: "🎨" },
  { value: "music", label: "Music", icon: "🎵" },
  { value: "catering", label: "Catering", icon: "🍽️" },
];

export default function Services() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [serviceType, setServiceType] = useState(searchParams.get("service_type") || "");
  const [city, setCity] = useState(searchParams.get("city") || "");
  const [eventDate, setEventDate] = useState(searchParams.get("event_date") || "");
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  async function runSearch(params) {
    setLoading(true);
    try {
      const apiParams = {};
      if (params.service_type) apiParams.service_type = params.service_type;
      if (params.city) apiParams.city = params.city;
      if (params.event_date) apiParams.event_date = params.event_date;
      const res = await api.get("/catalog/vendor-services", { params: apiParams });
      setServices(res.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    runSearch(Object.fromEntries(searchParams.entries()));
  }, []); // eslint-disable-line

  function handleSearch(e) {
    e.preventDefault();
    const params = {};
    if (serviceType) params.service_type = serviceType;
    if (city) params.city = city;
    if (eventDate) params.event_date = eventDate;
    setSearchParams(params);
    runSearch(params);
  }

  return (
    <div className="max-w-6xl mx-auto px-5 py-10">
      <h1 className="font-serif text-3xl font-bold text-plum-dark mb-1">Find Service Providers</h1>
      <p className="text-gray-500 mb-8">
        Browse independent photographers, decorators, musicians and caterers, and check who's free on your date.
      </p>

      <form onSubmit={handleSearch} className="card p-5 mb-10">
        <label className="text-xs font-semibold text-gray-500 block mb-2">Service Type</label>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-4">
          {SERVICE_TYPES.map((t) => (
            <button
              type="button"
              key={t.value}
              onClick={() => setServiceType(t.value)}
              className={`py-2.5 rounded-xl text-xs font-semibold border flex flex-col items-center gap-1 transition-colors ${
                serviceType === t.value ? "bg-plum text-white border-plum" : "border-gray-200 text-plum-dark hover:border-plum"
              }`}
            >
              <span className="text-lg">{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>
        <div className="grid sm:grid-cols-3 gap-3 items-end">
          <div>
            <label className="text-xs font-semibold text-gray-500">City</label>
            <input className="input" placeholder="e.g. Amravati" value={city} onChange={(e) => setCity(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500">Event Date</label>
            <input type="date" className="input" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
          </div>
          <button type="submit" className="btn-primary">Search</button>
        </div>
      </form>

      {loading ? (
        <p className="text-center text-gray-400 py-20">Loading service providers…</p>
      ) : services.length === 0 ? (
        <p className="text-center text-gray-400 py-20">No service providers match your search. Try widening it.</p>
      ) : (
        <>
          <p className="text-sm text-gray-500 mb-4">{services.length} provider{services.length !== 1 ? "s" : ""} found</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((s) => (
              <div
                key={s.id}
                onClick={() => navigate(`/professionals/${s.id}`)}
                data-testid={`professional-card-${s.id}`}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && navigate(`/professionals/${s.id}`)}
                className="card p-5 flex flex-col cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-cardHover"
              >
                <div className="flex items-start justify-between gap-3 mb-1">
                  <span className="text-2xl">{SERVICE_TYPES.find((t) => t.value === s.service_type)?.icon || "✨"}</span>
                  <span
                    className={`text-[11px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full whitespace-nowrap ${
                      s.is_available ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
                    }`}
                  >
                    {s.is_available ? "Available" : "Unavailable"}
                  </span>
                </div>
                <h3 className="font-serif font-bold text-lg text-plum-dark leading-tight">{s.name}</h3>
                <p className="text-xs text-gray-500 mb-1">by {s.provider_name}{s.city ? ` · ${s.city}` : ""}</p>
                {s.tagline && <p className="text-sm text-plum-light italic mb-1">“{s.tagline}”</p>}
                <p className="text-sm text-gray-500 line-clamp-3 flex-1 mt-1">{s.description}</p>

                <div className="flex items-center gap-3 mt-3 text-sm">
                  {s.rating_count > 0 && (
                    <span className="font-semibold text-gold">★ {Number(s.rating_avg).toFixed(1)}</span>
                  )}
                  {s.price_from > 0 && (
                    <span className="text-plum-dark font-semibold">
                      from ₹{Number(s.price_from).toLocaleString("en-IN")}
                    </span>
                  )}
                  <span className="ml-auto text-xs font-semibold text-plum">View profile →</span>
                </div>

                {(s.unavailable_ranges || []).length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-[11px] font-semibold text-gray-400 mb-1.5">Booked on:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {s.unavailable_ranges.map((r) => (
                        <span key={r.id} className="text-[11px] bg-panel px-2 py-1 rounded-full text-plum-dark">
                          {r.start_date} → {r.end_date}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
