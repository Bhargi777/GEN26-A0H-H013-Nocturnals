/* eslint-disable @typescript-eslint/no-explicit-any -- legacy module: typed rewrite pending */
// Event request data layer (Module B)
import { createClient } from '../supabase/client';
import { Database, EventRequest, Club } from '../types/database';

// Browser client carries the signed-in session so RLS applies to every query.
const supabase = createClient() as any;

/**
 * The event pages were written against friendlier field names than the table uses.
 * Reads add those names on top of the real columns; writes below map them back.
 */
function normalize(row: any): any {
  if (!row) return row;
  return {
    ...row,
    event_name: row.title,
    theme: row.event_type,
    category: row.event_type,
    proposed_date: row.event_date,
    attendees: row.expected_attendance,
    budget: row.budget_estimate,
    token: row.code,
  };
}

/**
 * Get clubs for a user (club presidents)
 */
export async function getClubsForUser(userId: string): Promise<Club[]> {
  const { data, error } = await supabase
    .from('clubs')
    .select('*');

  if (error) throw error;
  return (data || []).map(normalize);
}

/**
 * Create an event request
 */
export async function createEventRequest(params: {
  club_id: string;
  event_name: string;
  theme: string;
  description?: string;
  proposed_date: string;
  start_time: string;
  end_time: string;
  hall_id?: string | null;
  faculty_coordinator?: string;
  contact_phone?: string;
  attendees?: number;
  budget?: number;
  category?: string;
  poster_url?: string | null;
}): Promise<EventRequest & { token?: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('event_requests')
    .insert({
      club_id: params.club_id,
      requested_by: user.id,
      title: params.event_name,
      event_type: params.category || params.theme || 'other',
      description: [params.theme, params.description].filter(Boolean).join(' - ') || params.event_name,
      event_date: params.proposed_date,
      start_time: params.start_time,
      end_time: params.end_time,
      hall_id: params.hall_id,
      faculty_coordinator: params.faculty_coordinator,
      contact_phone: params.contact_phone,
      expected_attendance: params.attendees || 0,
      budget_estimate: params.budget || 0,
      form_pdf_path: params.poster_url || null,
      status: 'SUBMITTED',
    })
    .select()
    .single();

  if (error) throw error;

  // The database assigns the EV-###### reference.
  return normalize(data);
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
  return (data || []).map(normalize);
}

/**
 * Get all event requests for OSA review
 */
export async function getEventRequestsForOSA(): Promise<EventRequest[]> {
  const { data, error } = await supabase
    .from('event_requests')
    .select('*')
    .in('status', ['SUBMITTED', 'CHANGES_REQUESTED', 'PENDING_DIRECTOR'])
    .order('created_at');

  if (error) throw error;
  return (data || []).map(normalize);
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
  return (data || []).map(normalize);
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
  return (data || []).map(normalize);
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
  return normalize(data);
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
  return normalize(data);
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
  return normalize(data);
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
    .update({ status: 'CHANGES_REQUESTED', decision_note: reason })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return normalize(data);
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
  return normalize(data);
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
    .update({ status: 'REJECTED', decision_note: reason })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return normalize(data);
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
  return normalize(data);
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
  return normalize(data);
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
