import { ReactNode } from "react";

type Kind = "error" | "success" | "warning" | "info";

const styles: Record<Kind, string> = {
  error: "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400",
  success: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
  warning: "bg-amber-50 text-amber-800 dark:bg-amber-500/10 dark:text-amber-400",
  info: "bg-brand-50 text-brand-900 dark:bg-brand-500/10 dark:text-brand-300",
};

/** Inline message box used for form-level errors and success notices. */
export function Alert({
  kind = "info",
  children,
  className = "",
}: {
  kind?: Kind;
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      role={kind === "error" ? "alert" : undefined}
      className={`rounded-lg px-3 py-2 text-sm ${styles[kind]} ${className}`}
    >
      {children}
    </p>
  );
}
