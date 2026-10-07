// Hebrew labels for the "favorite sport" ids the public waitlist form stores (same labels as that site).
const SPORT_LABELS: Record<string, string> = {
  swimming: "שחייה",
  running: "ריצה",
  calisthenics: "קליסטניקס",
  strength: "אימוני כוח",
};

/** Label for a filter/summary key, where "none" means no favorite sport was chosen. */
export function sportFilterLabel(id: string): string {
  return id === "none" ? "ללא העדפה" : sportLabel(id);
}

export function sportLabel(id: string | null): string {
  if (!id) return "—";
  return SPORT_LABELS[id] ?? id;
}
