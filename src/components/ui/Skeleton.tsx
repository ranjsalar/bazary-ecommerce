/** Loading placeholders — shimmering blocks matching the card layouts. */
export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800 ${className}`} />
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
        >
          <Skeleton className="aspect-square rounded-none" />
          <div className="space-y-2 p-3">
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-56" />
      <ProductGridSkeleton />
    </div>
  );
}
