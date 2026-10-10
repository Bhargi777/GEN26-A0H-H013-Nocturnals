export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl space-y-6" aria-busy="true" aria-label="Loading the queue">
      <div className="space-y-2 border-b border-slate-200 pb-4">
        <div className="h-6 w-48 animate-pulse rounded-md bg-slate-200" />
        <div className="h-4 w-96 max-w-full animate-pulse rounded-md bg-slate-100" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        {Array.from({ length: 5 }, (_, index) => (
          <div key={index} className="h-9 animate-pulse rounded-md bg-slate-100" />
        ))}
      </div>
      <div className="space-y-px overflow-hidden rounded-lg border border-slate-200 bg-white">
        {Array.from({ length: 8 }, (_, index) => (
          <div key={index} className="h-11 animate-pulse bg-slate-50" />
        ))}
      </div>
    </div>
  );
}
