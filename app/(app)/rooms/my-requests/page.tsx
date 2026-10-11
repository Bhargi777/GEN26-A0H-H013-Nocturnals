"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { RoleGate } from "@/components/layout/role-gate";
import { useFrontend } from "@/components/layout/frontend-provider";
import { Button, DataTable, Dialog, EmptyState, FieldError, PageHeader, Skeleton, StatusBadge, buttonStyles, useToast } from "@/components/ui";
import { ROLES } from "@/lib/constants/roles";
import { cancelRoomBooking, getMyRoomBookings } from "@/lib/db/rooms";
import { getSupabase } from "@/lib/supabase/browser";
import { formatClock, formatDay, istDate } from "@/lib/time";
import type { RoomBookingRow } from "@/lib/types/campus";
import { useLiveRefresh } from "@/components/layout/live-sync";

export default function MyRoomRequestsPage() {
  return <RoleGate roles={[ROLES.FACULTY, ROLES.CR]}><Requests /></RoleGate>;
}

function Requests() {
  const { profile } = useFrontend();
  const toast = useToast();
  const [rows, setRows] = useState<RoomBookingRow[]>();
  const [error, setError] = useState<string>();
  const [cancelling, setCancelling] = useState<RoomBookingRow>();
  const userId = profile?.id;

  const load = useCallback(async () => {
    if (!userId) return;
    try { setRows(await getMyRoomBookings(userId)); setError(undefined); }
    catch { setError("Your room requests could not be loaded. Try again."); }
  }, [userId]);

  useLiveRefresh(load);
  useEffect(() => {
    if (!userId) return;
    const supabase = getSupabase();
    const first = setTimeout(() => void load(), 0);
    const channel = supabase.channel(`my-room-bookings-${userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "room_bookings", filter: `requested_by=eq.${userId}` }, () => void load())
      .subscribe();
    return () => { clearTimeout(first); void supabase.removeChannel(channel); };
  }, [load, userId]);

  if (error && !rows) return <EmptyState message={error} action={<Button onClick={() => void load()}>Try again</Button>} />;
  if (!rows) return <Skeleton label="Loading room requests" />;
  const today = istDate(0);

  return <div className="space-y-6">
    <PageHeader title="My room requests" context="Status of every room you have requested." action={<Link href="/rooms" className={buttonStyles()}>Book a room</Link>} />
    <FieldError>{error}</FieldError>
    <DataTable caption="My room requests" rows={rows} rowKey={(row) => row.id} columns={[
      { id: "code", header: "Request", cell: (row) => row.code, sortValue: (row) => row.code },
      { id: "room", header: "Room", cell: (row) => <span className="block"><span className="block font-medium">{row.room?.name ?? "Room"}</span><span className="block text-secondary">{row.reason}</span></span> },
      { id: "when", header: "When", cell: (row) => <span className="block"><span className="block">{formatDay(row.date)}</span><span className="block text-secondary">{row.period ? `${row.period.label} · ${formatClock(row.period.start_time)}–${formatClock(row.period.end_time)}` : ""}</span></span>, sortValue: (row) => row.date },
      { id: "status", header: "Status", cell: (row) => <span className="block space-y-1"><StatusBadge status={row.status} />{row.decision_note && <span className="block text-secondary">{row.decision_note}</span>}</span>, sortValue: (row) => row.status },
      { id: "action", header: "Action", cell: (row) => (row.status === "PENDING" || (row.status === "APPROVED" && row.date >= today))
        ? <Button variant="secondary" size="sm" aria-label={`Cancel request ${row.code}`} onClick={() => setCancelling(row)}>Cancel</Button>
        : <span className="text-secondary">None</span> },
    ]} emptyMessage="You have not requested any rooms yet." emptyAction={<Link href="/rooms" className={buttonStyles("secondary")}>Book a room</Link>} />
    <Dialog open={Boolean(cancelling)} title={`Cancel request ${cancelling?.code ?? ""}?`} description="The slot will be released for others to request." confirmLabel="Cancel request" danger
      onClose={() => setCancelling(undefined)}
      onConfirm={async () => {
        if (!cancelling) return;
        await cancelRoomBooking(cancelling.id);
        toast({ message: `Request ${cancelling.code} cancelled.` });
        setCancelling(undefined);
        await load();
      }} />
  </div>;
}
