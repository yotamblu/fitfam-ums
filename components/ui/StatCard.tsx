type Tone = "default" | "ember" | "volt" | "info";

const NUMERAL: Record<Tone, string> = {
  default: "text-text-primary",
  ember: "text-ember",
  volt: "text-volt",
  info: "text-info",
};

/** Bordered card: label on top, big numeral, optional caption. */
export default function StatCard({
  label,
  value,
  caption,
  tone = "default",
}: {
  label: string;
  value: number | string;
  caption?: string;
  tone?: Tone;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-border bg-surface p-4">
      <span className="text-label-md text-text-secondary">{label}</span>
      <span
        dir="ltr"
        className={`font-heading text-metric-md font-extrabold tabular-nums text-start ${NUMERAL[tone]}`}
      >
        {value}
      </span>
      {caption && <span className="text-body-sm text-text-muted">{caption}</span>}
    </div>
  );
}
