/** Circle with the first letter of a name or email (no external images). */
export default function Avatar({
  name,
  size = "md",
}: {
  name: string | null;
  size?: "md" | "lg";
}) {
  const letter = (name ?? "?").trim().charAt(0).toUpperCase() || "?";
  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-full border border-border-emphasis bg-surface-raised font-heading font-extrabold text-ember ${
        size === "lg" ? "size-11 text-headline-sm" : "size-9 text-body-md"
      }`}
    >
      <span dir="ltr">{letter}</span>
    </span>
  );
}
