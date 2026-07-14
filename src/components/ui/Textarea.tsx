import { TextareaHTMLAttributes, forwardRef, useId } from "react";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className = "", id, ...props }, ref) => {
    const autoId = useId();
    const areaId = id ?? autoId;
    return (
      <div className={className}>
        {label && (
          <label
            htmlFor={areaId}
            className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={areaId}
          aria-invalid={!!error}
          rows={props.rows ?? 3}
          className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-zinc-900 transition-shadow placeholder:text-zinc-400 focus:outline-2 focus:outline-offset-1 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 ${
            error
              ? "border-red-400 focus:outline-red-500 dark:border-red-500"
              : "border-zinc-300 focus:outline-brand-500 dark:border-zinc-600"
          }`}
          {...props}
        />
        {error ? (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
        ) : hint ? (
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{hint}</p>
        ) : null}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";
