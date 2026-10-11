"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { RoleGate } from "@/components/layout/role-gate";
import { Badge, Button, Card, EmptyState, FieldError, PageHeader, Skeleton, buttonStyles, useToast } from "@/components/ui";
import { ROLES } from "@/lib/constants/roles";
import { getCanteen, listMenu, listPickableSlots, placeOrder, type SlotOption } from "@/lib/db/canteen";
import { getSupabase } from "@/lib/supabase/browser";
import { formatClock, istDate } from "@/lib/time";
import type { CanteenRow, MenuItemRow, OrderRow } from "@/lib/types/campus";

const CUSTOMERS = Object.values(ROLES).filter((role) => !([ROLES.CANTEEN_KITCHEN, ROLES.CANTEEN_COUNTER, ROLES.CANTEEN_MANAGER] as string[]).includes(role));
const MAX_PER_ITEM = 10;
const rupees = (value: number) => `₹${value.toFixed(2).replace(/\.00$/, "")}`;

export default function CanteenOrderPage() {
  return <RoleGate roles={CUSTOMERS}><OrderForm /></RoleGate>;
}

function OrderForm() {
  const { id } = useParams<{ id: string }>();
  const toast = useToast();
  const [canteen, setCanteen] = useState<CanteenRow | null>();
  const [menu, setMenu] = useState<MenuItemRow[]>([]);
  const [slots, setSlots] = useState<SlotOption[]>([]);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [slotId, setSlotId] = useState("");
  const [error, setError] = useState<string>();
  const [formError, setFormError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [placed, setPlaced] = useState<{ order: OrderRow; slot: SlotOption }>();

  const loadSlots = useCallback(async () => {
    try { setSlots(await listPickableSlots(id, [istDate(0), istDate(1)])); }
    catch { setFormError("Pickup slots could not be loaded. Try again."); }
  }, [id]);
  const loadMenu = useCallback(async () => {
    try { setMenu(await listMenu(id)); }
    catch { setError("The menu could not be loaded. Try again."); }
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    getCanteen(id)
      .then((row) => { if (!cancelled) setCanteen(row); })
      .catch(() => { if (!cancelled) setError("The canteen could not be loaded. Try again."); });
    const timers = [setTimeout(() => void loadMenu(), 0), setTimeout(() => void loadSlots(), 0)];
    const refresh = setInterval(() => void loadSlots(), 30_000);
    const supabase = getSupabase();
    const channel = supabase.channel(`menu-${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "menu_items", filter: `canteen_id=eq.${id}` }, () => void loadMenu())
      .subscribe();
    return () => { cancelled = true; timers.forEach(clearTimeout); clearInterval(refresh); void supabase.removeChannel(channel); };
  }, [id, loadMenu, loadSlots]);

  const lines = useMemo(() => menu.filter((item) => cart[item.id] > 0).map((item) => ({ item, quantity: cart[item.id] })), [menu, cart]);
  const total = lines.reduce((sum, line) => sum + line.item.price * line.quantity, 0);
  const categories = useMemo(() => [...new Set(menu.map((item) => item.category))], [menu]);
  const chosen = slots.find((slot) => slot.id === slotId);

  function change(itemId: string, delta: number) {
    setFormError(undefined);
    setCart((current) => {
      const next = Math.min(MAX_PER_ITEM, Math.max(0, (current[itemId] ?? 0) + delta));
      const copy = { ...current };
      if (next === 0) delete copy[itemId]; else copy[itemId] = next;
      return copy;
    });
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    if (!lines.length) { setFormError("Add at least one item to your order."); return; }
    if (!chosen) { setFormError("Choose a pickup slot."); return; }
    setBusy(true); setFormError(undefined);
    try {
      const order = await placeOrder(id, chosen.id, lines.map((line) => ({ itemId: line.item.id, quantity: line.quantity })));
      setPlaced({ order, slot: chosen });
      setCart({}); setSlotId("");
      toast({ message: `Order placed. Your token is ${order.token}.` });
      void loadSlots();
    } catch (cause) {
      setFormError(cause instanceof Error ? cause.message : "The order could not be placed. Try again.");
      void loadSlots(); void loadMenu();
    } finally { setBusy(false); }
  }

  if (error && !canteen) return <EmptyState message={error} action={<Link href="/canteen" className={buttonStyles("secondary")}>Back to canteens</Link>} />;
  if (canteen === undefined) return <Skeleton label="Loading canteen" />;
  if (canteen === null) return <EmptyState message="This canteen does not exist." action={<Link href="/canteen" className={buttonStyles("secondary")}>Back to canteens</Link>} />;

  return <div className="space-y-6">
    <PageHeader title={canteen.name} context={`${canteen.location}. Pay at the counter; unpaid orders are forfeited when the slot ends.`}
      action={<Link href="/canteen/orders" className={buttonStyles("secondary")}>My orders</Link>} />
    {placed && <Card role="status" className="space-y-2 border-status-green-dark bg-status-green-light">
      <p className="text-status-green-dark">Order {placed.order.code} placed</p>
      <p className="text-title tabular-nums">Token {placed.order.token}</p>
      <p>Pickup {formatClock(placed.slot.start_time)}–{formatClock(placed.slot.end_time)} · Total {rupees(Number(placed.order.total))}</p>
      <Link href="/canteen/orders" className="text-link">View my orders</Link>
    </Card>}
    <FieldError>{error}</FieldError>
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <section aria-label="Menu" className="space-y-6">
        {menu.length === 0 ? <EmptyState message="Nothing is available right now. Check back soon." action={<Link href="/canteen" className={buttonStyles("secondary")}>Back to canteens</Link>} /> :
          categories.map((category) => <div key={category} className="space-y-2">
            <h2 className="capitalize">{category}</h2>
            <ul className="divide-y rounded-card border bg-surface">
              {menu.filter((item) => item.category === category).map((item) => <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 p-3">
                <div className="min-w-0"><p className="font-medium">{item.name}</p><p className="flex items-center gap-2 text-secondary">{rupees(item.price)} <Badge tone={item.veg ? "green" : "orange"}>{item.veg ? "Veg" : "Non-veg"}</Badge></p></div>
                <div className="flex items-center gap-2" role="group" aria-label={`Quantity of ${item.name}`}>
                  <Button variant="secondary" size="sm" aria-label={`Remove one ${item.name}`} disabled={!cart[item.id]} onClick={() => change(item.id, -1)}><Minus size={16} aria-hidden="true" /></Button>
                  <span className="w-6 text-center tabular-nums" aria-live="polite">{cart[item.id] ?? 0}</span>
                  <Button variant="secondary" size="sm" aria-label={`Add one ${item.name}`} disabled={(cart[item.id] ?? 0) >= MAX_PER_ITEM} onClick={() => change(item.id, 1)}><Plus size={16} aria-hidden="true" /></Button>
                </div>
              </li>)}
            </ul>
          </div>)}
      </section>

      <form onSubmit={submit} noValidate className="h-fit space-y-4 rounded-card border bg-surface p-4 lg:sticky lg:top-4" aria-label="Your order">
        <h2>Your order</h2>
        {lines.length === 0 ? <p className="text-secondary">Your cart is empty.</p> : <ul className="space-y-1">
          {lines.map((line) => <li key={line.item.id} className="flex justify-between gap-3"><span>{line.quantity} × {line.item.name}</span><span className="tabular-nums">{rupees(line.item.price * line.quantity)}</span></li>)}
          <li className="flex justify-between gap-3 border-t pt-2 font-semibold"><span>Total</span><span className="tabular-nums">{rupees(total)}</span></li>
        </ul>}
        <fieldset className="space-y-2">
          <legend className="font-medium">Pickup slot (required)</legend>
          {slots.length === 0 ? <p className="text-secondary">No slots are open. Slots start at least 15 minutes from now and end within the next hour.</p> :
            <div role="radiogroup" aria-label="Pickup slot" className="grid grid-cols-2 gap-2">
              {slots.map((slot) => {
                const full = slot.taken >= slot.capacity;
                const selected = slot.id === slotId;
                return <button key={slot.id} type="button" role="radio" aria-checked={selected} disabled={full} onClick={() => { setSlotId(slot.id); setFormError(undefined); }}
                  className={`min-h-11 rounded-control border px-2 py-2 text-left disabled:opacity-60 ${selected ? "border-accent bg-accent-light text-accent" : "bg-surface hover:bg-background"}`}>
                  <span className="block">{formatClock(slot.start_time)}–{formatClock(slot.end_time)}</span>
                  <span className="block text-secondary">{slot.slot_date === istDate(1) ? "Tomorrow · " : ""}{full ? "Full" : `${slot.capacity - slot.taken} left`}</span>
                </button>;
              })}
            </div>}
        </fieldset>
        <div aria-live="polite"><FieldError>{formError}</FieldError></div>
        <Button type="submit" loading={busy} disabled={!lines.length} className="w-full">Place order · {rupees(total)}</Button>
      </form>
    </div>
  </div>;
}
