// Canteen ordering data layer (Module D).
// Orders are created and moved only through RPCs, which re-check the slot window,
// prices, availability and the staff role in the database.
import { getSupabase } from '../supabase/browser';
import { isValidCanteenSlot, istInstant } from '../time';
import type { CanteenRow, CanteenSlotRow, MenuItemRow, OrderRow, OrderStatusValue } from '../types/campus';

function fail(error: { message: string } | null): asserts error is null {
  if (error) throw new Error(error.message);
}

const ORDER_COLUMNS =
  'id, code, token, canteen_id, user_id, slot_id, status, total, created_at, ' +
  'slot:slot_id(slot_date, start_time, end_time), canteen:canteen_id(name), order_items(id, quantity, unit_price, given, item:item_id(name))';

/** "2 × Biryani, 1 × Tea" */
export function itemsSummary(order: OrderRow): string {
  return (order.order_items ?? []).map((line) => `${line.quantity} × ${line.item?.name ?? 'Item'}`).join(', ');
}

export async function listCanteens(): Promise<CanteenRow[]> {
  const { data, error } = await getSupabase().from('canteens').select('id, code, name, location').order('name');
  fail(error);
  return data ?? [];
}

export async function getCanteen(id: string): Promise<CanteenRow | null> {
  const { data, error } = await getSupabase().from('canteens').select('id, code, name, location').eq('id', id).maybeSingle();
  fail(error);
  return data;
}

export async function listMenu(canteenId: string, includeUnavailable = false): Promise<MenuItemRow[]> {
  let query = getSupabase().from('menu_items').select('id, canteen_id, name, price, category, veg, available').eq('canteen_id', canteenId);
  if (!includeUnavailable) query = query.eq('available', true);
  const { data, error } = await query.order('category').order('name');
  fail(error);
  return (data ?? []).map((item) => ({ ...item, price: Number(item.price) }));
}

export interface SlotOption extends CanteenSlotRow { taken: number }

/** Slots a customer can pick right now: start 15+ minutes out, end within 60 minutes (IST). */
export async function listPickableSlots(canteenId: string, dates: string[], now: Date = new Date()): Promise<SlotOption[]> {
  const supabase = getSupabase();
  const found: SlotOption[] = [];
  for (const date of dates) {
    const [slots, load] = await Promise.all([
      supabase.from('canteen_slots').select('id, canteen_id, slot_date, start_time, end_time, capacity').eq('canteen_id', canteenId).eq('slot_date', date).order('start_time'),
      supabase.rpc('canteen_slot_load', { p_canteen: canteenId, p_date: date }),
    ]);
    fail(slots.error);
    fail(load.error);
    const taken = new Map<string, number>((load.data ?? []).map((row: { slot_id: string; taken: number }) => [row.slot_id, row.taken]));
    for (const slot of (slots.data ?? []) as CanteenSlotRow[]) {
      if (isValidCanteenSlot(istInstant(slot.slot_date, slot.start_time), istInstant(slot.slot_date, slot.end_time), now)) {
        found.push({ ...slot, taken: taken.get(slot.id) ?? 0 });
      }
    }
  }
  return found;
}

export async function placeOrder(canteenId: string, slotId: string, items: { itemId: string; quantity: number }[]): Promise<OrderRow> {
  const { data, error } = await getSupabase().rpc('place_order', {
    p_canteen: canteenId,
    p_slot: slotId,
    p_items: items.map((item) => ({ item_id: item.itemId, quantity: item.quantity })),
  });
  fail(error);
  return data as OrderRow;
}

export async function listMyOrders(userId: string): Promise<OrderRow[]> {
  const { data, error } = await getSupabase().from('orders').select(ORDER_COLUMNS).eq('user_id', userId).order('created_at', { ascending: false }).limit(100);
  fail(error);
  return (data ?? []) as unknown as OrderRow[];
}

