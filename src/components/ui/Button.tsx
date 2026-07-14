import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "outline" | "danger" | "ghost";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary:
    "bg-brand-600 text-white shadow-sm hover:bg-brand-700 active:bg-brand-800 focus-visible:outline-brand-600 disabled:bg-brand-300 dark:disabled:bg-brand-900 dark:disabled:text-zinc-500",
  secondary:
    "bg-zinc-900 text-white shadow-sm hover:bg-zinc-700 active:bg-zinc-800 focus-visible:outline-zinc-900 disabled:bg-zinc-400 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300 dark:disabled:bg-zinc-600",
  outline:
    "border border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-50 active:bg-zinc-100 focus-visible:outline-zinc-400 disabled:text-zinc-400 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800 dark:disabled:text-zinc-600",
  danger:
    "bg-red-600 text-white shadow-sm hover:bg-red-700 active:bg-red-800 focus-visible:outline-red-600 disabled:bg-red-300 dark:disabled:bg-red-900",
  ghost:
    "text-zinc-700 hover:bg-zinc-100 active:bg-zinc-200 focus-visible:outline-zinc-400 disabled:text-zinc-400 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:disabled:text-zinc-600",
};

const sizes: Record<Size, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", loading, className = "", children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.98] disabled:cursor-not-allowed disabled:active:scale-100 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading && (
        <span
          aria-hidden
          className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      )}
      {children}
    </button>
  )
);
Button.displayName = "Button";
