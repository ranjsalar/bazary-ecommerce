import { SelectHTMLAttributes, forwardRef, useId } from "react";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, hint, className = "", id, children, ...props }, ref) => {
    const autoId = useId();
    const selectId = id ?? autoId;
    return (
      <div className={className}>
        {label && (
          <label
            htmlFor={selectId}
            className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          aria-invalid={!!error}
          className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-zinc-900 transition-shadow focus:outline-2 focus:outline-offset-1 dark:bg-zinc-900 dark:text-zinc-100 ${
            error
              ? "border-red-400 focus:outline-red-500 dark:border-red-500"
              : "border-zinc-300 focus:outline-brand-500 dark:border-zinc-600"
          }`}
          {...props}
        >
          {children}
        </select>
        {error ? (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
        ) : hint ? (
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{hint}</p>
        ) : null}
      </div>
    );
  }
);
Select.displayName = "Select";
