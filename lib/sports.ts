// Hebrew labels for the "favorite sport" ids the public waitlist form stores (same labels as that site).
const SPORT_LABELS: Record<string, string> = {
  swimming: "שחייה",
  running: "ריצה",
  calisthenics: "קליסטניקס",
  strength: "אימוני כוח",
};

export function sportLabel(id: string | null): string {
  if (!id) return "—";
  return SPORT_LABELS[id] ?? id;
}