/** Orders of one canteen in the given statuses, oldest first (staff screens). */
export async function listCanteenOrders(canteenId: string, statuses: OrderStatusValue[]): Promise<OrderRow[]> {
  const { data, error } = await getSupabase().from('orders').select(ORDER_COLUMNS)
    .eq('canteen_id', canteenId).in('status', statuses).order('created_at').limit(300);
  fail(error);
  return (data ?? []) as unknown as OrderRow[];
}

export async function advanceOrder(orderId: string, to: OrderStatusValue): Promise<void> {
  const { error } = await getSupabase().rpc('advance_order', { p_id: orderId, p_to: to });
  fail(error);
}

export async function setItemGiven(itemId: string, given: boolean): Promise<void> {
  const { error } = await getSupabase().rpc('set_item_given', { p_item: itemId, p_given: given });
  fail(error);
}

export async function forfeitUnpaidOrders(): Promise<number> {
  const { data, error } = await getSupabase().rpc('forfeit_unpaid_orders');
  fail(error);
  return Number(data ?? 0);
}

/** Subscribes to every order change for one canteen. Returns the unsubscribe function. */
export function watchCanteenOrders(canteenId: string, onChange: () => void): () => void {
  const supabase = getSupabase();
  const channel = supabase.channel(`canteen-orders-${canteenId}-${Math.random().toString(36).slice(2, 8)}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `canteen_id=eq.${canteenId}` }, onChange)
    .subscribe();
  return () => { void supabase.removeChannel(channel); };
}

// ---- Manager: menu and slots -------------------------------------------------------------

export async function setItemAvailable(itemId: string, available: boolean): Promise<void> {
  const { error } = await getSupabase().from('menu_items').update({ available }).eq('id', itemId);
  fail(error);
}

export interface MenuItemInput { name: string; price: number; category: string; veg: boolean }

export async function saveMenuItem(canteenId: string, input: MenuItemInput, itemId?: string): Promise<void> {
  const supabase = getSupabase();
  const { error } = itemId
    ? await supabase.from('menu_items').update(input).eq('id', itemId)
    : await supabase.from('menu_items').insert({ ...input, canteen_id: canteenId, available: true });
  fail(error);
}

export async function listSlots(canteenId: string, date: string): Promise<SlotOption[]> {
  const supabase = getSupabase();
  const [slots, load] = await Promise.all([
    supabase.from('canteen_slots').select('id, canteen_id, slot_date, start_time, end_time, capacity').eq('canteen_id', canteenId).eq('slot_date', date).order('start_time'),
    supabase.rpc('canteen_slot_load', { p_canteen: canteenId, p_date: date }),
  ]);
  fail(slots.error);
  fail(load.error);
  const taken = new Map<string, number>((load.data ?? []).map((row: { slot_id: string; taken: number }) => [row.slot_id, row.taken]));
  return ((slots.data ?? []) as CanteenSlotRow[]).map((slot) => ({ ...slot, taken: taken.get(slot.id) ?? 0 }));
}

/** Creates 15-minute slots between two HH:mm times; existing slots are left alone. */
export async function createSlots(canteenId: string, date: string, from: string, to: string, capacity: number): Promise<number> {
  const toMinutes = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));
  const clock = (minutes: number) => `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}:00`;
  const rows = [];
  for (let start = toMinutes(from); start + 15 <= toMinutes(to); start += 15) {
    rows.push({ canteen_id: canteenId, slot_date: date, start_time: clock(start), end_time: clock(start + 15), capacity });
  }
  if (!rows.length) return 0;
  const { error } = await getSupabase().from('canteen_slots').upsert(rows, { onConflict: 'canteen_id,slot_date,start_time,end_time', ignoreDuplicates: true });
  fail(error);
  return rows.length;
}

export async function updateSlotCapacity(slotId: string, capacity: number): Promise<void> {
  const { error } = await getSupabase().from('canteen_slots').update({ capacity }).eq('id', slotId);
  fail(error);
}

export async function deleteSlot(slotId: string): Promise<void> {
  const { error } = await getSupabase().from('canteen_slots').delete().eq('id', slotId);
  if (error) throw new Error(/foreign key|violates/i.test(error.message) ? 'This slot already has orders and cannot be deleted.' : error.message);
}
