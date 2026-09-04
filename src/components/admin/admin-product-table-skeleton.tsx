export function AdminProductTableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-5 w-20 rounded-full skeleton-shimmer" />
          <div className="h-7 w-32 rounded-lg skeleton-shimmer" />
        </div>
        <div className="h-8 w-28 rounded-lg skeleton-shimmer" />
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="h-10 flex-1 rounded-lg skeleton-shimmer" />
        <div className="h-10 w-40 rounded-lg skeleton-shimmer" />
        <div className="h-10 w-40 rounded-lg skeleton-shimmer" />
      </div>

      <div className="rounded-2xl border border-border bg-surface overflow-hidden">
        <div className="p-3">
          <div className="flex items-center gap-2 px-3 py-2">
            <div className="h-4 w-4 rounded skeleton-shimmer" />
            <div className="h-4 w-20 rounded skeleton-shimmer" />
          </div>
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-6 py-3 border-t border-border">
            <div className="h-4 w-4 rounded skeleton-shimmer" />
            <div className="h-10 w-10 rounded-lg skeleton-shimmer" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-40 rounded skeleton-shimmer" />
              <div className="h-3 w-24 rounded skeleton-shimmer" />
            </div>
            <div className="h-5 w-24 rounded-full skeleton-shimmer hidden sm:block" />
            <div className="h-5 w-16 rounded-full skeleton-shimmer hidden md:block" />
            <div className="h-4 w-16 rounded skeleton-shimmer hidden lg:block" />
            <div className="h-4 w-20 rounded skeleton-shimmer hidden lg:block" />
            <div className="h-8 w-8 rounded-lg skeleton-shimmer" />
          </div>
        ))}
      </div>
    </div>
  );
}
