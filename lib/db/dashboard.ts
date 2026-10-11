import type { Profile } from "@/app/(app)/ui/preview-contract";
import { ROLES } from "@/lib/constants/roles";
import { getSupabase } from "@/lib/supabase/browser";
import { nowIST } from "@/lib/time";
import { format } from "date-fns";
import type { DashboardBooking, DashboardData, DashboardEvent, DashboardOrder, DashboardTicket } from "@/lib/types/campus";

const LIMIT = 200;

/** Loads only the tables the role's dashboard shows. RLS decides which rows come back. */
export async function loadDashboardData(profile: Profile): Promise<DashboardData> {
  const supabase = getSupabase();
  const data: DashboardData = { tickets: [], bookings: [], events: [], orders: [], unavailableItems: 0 };
  const role = profile.role;
  const jobs: PromiseLike<unknown>[] = [];
  const run = <T,>(query: PromiseLike<{ data: T[] | null; error: { message: string } | null }>, assign: (rows: T[]) => void) =>
    jobs.push(query.then(({ data: rows, error }) => { if (error) throw new Error(error.message); assign(rows ?? []); }));

  const ticketCols = "id, code, title, status, created_at, requester_id, assigned_department_id";
  const ownTickets = () => run(supabase.from("service_tickets").select(ticketCols).eq("requester_id", profile.id).order("created_at", { ascending: false }).limit(LIMIT), (rows: DashboardTicket[]) => { data.tickets = rows; });
  const departmentTickets = () => profile.department_id
    ? run(supabase.from("service_tickets").select(ticketCols).eq("assigned_department_id", profile.department_id).order("created_at").limit(LIMIT), (rows: DashboardTicket[]) => { data.tickets = rows; })
    : undefined;
  const bookings = (own: boolean) => {
    let query = supabase.from("room_bookings").select("id, code, status, created_at, date, room:room_id(name)").order("created_at", { ascending: false }).limit(LIMIT);
    if (own) query = query.eq("requested_by", profile.id);
    run(query, (rows: unknown[]) => { data.bookings = rows as DashboardBooking[]; });
  };
  const events = (own: boolean) => {
    let query = supabase.from("event_requests").select("id, code, title, status, created_at").order("created_at").limit(LIMIT);
    if (own) query = query.eq("requested_by", profile.id);
    run(query, (rows: DashboardEvent[]) => { data.events = rows; });
  };
  const orders = (own: boolean) => {
    const today = format(nowIST(), "yyyy-MM-dd");
    let query = supabase.from("orders").select("id, code, token, status, total, created_at").order("created_at", { ascending: !own }).limit(LIMIT);
    query = own ? query.eq("user_id", profile.id) : query.gte("created_at", `${today}T00:00:00+05:30`);
    run(query, (rows: DashboardOrder[]) => { data.orders = rows; });
  };

  switch (role) {
    case ROLES.STUDENT: ownTickets(); orders(true); break;
    case ROLES.FACULTY: case ROLES.CR: ownTickets(); bookings(true); break;
    case ROLES.CLUB_PRESIDENT: ownTickets(); events(true); break;
    case ROLES.TECHNICIAN: departmentTickets(); break;
    case ROLES.DEPT_OFFICE: case ROLES.DEPT_HEAD: departmentTickets(); bookings(false); break;
    case ROLES.EVENTS_DEPT: case ROLES.OSA: case ROLES.CAMPUS_DIRECTOR: events(false); break;
    case ROLES.CANTEEN_KITCHEN: case ROLES.CANTEEN_COUNTER: orders(false); break;
    case ROLES.CANTEEN_MANAGER:
      orders(false);
      if (profile.canteen_id) run(supabase.from("menu_items").select("id").eq("available", false).eq("canteen_id", profile.canteen_id), (rows: unknown[]) => { data.unavailableItems = rows.length; });
      break;
    case ROLES.ADMIN:
      bookings(false); events(false); orders(false);
      break;
  }
  await Promise.all(jobs);
  return data;
}
