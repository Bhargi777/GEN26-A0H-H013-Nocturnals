// Canteen ordering data layer (Module D)
import { createClient } from '@supabase/supabase-js';
import { Database, Canteen, MenuItem, CanteenSlot, Order, OrderItem } from '../types/database';

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
) as any;

/**
 * Get all canteens
 */
export async function getCanteens(): Promise<Canteen[]> {
  const { data, error } = await supabase
    .from('canteens')
    .select('*')
    .order('name');

  if (error) throw error;
  return data || [];
}

/**
 * Get a canteen by ID
 */
export async function getCanteen(id: string): Promise<Canteen> {
  const { data, error } = await supabase
    .from('canteens')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  if (!data) throw new Error('Canteen not found');
  return data;
}

/**
 * Get menu items for a canteen (available only)
 */
export async function getMenuItems(canteenId: string, availableOnly = true): Promise<MenuItem[]> {
  let query = supabase
    .from('menu_items')
    .select('*')
    .eq('canteen_id', canteenId);

  if (availableOnly) {
    query = query.eq('available', true);
  }

  const { data, error } = await query.order('category').order('name');

  if (error) throw error;
  return data || [];
}

/**
 * Get all menu items for a canteen (including unavailable)
 */
export async function getAllMenuItems(canteenId: string): Promise<MenuItem[]> {
  const { data, error } = await supabase
    .from('menu_items')
    .select('*')
    .eq('canteen_id', canteenId)
    .order('category')
    .order('name');

  if (error) throw error;
  return data || [];
}

/**
 * Update menu item availability
 */
export async function toggleMenuItemAvailability(
  itemId: string,
  available: boolean
): Promise<MenuItem> {
  const { data, error } = await supabase
    .from('menu_items')
    .update({ available })
    .eq('id', itemId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get slots for a canteen on a specific date
 */
export async function getCanteenSlots(canteenId: string, date: string): Promise<CanteenSlot[]> {
  const { data, error } = await supabase
    .from('canteen_slots')
    .select('*')
    .eq('canteen_id', canteenId)
    .eq('slot_date', date)
    .order('start_time');

  if (error) throw error;
  return data || [];
}

/**
 * Create a canteen slot (admin/manager)
 */
export async function createCanteenSlot(
  canteenId: string,
  slotDate: string,
  startTime: string,
  endTime: string,
  capacity: number
): Promise<CanteenSlot> {
  const { data, error } = await supabase
    .from('canteen_slots')
    .insert({
      canteen_id: canteenId,
      slot_date: slotDate,
      start_time: startTime,
      end_time: endTime,
      capacity,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Create an order (checkout)
 * Returns the created order with token number
 */
export async function createOrder(
  canteenId: string,
  userId: string,
  slotId: string,
  items: Array<{ itemId: string; quantity: number }>,
  total: number
): Promise<{ order: Order; token: string }> {
  // Generate token: per canteen per day (e.g., C2-047)
  const canteen = await getCanteen(canteenId);
  const canteenCode = canteen.code.charAt(0);

  const { count } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('canteen_id', canteenId)
    .gte('created_at', new Date().toISOString().split('T')[0]);

  const tokenNum = ((count || 0) + 1).toString().padStart(3, '0');
  const token = `${canteenCode}${tokenNum}`;
  const code = `ORD-${Date.now()}`; // Simple code format

  const { data: orderData, error: orderError } = await supabase
    .from('orders')
    .insert({
      code,
      token,
      canteen_id: canteenId,
      user_id: userId,
      slot_id: slotId,
      total,
      status: 'PLACED',
    })
    .select()
    .single();

  if (orderError) throw orderError;

  // Insert order items
  for (const item of items) {
    const { data: menuItem } = await supabase
      .from('menu_items')
      .select('price')
      .eq('id', item.itemId)
      .single();

    const { error: itemError } = await supabase
      .from('order_items')
      .insert({
        order_id: orderData.id,
        item_id: item.itemId,
        quantity: item.quantity,
        unit_price: menuItem?.price || 0,
      });

    if (itemError) throw itemError;
  }

  return { order: orderData, token };
}

/**
 * Get orders for a student
 */
export async function getMyOrders(userId: string): Promise<(Order & { items: OrderItem[] })[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as any;
}

/**
 * Get order by token (for counter search)
 */
export async function getOrderByToken(token: string): Promise<Order & { items: OrderItem[] }> {
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('token', token)
    .single();

  if (error) throw error;
  if (!data) throw new Error('Order not found');
  return data as any;
}

/**
 * Get orders for a canteen (kitchen view)
 */
export async function getOrdersForCanteen(
  canteenId: string,
  slotDate: string
): Promise<(Order & { items: OrderItem[] })[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('canteen_id', canteenId)
    .gte('created_at', `${slotDate}T00:00:00`)
    .lt('created_at', `${slotDate}T23:59:59`)
    .in('status', ['PLACED', 'PAID'])
    .order('created_at');

  if (error) throw error;
  return (data || []) as any;
}

/**
 * Mark order as paid (counter action)
 */
export async function markOrderPaid(orderId: string): Promise<Order> {
  const { data, error } = await supabase
    .from('orders')
    .update({ status: 'PAID', paid_at: new Date().toISOString() })
    .eq('id', orderId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Mark order as collected (counter action)
 */
export async function markOrderCollected(orderId: string): Promise<Order> {
  const { data, error } = await supabase
    .from('orders')
    .update({ status: 'COLLECTED', collected_at: new Date().toISOString() })
    .eq('id', orderId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Mark order as forfeited (slot ended, not paid)
 * Runs as background job per slot
 */
export async function forfeitUnpaidOrders(slotId: string): Promise<Order[]> {
  const { data, error } = await supabase
    .from('orders')
    .update({ status: 'FORFEITED' })
    .eq('slot_id', slotId)
    .eq('status', 'PLACED')
    .select();

  if (error) throw error;
  return data || [];
}

/**
 * Get current slot's order totals by item (for kitchen)
 */
export async function getSlotItemTotals(
  slotId: string
): Promise<Array<{ itemName: string; quantity: number }>> {
  const { data, error } = await supabase
    .from('order_items')
    .select('item_id, quantity')
    .in(
      'order_id',
      (
        await supabase
          .from('orders')
          .select('id')
          .eq('slot_id', slotId)
          .in('status', ['PLACED', 'PAID'])
      ).data?.map((o: any) => o.id) || []
    );

  if (error) throw error;

  const totals = new Map<string, number>();
  for (const item of data || []) {
    const { data: menuItem } = await supabase
      .from('menu_items')
      .select('name')
      .eq('id', item.item_id)
      .single();

    if (menuItem) {
      totals.set(
        menuItem.name,
        (totals.get(menuItem.name) || 0) + item.quantity
      );
    }
  }

  return Array.from(totals, ([itemName, quantity]) => ({ itemName, quantity }));
}
