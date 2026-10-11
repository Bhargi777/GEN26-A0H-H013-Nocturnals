"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { RoleGate } from "@/components/layout/role-gate";
import { useFrontend } from "@/components/layout/frontend-provider";
import { Button, DataTable, EmptyState, PageHeader, Skeleton, StatusBadge, buttonStyles } from "@/components/ui";
import { ROLES } from "@/lib/constants/roles";
import { itemsSummary, listMyOrders } from "@/lib/db/canteen";
import { getSupabase } from "@/lib/supabase/browser";
import { formatClock, formatDay } from "@/lib/time";
import type { OrderRow } from "@/lib/types/campus";

const CUSTOMERS = Object.values(ROLES).filter((role) => !([ROLES.CANTEEN_KITCHEN, ROLES.CANTEEN_COUNTER, ROLES.CANTEEN_MANAGER] as string[]).includes(role));

export default function OrdersPage() {
  return <RoleGate roles={CUSTOMERS}><Orders /></RoleGate>;
}

function Orders() {
  const { profile } = useFrontend();
  const [orders, setOrders] = useState<OrderRow[]>();
  const [error, setError] = useState<string>();
  const userId = profile?.id;

  const load = useCallback(async () => {
    if (!userId) return;
    try { setOrders(await listMyOrders(userId)); setError(undefined); }
    catch { setError("Your orders could not be loaded. Try again."); }
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    const supabase = getSupabase();
    const first = setTimeout(() => void load(), 0);
    const channel = supabase.channel(`my-orders-${userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "orders", filter: `user_id=eq.${userId}` }, () => void load())
      .subscribe();
    return () => { clearTimeout(first); void supabase.removeChannel(channel); };
  }, [load, userId]);

  if (error && !orders) return <EmptyState message={error} action={<Button onClick={() => void load()}>Try again</Button>} />;
  if (!orders) return <Skeleton label="Loading orders" />;
  const ready = orders.filter((order) => order.status === "READY");

  return <div className="space-y-6">
    <PageHeader title="My orders" context="Your canteen orders, newest first. Ready orders are highlighted." action={<Link href="/canteen" className={buttonStyles()}>Order food</Link>} />
    {ready.length > 0 && <div role="status" className="rounded-card border border-status-green-dark bg-status-green-light p-4 text-status-green-dark">
      {ready.length === 1 ? `Order ${ready[0].token} is ready for pickup.` : `Orders ${ready.map((order) => order.token).join(", ")} are ready for pickup.`}
    </div>}
    <DataTable caption="My canteen orders" rows={orders} rowKey={(row) => row.id} columns={[
      { id: "token", header: "Token", cell: (row) => <span className="block"><span className="block text-section tabular-nums">{row.token}</span><span className="block text-secondary">{row.code}</span></span>, sortValue: (row) => row.token },
      { id: "items", header: "Order", cell: (row) => <span className="block"><span className="block">{itemsSummary(row)}</span><span className="block text-secondary">{row.canteen?.name}</span></span> },
      { id: "pickup", header: "Pickup", cell: (row) => row.slot ? <span className="block"><span className="block">{formatDay(row.slot.slot_date)}</span><span className="block text-secondary">{formatClock(row.slot.start_time)}–{formatClock(row.slot.end_time)}</span></span> : "", sortValue: (row) => row.slot ? `${row.slot.slot_date} ${row.slot.start_time}` : "" },
      { id: "total", header: "Total", cell: (row) => `₹${Number(row.total)}`, sortValue: (row) => Number(row.total) },
      { id: "status", header: "Status", cell: (row) => <span className="block space-y-1"><StatusBadge status={row.status} />{row.status === "PLACED" && <span className="block text-secondary">Pay at the counter before the slot ends.</span>}</span>, sortValue: (row) => row.status },
    ]} emptyMessage="You have not ordered anything yet." emptyAction={<Link href="/canteen" className={buttonStyles("secondary")}>Browse canteens</Link>} />
  </div>;
}
