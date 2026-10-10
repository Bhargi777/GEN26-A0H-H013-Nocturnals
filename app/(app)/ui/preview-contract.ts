// Local contract stub. Replace these exports with Dev 1's shared constants/types.
export const ROLES = { student: "student", faculty: "faculty", technician: "technician", deptAdmin: "dept_admin", officeStaff: "office_staff", admin: "admin" } as const;
export type Role = typeof ROLES[keyof typeof ROLES];
export const TICKET_STATUS = { open: "OPEN", assigned: "ASSIGNED", inProgress: "IN_PROGRESS", resolved: "RESOLVED", closed: "CLOSED", reopened: "REOPENED" } as const;
export const REQUEST_STATUS = { pendingDept: "PENDING_DEPT", pendingOffice: "PENDING_OFFICE", approved: "APPROVED", rejected: "REJECTED" } as const;
export type TicketStatus = typeof TICKET_STATUS[keyof typeof TICKET_STATUS];
export type RequestStatus = typeof REQUEST_STATUS[keyof typeof REQUEST_STATUS];
export type Status = TicketStatus | RequestStatus;
export const CATEGORIES = ["ELECTRICAL", "NETWORK", "AV_EQUIPMENT", "PLUMBING", "FURNITURE", "CLEANLINESS", "HOSTEL", "OTHER"] as const;
export const ROLE_LABELS: Record<Role, string> = {
  [ROLES.student]: "Student", [ROLES.faculty]: "Faculty", [ROLES.technician]: "Technician",
  [ROLES.deptAdmin]: "Department administrator", [ROLES.officeStaff]: "Office staff", [ROLES.admin]: "Administrator",
};
export const STATUS_LABELS: Record<Status, string> = {
  [TICKET_STATUS.open]: "Open", [TICKET_STATUS.assigned]: "Assigned", [TICKET_STATUS.inProgress]: "In progress",
  [TICKET_STATUS.resolved]: "Resolved", [TICKET_STATUS.closed]: "Closed", [TICKET_STATUS.reopened]: "Reopened",
  [REQUEST_STATUS.pendingDept]: "Pending department", [REQUEST_STATUS.pendingOffice]: "Pending office",
  [REQUEST_STATUS.approved]: "Approved", [REQUEST_STATUS.rejected]: "Rejected",
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
