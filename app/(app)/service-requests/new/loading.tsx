export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl space-y-6" aria-busy="true" aria-label="Loading the report form">
      <div className="space-y-2 border-b border-slate-200 pb-4">
        <div className="h-6 w-40 animate-pulse rounded-md bg-slate-200" />
        <div className="h-4 w-72 max-w-full animate-pulse rounded-md bg-slate-100" />
      </div>
      <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-4 sm:p-6">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="h-9 animate-pulse rounded-md bg-slate-100" />
        ))}
      </div>
    </div>
  );
}
