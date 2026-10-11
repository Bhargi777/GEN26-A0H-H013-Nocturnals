// Shared UI contract. Roles come from the database enum via lib/constants/roles.
import { ROLES, type Role } from "@/lib/constants/roles";
export { ROLES, type Role };
export const TICKET_STATUS = { open: "OPEN", assigned: "ASSIGNED", inProgress: "IN_PROGRESS", resolved: "RESOLVED", closed: "CLOSED", reopened: "REOPENED" } as const;
export const REQUEST_STATUS = { pendingDept: "PENDING_DEPT", pendingOffice: "PENDING_OFFICE", approved: "APPROVED", rejected: "REJECTED" } as const;
export type TicketStatus = typeof TICKET_STATUS[keyof typeof TICKET_STATUS];
export type RequestStatus = typeof REQUEST_STATUS[keyof typeof REQUEST_STATUS];
export const MODULE_STATUS = {
  pending: "PENDING", cancelled: "CANCELLED", submitted: "SUBMITTED", changesRequested: "CHANGES_REQUESTED",
  pendingDirector: "PENDING_DIRECTOR", calendared: "CALENDARED", placed: "PLACED", paid: "PAID", ready: "READY",
  collected: "COLLECTED", forfeited: "FORFEITED", lateWalkin: "LATE_WALKIN",
} as const;
export type ModuleStatus = typeof MODULE_STATUS[keyof typeof MODULE_STATUS];
export type Status = TicketStatus | RequestStatus | ModuleStatus;
export const CATEGORIES = ["ELECTRICAL", "NETWORK", "AV_EQUIPMENT", "PLUMBING", "FURNITURE", "CLEANLINESS", "HOSTEL", "OTHER"] as const;
export const ROLE_LABELS: Record<Role, string> = {
  [ROLES.STUDENT]: "Student", [ROLES.FACULTY]: "Faculty", [ROLES.CR]: "Class representative",
  [ROLES.CLUB_PRESIDENT]: "Club president", [ROLES.TECHNICIAN]: "Technician", [ROLES.DEPT_OFFICE]: "Department office",
  [ROLES.DEPT_HEAD]: "Department head", [ROLES.EVENTS_DEPT]: "Events department", [ROLES.OSA]: "Student affairs (OSA)",
  [ROLES.CAMPUS_DIRECTOR]: "Campus director", [ROLES.CANTEEN_KITCHEN]: "Canteen kitchen", [ROLES.CANTEEN_COUNTER]: "Canteen counter",
  [ROLES.CANTEEN_MANAGER]: "Canteen manager", [ROLES.ADMIN]: "Administrator",
};
export const STATUS_LABELS: Record<Status, string> = {
  [TICKET_STATUS.open]: "Open", [TICKET_STATUS.assigned]: "Assigned", [TICKET_STATUS.inProgress]: "In progress",
  [TICKET_STATUS.resolved]: "Resolved", [TICKET_STATUS.closed]: "Closed", [TICKET_STATUS.reopened]: "Reopened",
  [REQUEST_STATUS.pendingDept]: "Pending department", [REQUEST_STATUS.pendingOffice]: "Pending office",
  [REQUEST_STATUS.approved]: "Approved", [REQUEST_STATUS.rejected]: "Rejected",
  [MODULE_STATUS.pending]: "Pending", [MODULE_STATUS.cancelled]: "Cancelled", [MODULE_STATUS.submitted]: "Submitted",
  [MODULE_STATUS.changesRequested]: "Changes requested", [MODULE_STATUS.pendingDirector]: "Pending director",
  [MODULE_STATUS.calendared]: "Calendared", [MODULE_STATUS.placed]: "Placed", [MODULE_STATUS.paid]: "Paid",
  [MODULE_STATUS.ready]: "Ready", [MODULE_STATUS.collected]: "Collected", [MODULE_STATUS.forfeited]: "Forfeited",
  [MODULE_STATUS.lateWalkin]: "Late walk-in",
};

export interface Profile { id: string; full_name: string; email: string; role: Role; department_id: string | null }
export interface Ticket {
  id: string; code: string; requester_id: string; title: string; category: typeof CATEGORIES[number];
  status: TicketStatus; assigned_department_id: string; created_at: string;
}
export interface AdminRequest {
  id: string; code: string; requester_id: string; type: "BONAFIDE" | "NOC"; purpose: string;
  status: RequestStatus; created_at: string;
}
export interface Notification {
  id: string; user_id: string; title: string; body: string; link: string; read_at: string | null; created_at: string;
}
export interface AuditEvent {
  id: string; actor_id: string; actor_name?: string; action: string;
  from_status: Status | null; to_status: Status | null; note: string | null; created_at: string;
}
