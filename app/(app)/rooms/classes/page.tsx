"use client";

import { useCallback, useEffect, useState } from "react";
import { RoleGate } from "@/components/layout/role-gate";
import { useFrontend } from "@/components/layout/frontend-provider";
import { Badge, Button, Card, EmptyState, FieldError, FormField, Input, PageHeader, Skeleton, useToast } from "@/components/ui";
import { ROLES } from "@/lib/constants/roles";
import { cancelClass, listCancellations, listMyClasses, type ClassEntry } from "@/lib/db/rooms";
import { formatClock, formatDay, istDate } from "@/lib/time";

const WEEKDAY = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function MyClassesPage() {
  return <RoleGate roles={[ROLES.FACULTY]}><Classes /></RoleGate>;
}

/** The next dates (today to 14 days ahead) on which a weekly class meets. */
function upcoming(weekday: number): string[] {
  const dates: string[] = [];
  for (let offset = 0; offset <= 14; offset += 1) {
    const date = istDate(offset);
    if (new Date(`${date}T00:00:00Z`).getUTCDay() === weekday) dates.push(date);
  }
  return dates;
}

function Classes() {
  const { profile } = useFrontend();
  const toast = useToast();
  const name = profile?.full_name ?? "";
  const [entries, setEntries] = useState<ClassEntry[]>();
  const [cancelled, setCancelled] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string>();
  const [asking, setAsking] = useState<{ entry: ClassEntry; date: string }>();
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!name) return;
    try {
      const rows = await listMyClasses(name);
      const cancellations = await listCancellations(rows.map((row) => row.id));
      setEntries(rows); setCancelled(new Set(cancellations.map((row) => `${row.timetable_entry_id}|${row.date}`))); setError(undefined);
    } catch { setError("Your classes could not be loaded. Try again."); }
  }, [name]);
  useEffect(() => { const first = setTimeout(() => void load(), 0); return () => clearTimeout(first); }, [load]);

  async function confirm() {
    if (!asking || busy) return;
    setBusy(true); setError(undefined);
    try {
      await cancelClass(asking.entry.id, asking.date, reason.trim());
      toast({ message: `${asking.entry.course} on ${formatDay(asking.date)} cancelled. The room is free for booking.` });
      setAsking(undefined); setReason("");
      await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "The class could not be cancelled. Try again."); }
    finally { setBusy(false); }
  }

  if (error && !entries) return <EmptyState message={error} action={<Button onClick={() => void load()}>Try again</Button>} />;
  if (!entries) return <Skeleton label="Loading your classes" />;

  return <div className="space-y-6">
    <PageHeader title="My classes" context="Cancel a class for one date and the room becomes free for others to book. Your class representative is told." />
    <div aria-live="polite"><FieldError>{error}</FieldError></div>
    {asking && <Card className="max-w-xl space-y-3" role="group" aria-label="Cancel class">
      <h2>Cancel {asking.entry.course} on {formatDay(asking.date)}?</h2>
      <FormField label="Reason (optional)">{(control) => <Input {...control} autoFocus maxLength={200} value={reason} onChange={(event) => setReason(event.target.value)} />}</FormField>
      <div className="flex gap-3"><Button variant="danger" loading={busy} onClick={() => void confirm()}>Cancel class</Button><Button variant="secondary" disabled={busy} onClick={() => setAsking(undefined)}>Keep class</Button></div>
    </Card>}
    {entries.length === 0 ? <EmptyState message="No classes are scheduled under your name." action={<span className="text-secondary">Ask your department office to check the timetable.</span>} /> :
      <ul className="space-y-4">{entries.map((entry) => <li key={entry.id}><Card className="space-y-3">
        <div><h2>{entry.course}</h2><p className="text-secondary">{WEEKDAY[entry.weekday]}s · {entry.period ? `${entry.period.label}, ${formatClock(entry.period.start_time)}–${formatClock(entry.period.end_time)}` : ""} · {entry.room?.name} · Section {entry.section}</p></div>
        <ul className="flex flex-wrap gap-2" aria-label={`Upcoming dates for ${entry.course}`}>
          {upcoming(entry.weekday).map((date) => cancelled.has(`${entry.id}|${date}`)
            ? <li key={date}><Badge tone="slate">{formatDay(date)} · cancelled</Badge></li>
            : <li key={date}><Button size="sm" variant="secondary" aria-label={`Cancel ${entry.course} on ${formatDay(date)}`} onClick={() => { setAsking({ entry, date }); setReason(""); }}>Cancel {formatDay(date)}</Button></li>)}
        </ul>
      </Card></li>)}</ul>}
  </div>;
}
