"use client";

import { useId, useState } from "react";
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

const CONTROL =
  "w-full rounded-xl border border-border-emphasis bg-well px-4 text-body-lg text-text-primary placeholder:text-text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember disabled:opacity-60";

/**
 * A label above a form control. `hint` is a short line that is always visible underneath; `help` is the longer
 * explanation, opened with the small "?" next to the label (what the field means and how to fill it in).
 */
export function Field({
  label,
  hint,
  help,
  htmlFor,
  children,
  className = "",
}: {
  label: string;
  hint?: ReactNode;
  help?: ReactNode;
  htmlFor?: string;
  children: ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const helpId = useId();
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <div className="flex items-center gap-2">
        <label htmlFor={htmlFor} className="text-body-md font-semibold">
          {label}
        </label>
        {help && (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls={helpId}
            aria-label={`הסבר על ״${label}״`}
            className={`flex size-5 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold leading-none transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember ${
              open ? "border-info bg-info text-canvas" : "border-border-emphasis text-text-secondary hover:border-info hover:text-info"
            }`}
          >
            ?
          </button>
        )}
      </div>
      {help && open && (
        <p id={helpId} className="animate-rise rounded-xl border border-info/30 bg-info/10 px-3 py-2.5 text-body-md leading-6 text-text-primary">
          {help}
        </p>
      )}
      {children}
      {hint && <p className="text-body-sm text-text-muted">{hint}</p>}
    </div>
  );
}

export function TextInput({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`h-11 ${CONTROL} ${className}`} {...props} />;
}

/** A number box. Values are kept as text so an empty box stays empty. */
export function NumberInput({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type="number"
      inputMode="decimal"
      dir="ltr"
      className={`h-11 text-start ${CONTROL} ${className}`}
      {...props}
    />
  );
}

export function TextArea({ className = "", ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`min-h-24 py-3 ${CONTROL} ${className}`} {...props} />;
}

export function Select({ className = "", ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={`h-11 ${CONTROL} ${className}`} {...props} />;
}
