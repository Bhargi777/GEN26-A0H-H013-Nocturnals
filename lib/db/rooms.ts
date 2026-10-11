// Room booking data layer (Module A)
import { createClient } from '../supabase/client';
import { Database, RoomBooking, Block, Floor, Period, Room } from '../types/database';

// Browser client carries the signed-in session so RLS applies to every query.
const supabase = createClient() as any;

/**
 * Get all blocks owned by a department (for dept_office)
 */
export async function getBlocksByDepartment(deptId: string): Promise<Block[]> {
  const { data, error } = await supabase
    .from('blocks')
    .select('*')
    .eq('owner_department_id', deptId);

  if (error) throw error;
  return data || [];
}

/**
 * Get all floors in a block
 */
export async function getFloorsByBlock(blockId: string): Promise<Floor[]> {
  const { data, error } = await supabase
    .from('floors')
    .select('*')
    .eq('block_id', blockId)
    .order('level');

  if (error) throw error;
  return data || [];
}

/**
 * Get all rooms on a floor
 */
export async function getRoomsByFloor(floorId: string): Promise<Room[]> {
  const { data, error } = await supabase
    .from('rooms')
    .select('*')
    .eq('floor_id', floorId);

  if (error) throw error;
  return data || [];
}

/**
 * Get all periods (timetable slots)
 */
export async function getPeriods(): Promise<Period[]> {
  const { data, error } = await supabase
    .from('periods')
    .select('*')
    .order('start_time');

  if (error) throw error;
  return data || [];
}

/**
 * Create a room booking request
 */
export async function createRoomBooking(
  roomId: string,
  date: string,
  periodId: string,
  requestedBy: string,
  reason: string,
  facultyName: string,
  attendees: number
): Promise<RoomBooking> {
  const { data, error } = await supabase
    .from('room_bookings')
    .insert({
      room_id: roomId,
      date,
      period_id: periodId,
      requested_by: requestedBy,
      reason,
      faculty_name: facultyName,
      attendees,
      status: 'PENDING',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get booking requests for a CR (own requests)
 */
export async function getMyRoomBookings(userId: string): Promise<RoomBooking[]> {
  const { data, error } = await supabase
    .from('room_bookings')
    .select('*')
    .eq('requested_by', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Get all booking requests for a date/period in a block (for dept_office "Requests by date" view)
 */
export async function getRoomBookingsByDateAndBlock(
  blockId: string,
  date: string
): Promise<(RoomBooking & { room: Room; period: Period })[]> {
  // This requires a join, so we fetch room_bookings for rooms in this block's floors
  const { data: floors } = await supabase
    .from('floors')
    .select('id')
    .eq('block_id', blockId);

  if (!floors || floors.length === 0) return [];

  const floorIds = floors.map((f: any) => f.id);

  const { data: bookings, error } = await supabase
    .from('room_bookings')
    .select('*, room:room_id(name, code, capacity), period:period_id(*)')
    .eq('date', date)
    .in('room_id', (await Promise.all(
      floorIds.map((fid: any) =>
        supabase.from('rooms').select('id').eq('floor_id', fid)
      )
    )).flatMap((r: any) => r.data?.map((x: any) => x.id) || []))
    .order('period_id');

  if (error) throw error;
  return (bookings || []) as any;
}

/**
 * Get conflicting bookings (for "Conflicts" tab in dept office)
 */
export async function getConflictingBookings(
  blockId: string,
  date: string,
  periodId: string
): Promise<RoomBooking[]> {
  // Fetch all rooms in the block, then find bookings on that date/period
  const { data: floors } = await supabase
    .from('floors')
    .select('id')
    .eq('block_id', blockId);

  if (!floors || floors.length === 0) return [];

  const floorIds = floors.map((f: any) => f.id);
  const roomIdsRes = await Promise.all(
    floorIds.map((fid: any) => supabase.from('rooms').select('id').eq('floor_id', fid))
  );
  const roomIds = roomIdsRes.flatMap((r: any) => r.data?.map((x: any) => x.id) || []);

  const { data, error } = await supabase
    .from('room_bookings')
    .select('*')
    .eq('date', date)
    .eq('period_id', periodId)
    .in('room_id', roomIds)
    .eq('status', 'PENDING');

  if (error) throw error;
  return data || [];
}

/**
 * Approve a room booking (dept_office action)
 * Auto-rejects competing requests with note "Slot allocated to another request"
 */
export async function approveRoomBooking(
  bookingId: string,
  decidedBy: string,
  decisionNote?: string
): Promise<RoomBooking> {
  // Get the booking to find conflicts
  const { data: booking } = await supabase
    .from('room_bookings')
    .select('*')
    .eq('id', bookingId)
    .single();

  if (!booking) throw new Error('Booking not found');

  // Auto-reject conflicting PENDING bookings
  const { error: rejectError } = await supabase
    .from('room_bookings')
    .update({
      status: 'REJECTED',
      decided_by: decidedBy,
      decision_note: 'Slot allocated to another request',
    })
    .eq('room_id', booking.room_id)
    .eq('date', booking.date)
    .eq('period_id', booking.period_id)
    .eq('status', 'PENDING')
    .neq('id', bookingId);

  if (rejectError) throw rejectError;

  // Approve this booking
  const { data, error } = await supabase
    .from('room_bookings')
    .update({
      status: 'APPROVED',
      decided_by: decidedBy,
      decision_note: decisionNote || null,
    })
    .eq('id', bookingId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Reject a room booking
 */
export async function rejectRoomBooking(
  bookingId: string,
  decidedBy: string,
  decisionNote: string
): Promise<RoomBooking> {
  const { data, error } = await supabase
    .from('room_bookings')
    .update({
      status: 'REJECTED',
      decided_by: decidedBy,
      decision_note: decisionNote,
    })
    .eq('id', bookingId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get room availability for a specific date/period.
 * Unavailable when a timetable class holds the room that weekday and period,
 * unless it was cancelled for that date, or a booking is pending or approved.
 */
export async function checkRoomAvailability(
  roomId: string,
  date: string,
  periodId: string
): Promise<boolean> {
  // Calendar weekday of the date, independent of the runtime's timezone (0=Sun).
  const weekday = new Date(`${date}T00:00:00Z`).getUTCDay();

  const { data: entry } = await supabase
    .from('timetable_entries')
    .select('id')
    .eq('room_id', roomId)
    .eq('weekday', weekday)
    .eq('period_id', periodId)
    .limit(1)
    .maybeSingle();

  if (entry) {
    const { data: cancelled } = await supabase
      .from('class_cancellations')
      .select('id')
      .eq('timetable_entry_id', entry.id)
      .eq('date', date)
      .limit(1)
      .maybeSingle();
    if (!cancelled) return false;
  }

  // Several pending requests can exist for one slot, so read at most one row.
  const { data: booking } = await supabase
    .from('room_bookings')
    .select('id')
    .eq('room_id', roomId)
    .eq('date', date)
    .eq('period_id', periodId)
    .in('status', ['APPROVED', 'PENDING'])
    .limit(1)
    .maybeSingle();

  return !booking;
}
