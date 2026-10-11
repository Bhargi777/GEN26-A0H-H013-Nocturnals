import { getSupabase } from '../supabase/browser';
import type { CalendarEvent } from '../types/campus';

/** Events the campus director has approved, visible to everyone who is signed in. */
export async function listCalendar(from: string, to: string): Promise<CalendarEvent[]> {
  const { data, error } = await getSupabase().rpc('campus_calendar', { p_from: from, p_to: to });
  if (error) throw new Error(error.message);
  return (data ?? []) as CalendarEvent[];
}
