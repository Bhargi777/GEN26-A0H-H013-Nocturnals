"use client";

import { useCallback, useEffect, useState } from "react";
import { RoleGate } from "@/components/layout/role-gate";
import { Button, DataTable, EmptyState, FieldError, PageHeader, Skeleton, StatusBadge, useToast } from "@/components/ui";
import { ROLES } from "@/lib/constants/roles";
import { getApprovedEventRequests, markEventCalendared } from "@/lib/db/events";
import { getSupabase } from "@/lib/supabase/browser";
import { formatClock, formatDay } from "@/lib/time";
import { useLiveRefresh } from "@/components/layout/live-sync";

interface ApprovedEvent { id: string; code: string; title: string; event_type: string; event_date: string; start_time: string; end_time: string; expected_attendance: number; status: "APPROVED" }

export default function EventCalendarPage() {
  return <RoleGate roles={[ROLES.EVENTS_DEPT, ROLES.ADMIN]}><Queue /></RoleGate>;
}

function Queue() {
  const toast = useToast();
  const [rows, setRows] = useState<ApprovedEvent[]>();
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState<string>();

  const load = useCallback(async () => {
    try { setRows((await getApprovedEventRequests()) as unknown as ApprovedEvent[]); setError(undefined); }
    catch { setError("Approved events could not be loaded. Try again."); }
  }, []);

  useLiveRefresh(load);
  useEffect(() => {
    const supabase = getSupabase();
    const first = setTimeout(() => void load(), 0);
    const channel = supabase.channel("events-calendar")
      .on("postgres_changes", { event: "*", schema: "public", table: "event_requests" }, () => void load())
      .subscribe();
    return () => { clearTimeout(first); void supabase.removeChannel(channel); };
  }, [load]);

  async function calendar(row: ApprovedEvent) {
    if (busy) return;
    setBusy(row.id);
    try { await markEventCalendared(row.id); toast({ message: `${row.code} added to the campus calendar.` }); await load(); }
    catch (cause) { toast({ tone: "error", message: cause instanceof Error ? cause.message : "The event could not be calendared. Try again." }); }
    finally { setBusy(undefined); }
  }

  if (error && !rows) return <EmptyState message={error} action={<Button onClick={() => void load()}>Try again</Button>} />;
  if (!rows) return <Skeleton label="Loading approved events" />;

  return <div className="space-y-6">
    <PageHeader title="Event calendar queue" context="Events the campus director approved. Add each one to the campus calendar." />
    <FieldError>{error}</FieldError>
    <DataTable caption="Approved events waiting for the calendar" rows={rows} rowKey={(row) => row.id} columns={[
      { id: "code", header: "Event", cell: (row) => <span className="block"><span className="block font-medium">{row.title}</span><span className="block text-secondary">{row.code} · {row.event_type}</span></span>, sortValue: (row) => row.code },
      { id: "when", header: "When", cell: (row) => <span className="block"><span className="block">{formatDay(row.event_date)}</span><span className="block text-secondary">{formatClock(row.start_time)}–{formatClock(row.end_time)}</span></span>, sortValue: (row) => row.event_date },
      { id: "size", header: "Attendance", cell: (row) => row.expected_attendance, sortValue: (row) => row.expected_attendance },
      { id: "status", header: "Status", cell: (row) => <StatusBadge status={row.status} /> },
      { id: "action", header: "Action", cell: (row) => <Button size="sm" loading={busy === row.id} aria-label={`Add ${row.title} to the calendar`} onClick={() => void calendar(row)}>Add to calendar</Button> },
    ]} emptyMessage="No approved events are waiting." />
  </div>;
}
