// Event request data layer (Module B).
// Status moves are checked in the database by the event_request_guard trigger, so these
// helpers only issue the update; a wrong role or wrong state comes back as an error message.
import type { PostgrestFilterBuilder } from '@supabase/postgrest-js';
import { getSupabase } from '../supabase/browser';
import type { ClubRow, EventRow, HallRow } from '../types/campus';

function fail(error: { message: string } | null): asserts error is null {
  if (error) {
    throw new Error(/no_hall_overlap|conflicting key/i.test(error.message)
      ? 'Another approved event already uses this hall at that time.'
      : error.message);
  }
}

const EVENT_COLUMNS =
  'id, code, title, event_type, description, event_date, start_time, end_time, expected_attendance, budget_estimate, ' +
  'faculty_coordinator, contact_phone, decision_note, status, created_at, club:club_id(name), hall:hall_id(name, latitude, longitude)';

type EventQuery = PostgrestFilterBuilder<any, any, any, any, any, any, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

async function select(filter: (query: EventQuery) => PromiseLike<{ data: unknown; error: { message: string } | null }>): Promise<EventRow[]> {
  const { data, error } = await filter(getSupabase().from('event_requests').select(EVENT_COLUMNS) as unknown as EventQuery);
  fail(error);
  return (data ?? []) as EventRow[];
}

export async function listClubs(): Promise<ClubRow[]> {
  const { data, error } = await getSupabase().from('clubs').select('id, code, name').order('name');
  fail(error);
  return data ?? [];
}

export async function listHalls(): Promise<HallRow[]> {
  const { data, error } = await getSupabase().from('rooms').select('id, name, capacity, latitude, longitude').eq('kind', 'hall').eq('bookable', true).order('name');
  fail(error);
  return data ?? [];
}

export interface EventInput {
  club_id: string;
  title: string;
  event_type: string;
  description: string;
  event_date: string;
  start_time: string;
  end_time: string;
  hall_id: string;
  expected_attendance: number;
  budget_estimate: number;
  faculty_coordinator: string;
  contact_phone: string;
}

export async function createEventRequest(input: EventInput): Promise<EventRow> {
  const supabase = getSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Sign in to request an event.');
  const { data, error } = await supabase.from('event_requests')
    .insert({ ...input, requested_by: user.id, status: 'SUBMITTED' }).select(EVENT_COLUMNS).single();
  fail(error);
  return data as unknown as EventRow;
}

export const getMyEventRequests = (userId: string) => select((q) => q.eq('requested_by', userId).order('created_at', { ascending: false }));
export const getEventRequestsForOSA = () => select((q) => q.in('status', ['SUBMITTED', 'CHANGES_REQUESTED', 'PENDING_DIRECTOR']).order('created_at'));
export const getEventRequestsForDirector = () => select((q) => q.eq('status', 'PENDING_DIRECTOR').order('created_at'));
export const getApprovedEventRequests = () => select((q) => q.eq('status', 'APPROVED').order('event_date'));

async function move(id: string, patch: Record<string, string | null>): Promise<void> {
  const { error } = await getSupabase().from('event_requests').update(patch).eq('id', id);
  fail(error);
}

export const osaApproveEventRequest = (id: string) => move(id, { status: 'PENDING_DIRECTOR', decision_note: null });
export const osaRejectEventRequest = (id: string, reason: string) => move(id, { status: 'REJECTED', decision_note: reason });
export const osaRequestChanges = (id: string, reason: string) => move(id, { status: 'CHANGES_REQUESTED', decision_note: reason });
export const directorApproveEventRequest = (id: string) => move(id, { status: 'APPROVED', decision_note: null });
export const directorRejectEventRequest = (id: string, reason: string) => move(id, { status: 'REJECTED', decision_note: reason });
export const markEventCalendared = (id: string) => move(id, { status: 'CALENDARED' });
export const resubmitEventRequest = (id: string) => move(id, { status: 'SUBMITTED' });
