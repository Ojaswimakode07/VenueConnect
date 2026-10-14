import React from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { isProfessional } from "../utils/roles.js";
import OwnerDashboard from "./OwnerDashboard.jsx";
import VendorProfileDashboard from "./VendorProfileDashboard.jsx";

// Entry point for /vendor/dashboard. Venue owners (vendor_type === "venue")
// and standalone PROFESSIONALS get completely separate UIs — see
// OwnerDashboard.jsx and VendorProfileDashboard.jsx.
//
// The check goes through isProfessional() rather than a bare
// `vendor_type !== "venue"` test: only the four real service types
// (photographer / catering / music / decor) have a professional profile in
// the backend, so any other value must fall back to the owner dashboard
// instead of loading a professional dashboard whose API calls would 403.
export default function VendorDashboard() {
  const { user } = useAuth();
  return isProfessional(user) ? <VendorProfileDashboard /> : <OwnerDashboard />;
}
