import React, { useEffect, useMemo, useState } from "react";
import api from "../api/axios.js";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function toDateStr(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export default function Calendar({ venueId, selectedDate, onSelect }) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [unavailable, setUnavailable] = useState([]);

  useEffect(() => {
    if (!venueId) return;
    api
      .get(`/venues/${venueId}/availability`, { params: { month: viewMonth + 1, year: viewYear } })
      .then((res) => setUnavailable(res.data.unavailable_dates))
      .catch(() => setUnavailable([]));
  }, [venueId, viewMonth, viewYear]);

  const daysInMonth = useMemo(
    () => new Date(viewYear, viewMonth + 1, 0).getDate(),
    [viewYear, viewMonth]
  );
  const firstWeekday = useMemo(
    () => new Date(viewYear, viewMonth, 1).getDay(),
    [viewYear, viewMonth]
  );

  function prevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  }
  function nextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  }

  const todayStr = toDateStr(today.getFullYear(), today.getMonth(), today.getDate());
  const cells = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <button onClick={prevMonth} className="w-8 h-8 rounded-full hover:bg-panel text-plum font-bold">‹</button>
        <span className="font-semibold text-plum-dark">{MONTH_NAMES[viewMonth]} {viewYear}</span>
        <button onClick={nextMonth} className="w-8 h-8 rounded-full hover:bg-panel text-plum font-bold">›</button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-400 mb-1">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, idx) => {
          if (d === null) return <div key={idx} />;
          const dateStr = toDateStr(viewYear, viewMonth, d);
          const isPast = dateStr < todayStr;
          const isBlocked = unavailable.includes(dateStr);
          const isSelected = selectedDate === dateStr;
          const disabled = isPast || isBlocked;
          return (
            <button
              key={idx}
              disabled={disabled}
              onClick={() => onSelect(dateStr)}
              className={[
                "aspect-square rounded-lg text-sm font-medium transition-colors",
                disabled ? "text-gray-300 line-through cursor-not-allowed" : "hover:bg-panel text-gray-700",
                isSelected ? "!bg-plum !text-white" : "",
              ].join(" ")}
            >
              {d}
            </button>
          );
        })}
      </div>
      <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-plum inline-block" /> Selected</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-gray-200 inline-block" /> Unavailable</span>
      </div>
    </div>
  );
}
