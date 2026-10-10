export function Skeleton({ rows = 3, label = "Loading items" }: { rows?: number; label?: string }) {
  return <div role="status" aria-busy="true" className="space-y-3 rounded-card border bg-surface p-4">
    <span className="sr-only">{label}</span>
    {Array.from({ length: Math.min(20, Math.max(1, Math.floor(rows) || 3)) }, (_, index) => <div key={index} aria-hidden="true" className="h-10 rounded-control bg-border" />)}
  </div>;
}
