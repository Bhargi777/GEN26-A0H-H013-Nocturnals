"use client";

// Local stand-in for Dev 2's toast. Swap once components/ui lands on main.
import { X } from "lucide-react";
import { useEffect, useState } from "react";

export function Toast({ message, durationMs = 6000 }: { message: string; durationMs?: number }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), durationMs);
    return () => clearTimeout(timer);
  }, [durationMs]);

  if (!visible) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-4 bottom-4 z-50 flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-900 shadow-sm sm:left-auto sm:right-4 sm:w-96"
    >
      <p className="flex-1">{message}</p>
      <button
        type="button"
        onClick={() => setVisible(false)}
        aria-label="Dismiss"
        className="rounded-md p-0.5 text-slate-600 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-teal-700"
      >
        <X size={16} aria-hidden />
      </button>
    </div>
  );
}
