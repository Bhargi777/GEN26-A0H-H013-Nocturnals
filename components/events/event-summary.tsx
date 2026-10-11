"use client";

import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { getSupabase } from "@/lib/supabase/browser";
import { formatClock, formatDay } from "@/lib/time";
import type { EventRow } from "@/lib/types/campus";

/** One event request as a card. `children` holds the role's actions. */
export function EventSummary({ event, children }: { event: EventRow; children?: React.ReactNode }) {
  return <Card className="space-y-3">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0"><h2 className="break-words">{event.title}</h2><p className="text-secondary">{event.code} · {event.club?.name ?? "Club"} · {event.event_type}</p></div>
      <StatusBadge status={event.status} />
    </div>
    <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
      <div><dt className="text-secondary">When</dt><dd>{formatDay(event.event_date)}, {formatClock(event.start_time)}–{formatClock(event.end_time)}</dd></div>
      <div><dt className="text-secondary">Hall</dt><dd>{event.hall?.name ?? "Not set"}</dd></div>
      <div><dt className="text-secondary">Expected attendance</dt><dd>{event.expected_attendance}</dd></div>
      <div><dt className="text-secondary">Budget estimate</dt><dd>{event.budget_estimate ? `₹${Number(event.budget_estimate).toLocaleString("en-IN")}` : "None"}</dd></div>
      <div><dt className="text-secondary">Faculty coordinator</dt><dd>{event.faculty_coordinator}</dd></div>
      <div><dt className="text-secondary">Contact</dt><dd>{event.contact_phone}</dd></div>
    </dl>
    <p className="whitespace-pre-line break-words">{event.description}</p>
    {event.decision_note && <p role="note" className="rounded-control border border-status-amber-dark bg-status-amber-light p-3 text-status-amber-dark">Reviewer note: {event.decision_note}</p>}
    {children}
  </Card>;
}

/** Loads event requests and reloads them whenever any event_requests row changes. */
export function useEvents(load: () => Promise<EventRow[]>, channel: string) {
  const [events, setEvents] = useState<EventRow[]>();
  const [error, setError] = useState<string>();
  const reload = useCallback(async () => {
    try { setEvents(await load()); setError(undefined); }
    catch { setError("Event requests could not be loaded. Try again."); }
  }, [load]);
  useEffect(() => {
    const supabase = getSupabase();
    const first = setTimeout(() => void reload(), 0);
    const subscription = supabase.channel(channel)
      .on("postgres_changes", { event: "*", schema: "public", table: "event_requests" }, () => void reload())
      .subscribe();
    return () => { clearTimeout(first); void supabase.removeChannel(subscription); };
  }, [channel, reload]);
  return { events, error, reload };
}
