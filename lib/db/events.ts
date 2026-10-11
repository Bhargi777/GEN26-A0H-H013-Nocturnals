// Event request data layer (Module B)
import { createClient } from '../supabase/client';
import { Database, EventRequest, Club } from '../types/database';

// Browser client carries the signed-in session so RLS applies to every query.
const supabase = createClient() as any;

/**
 * Get clubs for a user (club presidents)
 */
export async function getClubsForUser(userId: string): Promise<Club[]> {
  const { data, error } = await supabase
    .from('clubs')
    .select('*');

  if (error) throw error;
  return data || [];
}

/**
 * Create an event request
 */
export async function createEventRequest(
  clubId: string,
  requestedBy: string,
  title: string,
  description: string,
  eventType: string,
  eventDate: string,
  startTime: string,
  endTime: string,
  hallId: string,
  expectedAttendance: number,
  resourcesNeeded: string[],
  facultyCoordinator: string,
  contactPhone: string,
  budgetEstimate?: number
): Promise<EventRequest> {
  const { data, error } = await supabase
    .from('event_requests')
    .insert({
      club_id: clubId,
      requested_by: requestedBy,
      title,
      description,
      event_type: eventType,
      event_date: eventDate,
      start_time: startTime,
      end_time: endTime,
      hall_id: hallId,
      expected_attendance: expectedAttendance,
      resources_needed: resourcesNeeded,
      faculty_coordinator: facultyCoordinator,
      contact_phone: contactPhone,
      budget_estimate: budgetEstimate || null,
      status: 'SUBMITTED',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get events created by a club president
 */
export async function getMyEventRequests(userId: string): Promise<EventRequest[]> {
  const { data, error } = await supabase
    .from('event_requests')
    .select('*')
    .eq('requested_by', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Get all event requests for OSA review
 */
export async function getEventRequestsForOSA(): Promise<EventRequest[]> {
  const { data, error } = await supabase
    .from('event_requests')
    .select('*')
    .eq('status', 'SUBMITTED')
    .order('created_at');

  if (error) throw error;
  return data || [];
}

/**
 * Get event requests for campus director
 */
export async function getEventRequestsForDirector(): Promise<EventRequest[]> {
  const { data, error } = await supabase
    .from('event_requests')
    .select('*')
    .eq('status', 'PENDING_DIRECTOR')
    .order('created_at');

  if (error) throw error;
  return data || [];
}

/**
 * Get approved events for events_dept to mark calendared
 */
export async function getApprovedEventRequests(): Promise<EventRequest[]> {
  const { data, error } = await supabase
    .from('event_requests')
    .select('*')
    .eq('status', 'APPROVED')
    .order('event_date');

  if (error) throw error;
  return data || [];
}

/**
 * Get a single event request
 */
export async function getEventRequest(id: string): Promise<EventRequest> {
  const { data, error } = await supabase
    .from('event_requests')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  if (!data) throw new Error('Event request not found');
  return data;
}

/**
 * OSA approves or requests changes
 */
export async function osaApproveEventRequest(id: string): Promise<EventRequest> {
  const { data, error } = await supabase
    .from('event_requests')
    .update({ status: 'PENDING_DIRECTOR' })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * OSA rejects an event request
 */
export async function osaRejectEventRequest(
  id: string,
  reason: string
): Promise<EventRequest> {
  const { data, error } = await supabase
    .from('event_requests')
    .update({ status: 'REJECTED' })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * OSA requests changes
 */
export async function osaRequestChanges(
  id: string,
  reason: string
): Promise<EventRequest> {
  const { data, error } = await supabase
    .from('event_requests')
    .update({ status: 'CHANGES_REQUESTED' })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Director approves an event request
 */
export async function directorApproveEventRequest(id: string): Promise<EventRequest> {
  const { data, error } = await supabase
    .from('event_requests')
    .update({ status: 'APPROVED' })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Director rejects an event request
 */
export async function directorRejectEventRequest(
  id: string,
  reason: string
): Promise<EventRequest> {
  const { data, error } = await supabase
    .from('event_requests')
    .update({ status: 'REJECTED' })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Events dept marks event as calendared
 */
export async function markEventCalendared(id: string): Promise<EventRequest> {
  const { data, error } = await supabase
    .from('event_requests')
    .update({ status: 'CALENDARED' })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Club president resubmits after changes requested
 */
export async function resubmitEventRequest(id: string): Promise<EventRequest> {
  const { data, error } = await supabase
    .from('event_requests')
    .update({ status: 'SUBMITTED' })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Check for overlapping events in a hall
 */
export async function checkHallConflicts(
  hallId: string,
  eventDate: string,
  startTime: string,
  endTime: string
): Promise<EventRequest[]> {
  // This is a simplified check; production would use the exclusion constraint
  const { data, error } = await supabase
    .from('event_requests')
    .select('*')
    .eq('hall_id', hallId)
    .eq('event_date', eventDate)
    .in('status', ['PENDING_DIRECTOR', 'APPROVED', 'CALENDARED']);

  if (error) throw error;

  return (data || []).filter((event: any) => {
    // Check for time overlap
    return !(endTime <= event.start_time || startTime >= event.end_time);
  });
}
