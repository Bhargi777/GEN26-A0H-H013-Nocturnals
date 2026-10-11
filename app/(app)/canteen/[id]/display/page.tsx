"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useCanteenOrders } from "@/components/canteen/use-canteen-orders";
import { RoleGate } from "@/components/layout/role-gate";
import { Button, EmptyState, Skeleton } from "@/components/ui";
import { ROLES } from "@/lib/constants/roles";
import { getCanteen } from "@/lib/db/canteen";

export default function DisplayPage() {
  return <RoleGate roles={[ROLES.CANTEEN_KITCHEN, ROLES.CANTEEN_COUNTER, ROLES.CANTEEN_MANAGER, ROLES.ADMIN]}><Board /></RoleGate>;
}

function Board() {
  const { id } = useParams<{ id: string }>();
  const { orders, error, reload } = useCanteenOrders(id, ["PAID", "READY"]);
  const [name, setName] = useState("");

  useEffect(() => {
    let cancelled = false;
    getCanteen(id).then((row) => { if (!cancelled && row) setName(row.name); }).catch(() => undefined);
    return () => { cancelled = true; };
  }, [id]);

  if (error && !orders) return <EmptyState message={error} action={<Button onClick={() => void reload()}>Try again</Button>} />;
  if (!orders) return <Skeleton label="Loading display board" />;
  const ready = orders.filter((order) => order.status === "READY");
  const preparing = orders.filter((order) => order.status === "PAID");

  return <div className="space-y-8">
    <h1>{name ? `${name} · ` : ""}Order status</h1>
    <section aria-labelledby="ready-heading" className="space-y-3">
      <h2 id="ready-heading">Ready for pickup</h2>
      {/* aria-live announces new tokens to screen reader users */}
      <ul aria-live="polite" className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {ready.length === 0 ? <li className="col-span-full text-secondary">No orders are ready right now.</li> :
          ready.map((order) => <li key={order.id} className="rounded-card border border-status-green-dark bg-status-green-light p-6 text-center text-status-green-dark"><span className="text-title tabular-nums">{order.token}</span></li>)}
      </ul>
    </section>
    <section aria-labelledby="preparing-heading" className="space-y-3">
      <h2 id="preparing-heading">Being prepared</h2>
      <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        {preparing.length === 0 ? <li className="col-span-full text-secondary">Nothing is being prepared.</li> :
          preparing.map((order) => <li key={order.id} className="rounded-card border bg-surface p-3 text-center tabular-nums">{order.token}</li>)}
      </ul>
    </section>
  </div>;
}
