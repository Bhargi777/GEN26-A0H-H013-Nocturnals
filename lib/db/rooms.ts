// Room booking data layer (Module A).
// Reads go through RLS-protected selects; writes go through RPCs that check role,
// date window, capacity and double booking in the database.
import { getSupabase } from '../supabase/browser';
import type { BlockRow, FloorRow, PeriodRow, PlanState, RoomBookingRow, RoomRow, SlotStatusRow } from '../types/campus';

function fail(error: { message: string } | null): asserts error is null {
  if (error) throw new Error(error.message);
}

const BOOKING_COLUMNS =
  'id, code, room_id, date, period_id, requested_by, reason, faculty_name, attendees, status, decision_note, created_at, ' +
  'room:room_id(name, code, capacity, floor:floor_id(block:block_id(name, owner:owner_department_id(name)))), period:period_id(label, start_time, end_time), requester:requested_by(full_name)';

export async function listBlocks(): Promise<BlockRow[]> {
  const { data, error } = await getSupabase().from('blocks').select('id, code, name, owner_department_id').order('name');
  fail(error);
  return data ?? [];
}

export async function listFloors(blockId: string): Promise<FloorRow[]> {
  const { data, error } = await getSupabase().from('floors').select('id, block_id, level, label, grid_cols, grid_rows').eq('block_id', blockId).order('level');
  fail(error);
  return data ?? [];
}

/** Every room on the floor, including closed ones, so the plan shows the whole layout. */
export async function listFloorRooms(floorId: string): Promise<RoomRow[]> {
  const { data, error } = await getSupabase()
    .from('rooms').select('id, floor_id, code, name, kind, capacity, bookable, grid_x, grid_y, grid_w, grid_h')
    .eq('floor_id', floorId).order('grid_y').order('grid_x');
  fail(error);
  return data ?? [];
}

export async function listPeriods(): Promise<PeriodRow[]> {
  const { data, error } = await getSupabase().from('periods').select('id, label, start_time, end_time').order('start_time');
  fail(error);
  return data ?? [];
}

/** State of every period for one room and date: CLASS, BOOKED, PENDING (a request exists) or FREE. */
export async function getSlotStatus(roomId: string, date: string): Promise<SlotStatusRow[]> {
  const { data, error } = await getSupabase().rpc('room_slot_status', { p_room: roomId, p_date: date });
  fail(error);
  return data ?? [];
}

/** State of every room on a floor for one date and period (floor plan colours). */
export async function getFloorAvailability(floorId: string, date: string, periodId: string): Promise<Record<string, PlanState>> {
  const { data, error } = await getSupabase().rpc('floor_availability', { p_floor: floorId, p_date: date, p_period: periodId });
  fail(error);
  return Object.fromEntries((data ?? []).map((row: { room_id: string; state: PlanState }) => [row.room_id, row.state]));
}

export interface BookingInput {
  roomId: string;
  date: string;
  periodId: string;
  reason: string;
  facultyName: string;
  attendees: number;
}

export async function requestRoomBooking(input: BookingInput): Promise<RoomBookingRow> {
  const { data, error } = await getSupabase().rpc('request_room_booking', {
    p_room: input.roomId,
    p_date: input.date,
    p_period: input.periodId,
    p_reason: input.reason,
    p_faculty_name: input.facultyName,
    p_attendees: input.attendees,
  });
  fail(error);
  return data as RoomBookingRow;
}

export async function getMyRoomBookings(userId: string): Promise<RoomBookingRow[]> {
  const { data, error } = await getSupabase()
    .from('room_bookings').select(BOOKING_COLUMNS).eq('requested_by', userId).order('created_at', { ascending: false });
  fail(error);
  return (data ?? []) as unknown as RoomBookingRow[];
}

export async function cancelRoomBooking(bookingId: string): Promise<void> {
  const { error } = await getSupabase().rpc('cancel_room_booking', { p_id: bookingId });
  fail(error);
}

/** Bookings the signed-in department staff may see (RLS limits them to blocks their department owns). */
export async function getDepartmentBookings(): Promise<RoomBookingRow[]> {
  const { data, error } = await getSupabase()
    .from('room_bookings').select(BOOKING_COLUMNS).order('date').order('created_at');
  fail(error);
  return (data ?? []) as unknown as RoomBookingRow[];
}

/** Approving also rejects competing pending requests for the same slot. */
export async function decideRoomBooking(bookingId: string, approve: boolean, note?: string): Promise<void> {
  const { error } = await getSupabase().rpc('decide_room_booking', { p_id: bookingId, p_approve: approve, p_note: note ?? null });
  fail(error);
}

/** Pending requests that share a room, date and period with another pending request. */
export function findConflicts(bookings: RoomBookingRow[]): Set<string> {
  const groups = new Map<string, string[]>();
  for (const booking of bookings) {
    if (booking.status !== 'PENDING') continue;
    const key = `${booking.room_id}|${booking.date}|${booking.period_id}`;
    groups.set(key, [...(groups.get(key) ?? []), booking.id]);
  }
  const conflicted = new Set<string>();
  for (const ids of groups.values()) if (ids.length > 1) ids.forEach((id) => conflicted.add(id));
  return conflicted;
}

export interface RoomSuggestion {
  room_id: string; room_name: string; room_code: string; floor_id: string; block_id: string;
  block_name: string; floor_label: string; capacity: number;
}

/** Free rooms that fit the group, tightest fit first. */
export async function suggestRooms(date: string, periodId: string, attendees: number): Promise<RoomSuggestion[]> {
  const { data, error } = await getSupabase().rpc('suggest_rooms', { p_date: date, p_period: periodId, p_attendees: attendees });
  fail(error);
  return data ?? [];
}

export interface ClassEntry {
  id: string; weekday: number; course: string; section: string; faculty_name: string;
  room: { name: string; code: string } | null; period: { label: string; start_time: string; end_time: string } | null;
}

export async function listMyClasses(facultyName: string): Promise<ClassEntry[]> {
  const { data, error } = await getSupabase().from('timetable_entries')
    .select('id, weekday, course, section, faculty_name, room:room_id(name, code), period:period_id(label, start_time, end_time)')
    .eq('faculty_name', facultyName).order('weekday');
  fail(error);
  return (data ?? []) as unknown as ClassEntry[];
}

export async function listCancellations(entryIds: string[]): Promise<{ timetable_entry_id: string; date: string }[]> {
  if (!entryIds.length) return [];
  const { data, error } = await getSupabase().from('class_cancellations').select('timetable_entry_id, date').in('timetable_entry_id', entryIds);
  fail(error);
  return data ?? [];
}

export async function cancelClass(entryId: string, date: string, reason: string): Promise<void> {
  const { error } = await getSupabase().rpc('cancel_class', { p_entry: entryId, p_date: date, p_reason: reason });
  fail(error);
}
