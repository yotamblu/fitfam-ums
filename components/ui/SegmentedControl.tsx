export type SegmentOption<T extends string> = {
  value: T;
  label: string;
  count?: number;
};

/** Rounded track of buttons; the selected one is a filled pill. Used for filters. */
export default function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
}) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className="inline-flex flex-wrap gap-1 rounded-full border border-border bg-well p-1"
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(option.value)}
            className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-body-md font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember ${
              selected
                ? "bg-surface-high text-text-primary shadow-header"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            {option.label}
            {option.count !== undefined && (
              <span
                dir="ltr"
                className={`text-label-md tabular-nums ${selected ? "text-ember" : "text-text-muted"}`}
              >
                {option.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
