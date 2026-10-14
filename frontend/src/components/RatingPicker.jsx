import React, { useEffect, useState } from "react";
import api from "../api/axios.js";

/**
 * Generic rating-sortable picker used for Caterers, Photographers and Menus.
 *
 * props:
 *  - endpoint: "/catalog/caterers" | "/catalog/photographers" | "/catalog/menus"
 *  - selectedId, onSelect(item)
 *  - priceLabel(item) => string
 *  - subtitle(item) => string
 */
export default function RatingPicker({ endpoint, selectedId, onSelect, priceLabel, subtitle, allowNone = true }) {
  const [items, setItems] = useState([]);
  const [sort, setSort] = useState("rating");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get(endpoint, { params: { sort } }).then((res) => setItems(res.data)).finally(() => setLoading(false));
  }, [endpoint, sort]);

  return (
    <div>
      <style>{`
        .rating-picker-scroll {
          scrollbar-width: thin;
          scrollbar-color: #2f80ff transparent;
        }

        .rating-picker-scroll::-webkit-scrollbar {
          width: 3px;
          height: 0;
        }

        .rating-picker-scroll::-webkit-scrollbar-track {
          background: transparent;
        }

        .rating-picker-scroll::-webkit-scrollbar-thumb {
          background: #2f80ff;
          border-radius: 999px;
        }
      `}</style>

      <div className="flex items-center justify-between mb-3">
        <div className="flex gap-2 text-xs">
          <button
            type="button"
            onClick={() => setSort("rating")}
            className={`px-3 py-1 rounded-full font-semibold ${sort === "rating" ? "bg-plum text-white" : "bg-panel text-plum-dark"}`}
          >
            ★ Top Rated
          </button>

          <button
            type="button"
            onClick={() => setSort("price")}
            className={`px-3 py-1 rounded-full font-semibold ${sort === "price" ? "bg-plum text-white" : "bg-panel text-plum-dark"}`}
          >
            ₹ Lowest Price
          </button>
        </div>

        {allowNone && selectedId && (
          <button
            type="button"
            onClick={() => onSelect(null)}
            className="text-xs text-gray-400 hover:text-red-500"
          >
            Clear selection
          </button>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-gray-400 py-6 text-center">
          Loading options…
        </p>
      ) : (
        <div className="rating-picker-scroll grid sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1">
          {items.map((item) => {
            const active = selectedId === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelect(item)}
                className={`text-left rounded-xl border overflow-hidden transition-all ${
                  active ? "border-gold ring-2 ring-gold" : "border-gray-200 hover:border-gold-light"
                }`}
              >
                <div className="h-20 w-full overflow-hidden">
                  <img
                    src={item.image_url || "https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=900&q=80"}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="p-2.5">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-sm text-plum-dark truncate">
                      {item.name}
                    </p>

                    <span
                      className="text-xs font-bold shrink-0 ml-1"
                      style={{ color: "#d4af37" }}
                    >
                      {Number(item.rating_avg || 0) > 0 ? `★ ${Number(item.rating_avg).toFixed(1)}` : "New"}
                    </span>
                  </div>

                  <p className="text-xs text-gray-400 truncate">
                    {subtitle(item)}
                  </p>

                  <p className="text-xs font-semibold text-plum mt-0.5">
                    {priceLabel(item)}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
