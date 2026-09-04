export default function AdminLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-5 w-20 rounded-full skeleton-shimmer" />
          <div className="h-7 w-32 rounded-lg skeleton-shimmer" />
        </div>
        <div className="h-8 w-28 rounded-lg skeleton-shimmer" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-surface p-5">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-3 w-20 rounded-lg skeleton-shimmer" />
                <div className="h-7 w-12 rounded-lg skeleton-shimmer" />
              </div>
              <div className="h-5 w-5 rounded skeleton-shimmer" />
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <div key={i} className="rounded-2xl border border-border bg-surface p-5 space-y-4">
            <div className="h-5 w-32 rounded-lg skeleton-shimmer" />
            <div className="space-y-3">
              {[1, 2, 3].map((j) => (
                <div key={j} className="flex items-center justify-between">
                  <div className="h-4 w-40 rounded-lg skeleton-shimmer" />
                  <div className="h-5 w-20 rounded-full skeleton-shimmer" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
