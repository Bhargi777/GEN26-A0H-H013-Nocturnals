export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl space-y-6" aria-busy="true" aria-label="Loading tickets">
      <div className="space-y-2 border-b border-slate-200 pb-4">
        <div className="h-6 w-56 animate-pulse rounded-md bg-slate-200" />
        <div className="h-4 w-80 max-w-full animate-pulse rounded-md bg-slate-100" />
      </div>
      <div className="flex gap-3">
        <div className="h-9 w-48 animate-pulse rounded-md bg-slate-100" />
        <div className="h-9 w-48 animate-pulse rounded-md bg-slate-100" />
      </div>
      <div className="space-y-px overflow-hidden rounded-lg border border-slate-200 bg-white">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="h-11 animate-pulse bg-slate-50" />
        ))}
      </div>
    </div>
  );
}
