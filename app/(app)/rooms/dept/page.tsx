"use client";

import { useCallback, useEffect, useState } from "react";
import { RoleGate } from "@/components/layout/role-gate";
import { Badge, Button, Card, DataTable, EmptyState, FieldError, FormField, Input, PageHeader, Skeleton, StatusBadge, Textarea, useToast } from "@/components/ui";
import { ROLES } from "@/lib/constants/roles";
import { decideRoomBooking, findConflicts, getDepartmentBookings } from "@/lib/db/rooms";
import { getSupabase } from "@/lib/supabase/browser";
import { formatClock, formatDay } from "@/lib/time";
import type { RoomBookingRow } from "@/lib/types/campus";

type Tab = "pending" | "conflicts" | "decided";
const TABS: { id: Tab; label: string }[] = [{ id: "pending", label: "Pending" }, { id: "conflicts", label: "Conflicts" }, { id: "decided", label: "Decided" }];

export default function DeptRoomsPage() {
  return <RoleGate roles={[ROLES.DEPT_OFFICE, ROLES.DEPT_HEAD, ROLES.ADMIN]}><Queue /></RoleGate>;
}

function Queue() {
  const toast = useToast();
  const [rows, setRows] = useState<RoomBookingRow[]>();
  const [error, setError] = useState<string>();
  const [tab, setTab] = useState<Tab>("pending");
  const [date, setDate] = useState("");
  const [busy, setBusy] = useState<string>();
  const [rejecting, setRejecting] = useState<{ booking: RoomBookingRow; note: string; error?: string }>();

  const load = useCallback(async () => {
    try { setRows(await getDepartmentBookings()); setError(undefined); }
    catch { setError("Room requests could not be loaded. Try again."); }
  }, []);

  useEffect(() => {
    const supabase = getSupabase();
    const first = setTimeout(() => void load(), 0);
    const channel = supabase.channel("dept-room-bookings")
      .on("postgres_changes", { event: "*", schema: "public", table: "room_bookings" }, () => void load())
      .subscribe();
    return () => { clearTimeout(first); void supabase.removeChannel(channel); };
  }, [load]);

  if (error && !rows) return <EmptyState message={error} action={<Button onClick={() => void load()}>Try again</Button>} />;
  if (!rows) return <Skeleton label="Loading room requests" />;

  const conflicts = findConflicts(rows);
  const inDate = rows.filter((row) => !date || row.date === date);
  const visible = tab === "pending" ? inDate.filter((row) => row.status === "PENDING")
    : tab === "conflicts" ? inDate.filter((row) => conflicts.has(row.id))
    : inDate.filter((row) => row.status !== "PENDING");

  async function approve(row: RoomBookingRow) {
    if (busy) return;
    setBusy(row.id);
    try {
      await decideRoomBooking(row.id, true);
      toast({ message: `${row.code} approved.${conflicts.has(row.id) ? " Competing requests were rejected." : ""}` });
      await load();
    } catch (cause) { toast({ tone: "error", message: cause instanceof Error ? cause.message : "Approval failed. Try again." }); await load(); }
    finally { setBusy(undefined); }
  }
  async function reject() {
    if (!rejecting || busy) return;
    const note = rejecting.note.trim();
    if (note.length < 3) { setRejecting({ ...rejecting, error: "Enter a reason of at least 3 characters." }); return; }
    setBusy(rejecting.booking.id);
    try {
      await decideRoomBooking(rejecting.booking.id, false, note);
      toast({ message: `${rejecting.booking.code} rejected.` });
      setRejecting(undefined);
      await load();
    } catch (cause) { setRejecting({ ...rejecting, error: cause instanceof Error ? cause.message : "Rejection failed. Try again." }); }
    finally { setBusy(undefined); }
  }

  return <div className="space-y-6">
    <PageHeader title="Room approvals" context="Requests for rooms in blocks your department owns. Approving a request rejects competing ones for the same slot." />
    <div className="flex flex-wrap items-end gap-4">
      <div role="tablist" aria-label="Request views" className="flex gap-2">
        {TABS.map((item) => <button key={item.id} type="button" role="tab" id={`tab-${item.id}`} aria-selected={tab === item.id} aria-controls="queue-panel" onClick={() => setTab(item.id)}
          className={`min-h-11 rounded-control border px-4 py-2 ${tab === item.id ? "border-accent bg-accent-light font-medium text-accent" : "bg-surface hover:bg-background"}`}>
          {item.label} ({item.id === "pending" ? rows.filter((row) => row.status === "PENDING").length : item.id === "conflicts" ? conflicts.size : rows.filter((row) => row.status !== "PENDING").length})
        </button>)}
      </div>
      <div className="w-48"><FormField label="Date">{(control) => <Input {...control} type="date" value={date} onChange={(event) => setDate(event.target.value)} />}</FormField></div>
      {date && <Button variant="ghost" onClick={() => setDate("")}>Show all dates</Button>}
    </div>
    <FieldError>{error}</FieldError>

    {rejecting && <Card className="max-w-xl space-y-3" role="group" aria-label={`Reject ${rejecting.booking.code}`}>
      <h2>Reject {rejecting.booking.code}</h2>
      <FormField label="Reason for rejecting" required error={rejecting.error}>{(control) => <Textarea {...control} autoFocus rows={3} maxLength={300} value={rejecting.note} onChange={(event) => setRejecting({ ...rejecting, note: event.target.value, error: undefined })} />}</FormField>
      <div className="flex gap-3"><Button variant="danger" loading={busy === rejecting.booking.id} onClick={() => void reject()}>Reject request</Button><Button variant="secondary" onClick={() => setRejecting(undefined)}>Keep request</Button></div>
    </Card>}

    <div id="queue-panel" role="tabpanel" aria-labelledby={`tab-${tab}`}>
      <DataTable caption={`${TABS.find((item) => item.id === tab)?.label} room requests`} rows={visible} rowKey={(row) => row.id} columns={[
        { id: "code", header: "Request", cell: (row) => <span className="block"><span className="block font-medium">{row.code}</span>{conflicts.has(row.id) && <Badge tone="orange">Conflict</Badge>}</span>, sortValue: (row) => row.code },
        { id: "room", header: "Room", cell: (row) => <span className="block"><span className="block font-medium">{row.room?.name ?? "Room"}</span><span className="block text-secondary">{row.attendees} attendees</span></span> },
        { id: "when", header: "When", cell: (row) => <span className="block"><span className="block">{formatDay(row.date)}</span><span className="block text-secondary">{row.period ? `${row.period.label} · ${formatClock(row.period.start_time)}–${formatClock(row.period.end_time)}` : ""}</span></span>, sortValue: (row) => row.date },
        { id: "who", header: "Requested by", cell: (row) => <span className="block"><span className="block">{row.requester?.full_name ?? "Unknown"}</span><span className="block text-secondary">Faculty: {row.faculty_name}</span><span className="block text-secondary">{row.reason}</span></span> },
        { id: "status", header: "Status", cell: (row) => <span className="block space-y-1"><StatusBadge status={row.status} />{row.decision_note && <span className="block text-secondary">{row.decision_note}</span>}</span> },
        { id: "action", header: "Action", cell: (row) => row.status === "PENDING"
          ? <span className="flex flex-wrap gap-2"><Button size="sm" loading={busy === row.id} aria-label={`Approve ${row.code}`} onClick={() => void approve(row)}>Approve</Button><Button size="sm" variant="secondary" disabled={Boolean(busy)} aria-label={`Reject ${row.code}`} onClick={() => setRejecting({ booking: row, note: "" })}>Reject</Button></span>
          : <span className="text-secondary">Decided</span> },
      ]} emptyMessage={tab === "pending" ? "No pending room requests." : tab === "conflicts" ? "No competing requests." : "No decided requests yet."} />
    </div>
  </div>;
}
