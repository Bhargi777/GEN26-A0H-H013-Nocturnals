import type { ButtonHTMLAttributes } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md";

export function buttonStyles(variant: ButtonVariant = "primary", size: ButtonSize = "md") {
  const variants = {
    primary: "border-accent bg-accent text-surface hover:border-accent-hover hover:bg-accent-hover",
    secondary: "border-secondary bg-surface text-primary hover:bg-background",
    ghost: "border-transparent bg-transparent text-accent hover:bg-accent-light",
    danger: "border-status-red-dark bg-status-red-dark text-surface hover:underline",
  };
  return `inline-flex shrink-0 items-center justify-center gap-2 rounded-control border font-medium disabled:opacity-60 ${variants[variant]} ${size === "sm" ? "min-h-8 px-3 py-1" : "min-h-11 px-4 py-2"}`;
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

export function Button({ variant, size, loading = false, disabled, className = "", children, type = "button", ...props }: ButtonProps) {
  return (
    <button {...props} type={type} disabled={disabled || loading} aria-busy={loading || undefined} className={`${buttonStyles(variant, size)} ${className}`}>
      {loading && <span aria-hidden="true">Working…</span>}
      {children}
    </button>
  );
}
