export function Spinner({ className = "" }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={`inline-block size-6 animate-spin rounded-full border-2 border-brand-600 border-t-transparent ${className}`}
    />
  );
}

export function PageSpinner() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <Spinner className="size-8" />
    </div>
  );
}
