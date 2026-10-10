import { REQUEST_STATUS as R, ROLES, STATUS_LABELS, TICKET_STATUS as T, type AdminRequest, type Profile, type Status, type Ticket } from "../ui/preview-contract";

export interface DashboardRow { id: string; code: string; title: string; status: Status; created_at: string; href: string }
export interface DashboardModel {
  context: string;
  heading: string;
  stats: { label: string; value: number }[];
  rows: DashboardRow[];
  action: { label: string; href: string };
}
const unresolved = (ticket: Ticket) => ticket.status !== T.resolved && ticket.status !== T.closed;
const pending = (request: AdminRequest) => request.status === R.pendingDept || request.status === R.pendingOffice;
const ticketRow = (ticket: Ticket): DashboardRow => ({ ...ticket, href: `/service-requests/${ticket.id}` });
const requestRow = (request: AdminRequest): DashboardRow => ({ ...request, title: `${request.type === "BONAFIDE" ? "Bonafide certificate" : "No objection certificate"} · ${request.purpose}`, href: `/requests/${request.id}` });
const oldest = (rows: DashboardRow[]) => rows.sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at)).slice(0, 5);

export function dashboardFor(profile: Profile, tickets: Ticket[], requests: AdminRequest[]): DashboardModel {
  if (profile.role === ROLES.technician || profile.role === ROLES.deptAdmin) {
    const queue = tickets.filter((ticket) => ticket.assigned_department_id === profile.department_id);
    return { context: "Review your department's service queue.", heading: "Oldest unresolved tickets", stats: Object.values(T).map((status) => ({ label: STATUS_LABELS[status], value: queue.filter((ticket) => ticket.status === status).length })), rows: oldest(queue.filter(unresolved).map(ticketRow)), action: { label: "Open department queue", href: "/service-requests/queue" } };
  }
  if (profile.role === ROLES.officeStaff) {
    const queue = requests.filter((request) => request.status === R.pendingOffice);
    return { context: "Review certificates waiting for the office.", heading: "Oldest pending requests", stats: [{ label: "Waiting for review", value: queue.length }], rows: oldest(queue.map(requestRow)), action: { label: "Open office queue", href: "/office" } };
  }
  const isAdmin = profile.role === ROLES.admin;
  const ownTickets = isAdmin ? tickets : tickets.filter((ticket) => ticket.requester_id === profile.id);
  const ownRequests = isAdmin ? requests : requests.filter((request) => request.requester_id === profile.id);
  const rows = [...ownTickets.map(ticketRow), ...ownRequests.map(requestRow)].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at)).slice(0, 5);
  return {
    context: isAdmin ? "Track service requests and certificates across campus." : "Track your service requests and certificates.",
    heading: "Five most recent items",
    stats: [{ label: "Open service requests", value: ownTickets.filter(unresolved).length }, { label: "Pending certificates", value: ownRequests.filter(pending).length }],
    rows,
    action: isAdmin ? { label: "View reports", href: "/admin/reports" } : { label: "Report an issue", href: "/service-requests/new" },
  };
}
