"use client";

import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { RoleGate } from "@/components/layout/role-gate";
import { Badge, Button, DataTable, EmptyState, FieldError, FormField, Input, PageHeader, Select, Skeleton, useToast } from "@/components/ui";
import { ROLES } from "@/lib/constants/roles";
import { createSlots, deleteSlot, listMenu, listSlots, saveMenuItem, setItemAvailable, updateSlotCapacity, type SlotOption } from "@/lib/db/canteen";
import { getSupabase } from "@/lib/supabase/browser";
import { formatClock, istDate } from "@/lib/time";
import type { MenuItemRow } from "@/lib/types/campus";

export default function ManagePage() {
  return <RoleGate roles={[ROLES.CANTEEN_MANAGER, ROLES.ADMIN]}><Manage /></RoleGate>;
}

interface ItemForm { id?: string; name: string; price: string; category: string; veg: string }
const blankItem: ItemForm = { name: "", price: "", category: "", veg: "yes" };

function Manage() {
  const { id } = useParams<{ id: string }>();
  const toast = useToast();
  const [menu, setMenu] = useState<MenuItemRow[]>();
  const [slots, setSlots] = useState<SlotOption[]>([]);
  const [date, setDate] = useState(istDate(0));
  const [error, setError] = useState<string>();
  const [item, setItem] = useState<ItemForm>(blankItem);
  const [itemErrors, setItemErrors] = useState<Partial<Record<keyof ItemForm, string>>>({});
  const [hours, setHours] = useState({ from: "07:00", to: "21:00", capacity: "25" });
  const [hoursError, setHoursError] = useState<string>();
  const [busy, setBusy] = useState<string>();

  const loadMenu = useCallback(async () => {
    try { setMenu(await listMenu(id, true)); setError(undefined); } catch { setError("The menu could not be loaded. Try again."); }
  }, [id]);
  const loadSlots = useCallback(async (day: string) => {
    try { setSlots(await listSlots(id, day)); } catch { setError("Slots could not be loaded. Try again."); }
  }, [id]);

  useEffect(() => {
    const first = setTimeout(() => void loadMenu(), 0);
    const supabase = getSupabase();
    const channel = supabase.channel(`manage-${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "menu_items", filter: `canteen_id=eq.${id}` }, () => void loadMenu())
      .subscribe();
    return () => { clearTimeout(first); void supabase.removeChannel(channel); };
  }, [id, loadMenu]);
  useEffect(() => {
    const first = setTimeout(() => void loadSlots(date), 0);
    return () => clearTimeout(first);
  }, [date, loadSlots]);

  async function run(key: string, task: () => Promise<void>, success: string) {
    if (busy) return;
    setBusy(key); setError(undefined);
    try { await task(); toast({ message: success }); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "That change failed. Try again."); }
    finally { setBusy(undefined); }
  }

  async function submitItem(event: React.FormEvent) {
    event.preventDefault();
    const found: typeof itemErrors = {};
    const price = Number(item.price);
    if (item.name.trim().length < 2) found.name = "Enter the item name.";
    if (!item.price || !Number.isFinite(price) || price <= 0 || price > 5000) found.price = "Enter a price between ₹1 and ₹5000.";
    if (item.category.trim().length < 2) found.category = "Enter a category, for example rice or beverage.";
    setItemErrors(found);
    if (Object.keys(found).length) return;
    await run("item", async () => {
      await saveMenuItem(id, { name: item.name.trim(), price, category: item.category.trim().toLowerCase(), veg: item.veg === "yes" }, item.id);
      setItem(blankItem);
      await loadMenu();
    }, item.id ? "Menu item updated." : "Menu item added.");
  }

  async function submitHours(event: React.FormEvent) {
    event.preventDefault();
    const capacity = Number(hours.capacity);
    if (!hours.from || !hours.to || hours.to <= hours.from) { setHoursError("Choose a closing time after the opening time."); return; }
    if (!Number.isInteger(capacity) || capacity < 1 || capacity > 500) { setHoursError("Capacity must be a whole number from 1 to 500."); return; }
    setHoursError(undefined);
    await run("slots", async () => { await createSlots(id, date, hours.from, hours.to, capacity); await loadSlots(date); }, "Slots created. Existing slots were kept.");
  }

  if (error && !menu) return <EmptyState message={error} action={<Button onClick={() => void loadMenu()}>Try again</Button>} />;
  if (!menu) return <Skeleton label="Loading canteen settings" />;

  return <div className="space-y-8">
    <PageHeader title="Menu and slots" context="Changes to availability show up for customers immediately." />
    <div aria-live="polite"><FieldError>{error}</FieldError></div>

    <section className="space-y-4" aria-labelledby="menu-heading">
      <h2 id="menu-heading">Menu</h2>
      <form onSubmit={submitItem} noValidate className="grid gap-4 rounded-card border bg-surface p-4 md:grid-cols-2 xl:grid-cols-5" aria-label={item.id ? "Edit menu item" : "Add menu item"}>
        <FormField label="Name" required error={itemErrors.name}>{(control) => <Input {...control} value={item.name} maxLength={80} onChange={(event) => setItem({ ...item, name: event.target.value })} />}</FormField>
        <FormField label="Price (₹)" required error={itemErrors.price}>{(control) => <Input {...control} type="number" inputMode="decimal" min={1} step="0.5" value={item.price} onChange={(event) => setItem({ ...item, price: event.target.value })} />}</FormField>
        <FormField label="Category" required error={itemErrors.category}>{(control) => <Input {...control} value={item.category} maxLength={30} onChange={(event) => setItem({ ...item, category: event.target.value })} />}</FormField>
        <FormField label="Diet">{(control) => <Select {...control} value={item.veg} onChange={(event) => setItem({ ...item, veg: event.target.value })}><option value="yes">Vegetarian</option><option value="no">Non-vegetarian</option></Select>}</FormField>
        <div className="flex items-end gap-2"><Button type="submit" loading={busy === "item"}>{item.id ? "Save item" : "Add item"}</Button>{item.id && <Button variant="secondary" onClick={() => { setItem(blankItem); setItemErrors({}); }}>Cancel</Button>}</div>
      </form>
      <DataTable caption="Menu items" rows={menu} rowKey={(row) => row.id} pageSize={8} columns={[
        { id: "name", header: "Item", cell: (row) => <span className="block"><span className="block font-medium">{row.name}</span><span className="block text-secondary capitalize">{row.category}</span></span>, sortValue: (row) => row.name },
        { id: "price", header: "Price", cell: (row) => `₹${row.price}`, sortValue: (row) => row.price },
        { id: "diet", header: "Diet", cell: (row) => <Badge tone={row.veg ? "green" : "orange"}>{row.veg ? "Veg" : "Non-veg"}</Badge> },
        { id: "available", header: "Availability", cell: (row) => <Badge tone={row.available ? "green" : "slate"}>{row.available ? "Available" : "Unavailable"}</Badge>, sortValue: (row) => Number(row.available) },
        { id: "actions", header: "Actions", cell: (row) => <span className="flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" loading={busy === `avail-${row.id}`} aria-label={`${row.available ? "Mark unavailable" : "Mark available"}: ${row.name}`} onClick={() => void run(`avail-${row.id}`, async () => { await setItemAvailable(row.id, !row.available); await loadMenu(); }, `${row.name} is now ${row.available ? "unavailable" : "available"}.`)}>{row.available ? "Mark unavailable" : "Mark available"}</Button>
          <Button size="sm" variant="ghost" aria-label={`Edit ${row.name}`} onClick={() => { setItem({ id: row.id, name: row.name, price: String(row.price), category: row.category, veg: row.veg ? "yes" : "no" }); setItemErrors({}); }}>Edit</Button>
        </span> },
      ]} emptyMessage="The menu is empty. Add the first item above." />
    </section>

    <section className="space-y-4" aria-labelledby="slots-heading">
      <h2 id="slots-heading">Pickup slots</h2>
      <p className="text-secondary">Slots are 15 minutes long. Customers can only pick slots that start 15 minutes or more from now and end within the next hour.</p>
      <form onSubmit={submitHours} noValidate className="grid gap-4 rounded-card border bg-surface p-4 md:grid-cols-2 xl:grid-cols-5" aria-label="Create slots">
        <FormField label="Date" required>{(control) => <Input {...control} type="date" value={date} min={istDate(0)} onChange={(event) => setDate(event.target.value)} />}</FormField>
        <FormField label="Open from" required>{(control) => <Input {...control} type="time" step={900} value={hours.from} onChange={(event) => setHours({ ...hours, from: event.target.value })} />}</FormField>
        <FormField label="Open until" required>{(control) => <Input {...control} type="time" step={900} value={hours.to} onChange={(event) => setHours({ ...hours, to: event.target.value })} />}</FormField>
        <FormField label="Orders per slot" required>{(control) => <Input {...control} type="number" inputMode="numeric" min={1} max={500} value={hours.capacity} onChange={(event) => setHours({ ...hours, capacity: event.target.value })} />}</FormField>
        <div className="flex items-end"><Button type="submit" loading={busy === "slots"}>Create slots</Button></div>
        <div className="md:col-span-2 xl:col-span-5"><FieldError>{hoursError}</FieldError></div>
      </form>
      <DataTable caption={`Slots on ${date}`} rows={slots} rowKey={(row) => row.id} pageSize={12} columns={[
        { id: "time", header: "Slot", cell: (row) => `${formatClock(row.start_time)}–${formatClock(row.end_time)}`, sortValue: (row) => row.start_time },
        { id: "taken", header: "Orders", cell: (row) => `${row.taken} of ${row.capacity}`, sortValue: (row) => row.taken },
        { id: "actions", header: "Actions", cell: (row) => <span className="flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" loading={busy === `cap-${row.id}`} aria-label={`Add 5 capacity to ${formatClock(row.start_time)} slot`} onClick={() => void run(`cap-${row.id}`, async () => { await updateSlotCapacity(row.id, row.capacity + 5); await loadSlots(date); }, "Capacity increased by 5.")}>+5 capacity</Button>
          <Button size="sm" variant="ghost" loading={busy === `del-${row.id}`} aria-label={`Delete ${formatClock(row.start_time)} slot`} onClick={() => void run(`del-${row.id}`, async () => { await deleteSlot(row.id); await loadSlots(date); }, "Slot deleted.")}>Delete</Button>
        </span> },
      ]} emptyMessage="No slots on this date. Create some above." />
    </section>
  </div>;
}
