import { getSupabase } from '../supabase/browser';

export interface CampusReport {
  tickets_by_category: { category: string; total: number; open: number; overdue: number; avg_hours: number | null }[];
  room_use_by_period: { period: string; approved: number; classes: number }[];
  room_requests: Record<string, number>;
  canteen_by_hour: { hour: number; orders: number }[];
  canteen_totals: { orders: number; revenue: number };
  events_by_status: Record<string, number>;
}

export async function loadCampusReport(): Promise<CampusReport> {
  const { data, error } = await getSupabase().rpc('campus_report');
  if (error) throw new Error(error.message);
  return data as CampusReport;
}
