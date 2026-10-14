// Single source of truth for "what venue categories suit this event" —
// imported by both the Home hero search bar and the Venues page so the
// two stay perfectly in sync.

export const CATEGORIES = [
  "",
  "Banquet Hall",
  "Outdoor Lawn",
  "Corporate Space",
  "Community Hall",
  "Resort",
];

export const EVENT_TYPES = [
  { value: "Wedding", icon: "💍", categories: ["Banquet Hall", "Resort", "Outdoor Lawn"] },
  { value: "Engagement", icon: "💐", categories: ["Banquet Hall", "Outdoor Lawn"] },
  { value: "Birthday", icon: "🎂", categories: ["Community Hall", "Outdoor Lawn", "Resort"] },
  { value: "Anniversary", icon: "🥂", categories: ["Resort", "Banquet Hall"] },
  { value: "Corporate Event", icon: "💼", categories: ["Corporate Space"] },
  { value: "Reception / Party", icon: "🎉", categories: ["Banquet Hall", "Outdoor Lawn", "Resort"] },
];

export function categoriesForEvent(eventValue) {
  const match = EVENT_TYPES.find((t) => t.value === eventValue);
  return match ? match.categories : [];
}
