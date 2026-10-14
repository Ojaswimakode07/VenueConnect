import React from "react";

const TIERS = [
  { window: "30+ days before the event", refund: "100% refund", color: "bg-green-100 text-green-700" },
  { window: "15 – 29 days before", refund: "50% refund", color: "bg-yellow-100 text-yellow-700" },
  { window: "7 – 14 days before", refund: "25% refund", color: "bg-orange-100 text-orange-700" },
  { window: "Less than 7 days before", refund: "No refund", color: "bg-red-100 text-red-700" },
];

export default function RefundPolicy({ compact = false }) {
  return (
    <div className={compact ? "" : "card p-4"}>
      {!compact && <h4 className="font-serif font-bold text-plum-dark mb-2 text-sm">Cancellation & Refund Policy</h4>}
      <p className="text-xs text-gray-500 mb-3">
        Refunds are calculated as a percentage of your <strong>30% advance payment</strong>, based on how far ahead of the event you cancel.
      </p>
      <div className="space-y-1.5">
        {TIERS.map((t) => (
          <div key={t.window} className="flex items-center justify-between text-xs">
            <span className="text-gray-600">{t.window}</span>
            <span className={`font-semibold px-2 py-0.5 rounded-full ${t.color}`}>{t.refund}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
