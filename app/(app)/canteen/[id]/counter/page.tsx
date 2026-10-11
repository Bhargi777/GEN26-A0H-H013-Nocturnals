"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useCanteenOrders } from "@/components/canteen/use-canteen-orders";
import { RoleGate } from "@/components/layout/role-gate";
import { Badge, Button, Card, EmptyState, FieldError, FormField, Input, PageHeader, Skeleton, buttonStyles, useToast } from "@/components/ui";
import { ROLES } from "@/lib/constants/roles";
import { advanceOrder, forfeitUnpaidOrders, itemsSummary } from "@/lib/db/canteen";
import { formatClock } from "@/lib/time";
import type { OrderRow, OrderStatusValue } from "@/lib/types/campus";

export default function CounterPage() {
  return <RoleGate roles={[ROLES.CANTEEN_COUNTER, ROLES.CANTEEN_MANAGER, ROLES.ADMIN]}><Counter /></RoleGate>;
}

function Counter() {
  const { id } = useParams<{ id: string }>();
  const toast = useToast();
  const { orders, error, reload } = useCanteenOrders(id, ["PLACED", "PAID", "READY"]);
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState<string>();
  const [actionError, setActionError] = useState<string>();

  useEffect(() => {
    const sweep = () => { forfeitUnpaidOrders().then((count) => { if (count) void reload(); }).catch(() => undefined); };
    const first = setTimeout(sweep, 0);
    const timer = setInterval(sweep, 60_000);
    return () => { clearTimeout(first); clearInterval(timer); };
  }, [reload]);

  async function move(order: OrderRow, to: OrderStatusValue, message: string) {
    if (busy) return;
    setBusy(order.id); setActionError(undefined);
    try { await advanceOrder(order.id, to); toast({ message }); await reload(); }
    catch (cause) { setActionError(cause instanceof Error ? cause.message : "The order could not be updated. Try again."); await reload(); }
    finally { setBusy(undefined); }
  }

  if (error && !orders) return <EmptyState message={error} action={<Button onClick={() => void reload()}>Try again</Button>} />;
  if (!orders) return <Skeleton label="Loading counter orders" />;

  const term = search.trim().toLowerCase();
  const shown = orders.filter((order) => !term || order.token.toLowerCase().includes(term));
  const sections: { status: OrderStatusValue; title: string; empty: string }[] = [
    { status: "PLACED", title: "Awaiting payment", empty: "No orders are waiting for payment." },
    { status: "READY", title: "Ready for pickup", empty: "No orders are ready yet." },
    { status: "PAID", title: "Being prepared", empty: "Nothing is being prepared." },
  ];

  return <div className="space-y-6">
    <PageHeader title="Counter" context="Take payment, then hand over ready orders. Unpaid orders are forfeited when their slot ends."
      action={<Link href={`/canteen/${id}/display`} className={buttonStyles("secondary")}>Open display board</Link>} />
    <div className="max-w-sm"><FormField label="Find a token">{(control) => <Input {...control} type="search" value={search} placeholder="e.g. MAIN-004" onChange={(event) => setSearch(event.target.value)} />}</FormField></div>
    <div aria-live="polite"><FieldError>{actionError ?? error}</FieldError></div>
    <div className="grid gap-6 xl:grid-cols-3">
      {sections.map((section) => {
        const rows = shown.filter((order) => order.status === section.status);
        return <section key={section.status} aria-label={section.title} className="space-y-3">
          <h2>{section.title} ({rows.length})</h2>
          {rows.length === 0 ? <p className="text-secondary">{section.empty}</p> : <ul className="space-y-3">
            {rows.map((order) => <li key={order.id}><Card className="space-y-2">
              <div className="flex items-start justify-between gap-3"><p className="text-title tabular-nums">{order.token}</p><Badge tone={section.status === "READY" ? "green" : section.status === "PLACED" ? "amber" : "blue"}>₹{Number(order.total)}</Badge></div>
              <p className="text-secondary">{itemsSummary(order)}</p>
              <p className="text-secondary">Pickup {order.slot ? `${formatClock(order.slot.start_time)}–${formatClock(order.slot.end_time)}` : ""}</p>
              {section.status === "PLACED" && <Button loading={busy === order.id} className="w-full" aria-label={`Mark ${order.token} paid`} onClick={() => void move(order, "PAID", `${order.token} marked paid.`)}>Mark paid</Button>}
              {section.status === "READY" && <Button loading={busy === order.id} className="w-full" aria-label={`Mark ${order.token} collected`} onClick={() => void move(order, "COLLECTED", `${order.token} collected.`)}>Mark collected</Button>}
            </Card></li>)}
          </ul>}
        </section>;
      })}
    </div>
  </div>;
}
