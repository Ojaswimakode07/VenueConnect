const FLAGSHIP_PREVIEWS = new Map([
  ["grand mehfil", "grand_mehfil"],
  ["rangoli lawns", "rangoli_lawn"],
]);

export function getFlagshipPreviewVariant(venue) {
  if ((venue?.city || "").trim().toLowerCase() !== "amravati") return null;
  return FLAGSHIP_PREVIEWS.get((venue?.name || "").trim().toLowerCase()) || null;
}

export function hasFlagshipPreview(venue) {
  return Boolean(getFlagshipPreviewVariant(venue));
}
