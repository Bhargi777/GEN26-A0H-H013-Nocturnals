import { getSupabase } from '../supabase/browser';
import type { AcademicCalendarEvent, CalendarEvent } from '../types/campus';

/** Events the campus director has approved, visible to everyone who is signed in. */
export async function listCalendar(from: string, to: string): Promise<CalendarEvent[]> {
  const { data, error } = await getSupabase().rpc('campus_calendar', { p_from: from, p_to: to });
  if (error) throw new Error(error.message);
  return (data ?? []) as CalendarEvent[];
}

/** All-day academic dates, visible to everyone who is signed in. */
export async function listAcademicCalendar(from: string, to: string): Promise<AcademicCalendarEvent[]> {
  const query = new URLSearchParams({ from, to });
  const response = await fetch(`/api/academic-calendar?${query}`);
  if (!response.ok) throw new Error(`Academic calendar request failed (${response.status}).`);
  return await response.json() as AcademicCalendarEvent[];
}
