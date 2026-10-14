// Central place to derive a user's "kind" so nav + routes stay consistent.
// Backend roles: "customer" or "vendor". A vendor is either a venue OWNER
// (vendor_type "venue"/empty) or a standalone PROFESSIONAL (service type).
const SERVICE_TYPES = ["photographer", "catering", "decor", "music"];

export function getUserKind(user) {
  if (!user) return "guest";
  if (user.role === "customer") return "customer";
  if (user.role === "vendor") {
    return SERVICE_TYPES.includes(user.vendor_type) ? "professional" : "owner";
  }
  return "guest";
}

export const isProfessional = (user) => getUserKind(user) === "professional";
export const isOwner = (user) => getUserKind(user) === "owner";
