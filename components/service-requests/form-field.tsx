// Local stand-in for Dev 2's form components. Swap once components/ui lands on main.
import type { ReactNode } from "react";

export const inputClass =
  "block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-teal-700 aria-[invalid=true]:border-red-600 disabled:bg-slate-50";

export function Field({
  id,
  label,
  optional = false,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  optional?: boolean;
  hint?: ReactNode;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-sm font-medium text-slate-900">
        {label}
        {optional && <span className="ml-1 font-normal text-slate-600">(optional)</span>}
      </label>
      {children}
      {hint && <div className="text-sm text-slate-600">{hint}</div>}
      {error && (
        <p id={`${id}-error`} className="text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
