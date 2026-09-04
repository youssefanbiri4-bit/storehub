export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="h-8 w-48 rounded-lg skeleton-shimmer" />
        <div className="h-4 w-72 rounded-lg skeleton-shimmer" />
        <div className="space-y-10">
          {[1, 2, 3].map((cat) => (
            <div key={cat} className="space-y-4">
              <div className="h-6 w-40 rounded-lg skeleton-shimmer" />
              <div className="space-y-4">
                {[1, 2, 3].map((q) => (
                  <div key={q} className="rounded-2xl border border-border bg-surface p-5 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="h-5 w-5 rounded-lg skeleton-shimmer shrink-0 mt-0.5" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-3/4 rounded-lg skeleton-shimmer" />
                        <div className="h-3 w-full rounded-lg skeleton-shimmer" />
                        <div className="h-3 w-2/3 rounded-lg skeleton-shimmer" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
