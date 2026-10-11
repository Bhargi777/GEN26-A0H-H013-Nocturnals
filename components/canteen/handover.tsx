"use client";

import { useState } from "react";
import { Button, FieldError, useToast } from "@/components/ui";
import { advanceOrder, setItemGiven } from "@/lib/db/canteen";
import type { OrderRow } from "@/lib/types/campus";

/**
 * Handover for a READY order: tick each item as it is given, then close the bill.
 * "Mark collected" stays disabled until every item is ticked; the database enforces the same rule.
 */
export function Handover({ order, onDone }: { order: OrderRow; onDone: () => Promise<void> }) {
  const toast = useToast();
  const items = order.order_items ?? [];
  const given = items.filter((line) => line.given).length;
  const complete = items.length > 0 && given === items.length;
  const [busy, setBusy] = useState<string>();
  const [error, setError] = useState<string>();

  async function tick(itemId: string, value: boolean) {
    if (busy) return;
    setBusy(itemId); setError(undefined);
    try { await setItemGiven(itemId, value); await onDone(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "The item could not be updated. Try again."); await onDone(); }
    finally { setBusy(undefined); }
  }

  async function collect() {
    if (busy) return;
    setBusy("collect"); setError(undefined);
    try { await advanceOrder(order.id, "COLLECTED"); toast({ message: `${order.token} collected.` }); await onDone(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "The bill could not be closed. Try again."); await onDone(); }
    finally { setBusy(undefined); }
  }

  return <div className="space-y-3">
    <fieldset className="space-y-2">
      <legend className="font-medium">Items handed over ({given} of {items.length})</legend>
      {items.map((line) => <label key={line.id} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-control border bg-surface px-3 py-2 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent">
        <input type="checkbox" className="h-5 w-5 shrink-0 accent-accent" checked={line.given} disabled={Boolean(busy)} onChange={(event) => void tick(line.id, event.target.checked)} />
        <span className={line.given ? "text-secondary line-through" : ""}>{line.quantity} × {line.item?.name ?? "Item"}</span>
      </label>)}
    </fieldset>
    <Button className="w-full" loading={busy === "collect"} disabled={!complete || Boolean(busy)} aria-label={`Mark ${order.token} collected`} onClick={() => void collect()}>Mark collected</Button>
    {!complete && <p className="text-secondary">Tick every item to close the bill.</p>}
    <div aria-live="polite"><FieldError>{error}</FieldError></div>
  </div>;
}
