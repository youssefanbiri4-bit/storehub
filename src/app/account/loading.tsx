export default function AccountLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-6 w-32 rounded-lg bg-muted" />
      <div className="h-4 w-48 rounded bg-muted" />
      <div className="rounded-xl border border-border bg-surface p-6 space-y-3">
        <div className="h-4 w-3/4 rounded bg-muted" />
        <div className="h-4 w-1/2 rounded bg-muted" />
        <div className="h-10 w-full rounded-lg bg-muted mt-4" />
      </div>
    </div>
  );
}
