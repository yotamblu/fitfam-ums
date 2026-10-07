import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-ember text-canvas shadow-glow-ember hover:brightness-110",
  secondary:
    "border border-border-emphasis bg-surface-raised text-text-primary hover:bg-surface-high",
  ghost: "text-text-secondary hover:bg-surface-raised hover:text-text-primary",
};

const SIZES: Record<Size, string> = {
  sm: "h-9 px-4 text-body-md",
  md: "h-11 px-5 text-body-md",
  lg: "h-12 px-6 text-body-lg",
};

/** Class names for a FitFam button; use on <Link> for navigation buttons. */
export function buttonClasses({
  variant = "primary",
  size = "md",
  fullWidth = false,
}: {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
} = {}): string {
  return [
    "inline-flex items-center justify-center gap-2 rounded-full font-heading font-bold transition",
    "active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember",
    VARIANTS[variant],
    SIZES[size],
    fullWidth ? "w-full" : "",
  ].join(" ");
}

export default function Button({
  variant,
  size,
  fullWidth,
  className = "",
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
}) {
  return (
    <button
      type={type}
      className={`${buttonClasses({ variant, size, fullWidth })} ${className}`}
      {...props}
    />
  );
}
