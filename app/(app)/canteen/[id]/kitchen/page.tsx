"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { useCanteenOrders } from "@/components/canteen/use-canteen-orders";
import { CanteenGate } from "@/components/canteen/canteen-gate";
import { Handover } from "@/components/canteen/handover";
import { drainSorted } from "@/lib/algo/heap";
import { Badge, Button, Card, EmptyState, FieldError, PageHeader, Skeleton, buttonStyles, useToast } from "@/components/ui";
import { ROLES } from "@/lib/constants/roles";
import { advanceOrder } from "@/lib/db/canteen";
import { formatClock } from "@/lib/time";
import type { OrderRow } from "@/lib/types/campus";

export default function KitchenPage() {
  return <CanteenGate roles={[ROLES.CANTEEN_KITCHEN, ROLES.CANTEEN_MANAGER, ROLES.ADMIN]}><Kitchen /></CanteenGate>;
}

function Kitchen() {
  const { id } = useParams<{ id: string }>();
  const toast = useToast();
  const { orders, error, reload } = useCanteenOrders(id, ["PAID", "READY"]);
  const [busy, setBusy] = useState<string>();
  const [actionError, setActionError] = useState<string>();

  const totals = useMemo(() => {
    const sums = new Map<string, number>();
    for (const order of (orders ?? []).filter((row) => row.status === "PAID")) {
      for (const line of order.order_items ?? []) sums.set(line.item?.name ?? "Item", (sums.get(line.item?.name ?? "Item") ?? 0) + line.quantity);
    }
    return [...sums].sort((a, b) => b[1] - a[1]);
  }, [orders]);

  async function markReady(order: OrderRow) {
    if (busy) return;
    setBusy(order.id); setActionError(undefined);
    try { await advanceOrder(order.id, "READY"); toast({ message: `${order.token} is ready.` }); await reload(); }
    catch (cause) { setActionError(cause instanceof Error ? cause.message : "The order could not be updated. Try again."); await reload(); }
    finally { setBusy(undefined); }
  }

  if (error && !orders) return <EmptyState message={error} action={<Button onClick={() => void reload()}>Try again</Button>} />;
  if (!orders) return <Skeleton label="Loading kitchen orders" />;
  // Earliest pickup slot first, then oldest order: a heap keeps the queue order without re-sorting on every update.
  const toPrepare = drainSorted(orders.filter((order) => order.status === "PAID"), (a, b) => (a.slot?.start_time ?? "").localeCompare(b.slot?.start_time ?? "") || a.created_at.localeCompare(b.created_at));
  const ready = orders.filter((order) => order.status === "READY");

  return <div className="space-y-6">
    <PageHeader title="Kitchen" context="Paid orders appear here live. Mark each one ready when it is packed."
      action={<Link href={`/canteen/${id}/display`} className={buttonStyles("secondary")}>Open display board</Link>} />
    <div aria-live="polite"><FieldError>{actionError ?? error}</FieldError></div>
    <Card className="space-y-2"><h2>To prepare ({toPrepare.length} orders)</h2>
      {totals.length === 0 ? <p className="text-secondary">Nothing to prepare.</p> : <ul className="flex flex-wrap gap-2">{totals.map(([name, count]) => <li key={name}><Badge tone="blue">{count} × {name}</Badge></li>)}</ul>}
    </Card>
    <section aria-label="Orders to prepare" className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {toPrepare.map((order) => <Card key={order.id} className="space-y-3">
        <div className="flex items-start justify-between gap-3"><p className="text-title tabular-nums">{order.token}</p><Badge tone="amber">Pickup {order.slot ? formatClock(order.slot.start_time) : ""}</Badge></div>
        <ul className="space-y-1">{(order.order_items ?? []).map((line, index) => <li key={index}>{line.quantity} × {line.item?.name ?? "Item"}</li>)}</ul>
        <Button loading={busy === order.id} className="w-full" aria-label={`Mark ${order.token} ready`} onClick={() => void markReady(order)}>Mark ready</Button>
      </Card>)}
    </section>
    <section className="space-y-3" aria-label="Ready for pickup"><h2>Ready for pickup ({ready.length})</h2>
      {ready.length === 0 ? <p className="text-secondary">No orders are waiting at the counter.</p> :
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{ready.map((order) => <li key={order.id}><Card className="space-y-3">
          <div className="flex items-start justify-between gap-3"><p className="text-title tabular-nums">{order.token}</p><Badge tone="green">Ready</Badge></div>
          <Handover order={order} onDone={reload} />
        </Card></li>)}</ul>}
    </section>
  </div>;
}
