"use client";

import { useState } from "react";
import type { AuditEvent } from "@/app/(app)/ui/preview-contract";
import { StatusBadge } from "./badge";

export function relativeTime(date: string, now: number) {
  const timestamp = Date.parse(date);
  if (!Number.isFinite(timestamp)) return "Date unavailable";
  const seconds = Math.round((timestamp - now) / 1000);
  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  if (Math.abs(seconds) < 60) return formatter.format(seconds, "second");
  if (Math.abs(seconds) < 3600) return formatter.format(Math.round(seconds / 60), "minute");
  if (Math.abs(seconds) < 86400) return formatter.format(Math.round(seconds / 3600), "hour");
  return formatter.format(Math.round(seconds / 86400), "day");
}

export function Timeline({ events, now }: { events: AuditEvent[]; now?: number }) {
  const [mountedAt] = useState(() => Date.now());
  const clock = now ?? mountedAt;
  if (!events.length) return <p className="text-secondary">No activity has been recorded.</p>;
  return <ol aria-label="Status history" className="space-y-4 border-l pl-4">
    {[...events].sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at)).map((event) => <li key={event.id} className="space-y-2">
      <p><span className="font-medium">{event.actor_name ?? event.actor_id}</span> · {event.action}</p>
      {(event.from_status || event.to_status) && <div className="flex flex-wrap items-center gap-2">
        {event.from_status && <StatusBadge status={event.from_status} />}
        {event.from_status && event.to_status && <span aria-label="changed to">→</span>}
        {event.to_status && <StatusBadge status={event.to_status} />}
      </div>}
      {event.note && <p className="whitespace-pre-wrap break-words text-secondary">{event.note}</p>}
      <time dateTime={event.created_at} title={event.created_at} className="text-secondary">{relativeTime(event.created_at, clock)}</time>
    </li>)}
  </ol>;
}
