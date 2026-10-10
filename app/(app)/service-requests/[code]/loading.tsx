export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl space-y-6" aria-busy="true" aria-label="Loading the ticket">
      <div className="space-y-2 border-b border-slate-200 pb-4">
        <div className="h-6 w-80 max-w-full animate-pulse rounded-md bg-slate-200" />
        <div className="h-4 w-56 animate-pulse rounded-md bg-slate-100" />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="h-72 animate-pulse rounded-lg border border-slate-200 bg-white lg:col-span-2" />
        <div className="h-72 animate-pulse rounded-lg border border-slate-200 bg-white" />
      </div>
    </div>
  );
}
