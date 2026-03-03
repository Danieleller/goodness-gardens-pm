export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`rounded-lg animate-pulse ${className}`}
      style={{ background: "var(--surface-2)" }}
    />
  );
}

export function BoardSkeleton() {
  return (
    <div className="flex flex-col h-full">
      {/* Snapshot skeleton */}
      <div className="grid grid-cols-4 gap-3 px-5 pt-4 pb-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[76px]" />
        ))}
      </div>

      {/* Toolbar skeleton */}
      <div className="flex items-center gap-3 px-5 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
        <Skeleton className="h-9 w-[400px]" />
        <Skeleton className="h-9 w-[120px]" />
      </div>

      {/* Columns skeleton */}
      <div className="flex gap-3 p-4 flex-1">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="min-w-[280px] max-w-[320px] flex flex-col gap-2">
            <Skeleton className="h-10 rounded-xl" />
            {Array.from({ length: 3 - i }).map((_, j) => (
              <Skeleton key={j} className="h-[90px] rounded-xl" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
