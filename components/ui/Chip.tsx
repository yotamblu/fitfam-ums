import type { ReactNode } from "react";

type Tone = "neutral" | "ember" | "volt" | "info";

const TONES: Record<Tone, string> = {
  neutral: "border-border bg-surface-raised text-text-secondary",
  ember: "border-ember/40 bg-ember/10 text-ember",
  volt: "border-volt/40 bg-volt/10 text-volt",
  info: "border-info/40 bg-info/10 text-info",
};

/** Small read-only label. */
export default function Chip({
  tone = "neutral",
  children,
  className = "",
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border px-2.5 py-1 text-label-md font-semibold ${TONES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
