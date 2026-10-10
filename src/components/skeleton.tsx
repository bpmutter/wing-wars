export function PageSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10" aria-busy="true">
      <p className="mb-6 animate-pulse text-ink-soft">🍃 The spirits are gathering…</p>
      <div className="mb-8 h-12 w-2/3 animate-pulse rounded-2xl bg-paper-2" />
      <div className="grid gap-4">
        <div className="card h-40 animate-pulse" />
        <div className="card h-40 animate-pulse" />
        <div className="card h-40 animate-pulse" />
      </div>
    </div>
  );
}
