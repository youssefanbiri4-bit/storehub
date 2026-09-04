export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="h-8 w-48 rounded-lg skeleton-shimmer" />
        <div className="h-4 w-72 rounded-lg skeleton-shimmer" />
        <div className="rounded-2xl border border-border bg-surface p-6 md:p-8 space-y-6">
          <div className="space-y-3">
            <div className="h-4 w-16 rounded-lg skeleton-shimmer" />
            <div className="h-10 w-full rounded-lg skeleton-shimmer" />
          </div>
          <div className="space-y-3">
            <div className="h-4 w-24 rounded-lg skeleton-shimmer" />
            <div className="h-10 w-full rounded-lg skeleton-shimmer" />
          </div>
          <div className="space-y-3">
            <div className="h-4 w-20 rounded-lg skeleton-shimmer" />
            <div className="h-10 w-full rounded-lg skeleton-shimmer" />
          </div>
          <div className="space-y-3">
            <div className="h-4 w-16 rounded-lg skeleton-shimmer" />
            <div className="h-24 w-full rounded-lg skeleton-shimmer" />
          </div>
          <div className="h-10 w-full rounded-lg skeleton-shimmer" />
        </div>
      </div>
    </div>
  );
}
