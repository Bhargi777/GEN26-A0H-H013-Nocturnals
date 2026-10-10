// TEMPORARY STUB. Mirrors the data contract in goals/00-team-rules.md section 5.
// Replace every import of this file with Dev 1's `lib/constants/*` once it lands
// on main, then delete this file.

export const ROLES = [
  "student",
  "faculty",
  "technician",
  "dept_admin",
  "office_staff",
  "admin",
] as const;
export type Role = (typeof ROLES)[number];

export const TICKET_STATUSES = [
  "OPEN",
  "ASSIGNED",
  "IN_PROGRESS",
  "RESOLVED",
  "CLOSED",
  "REOPENED",
] as const;
export type TicketStatus = (typeof TICKET_STATUSES)[number];

export const TICKET_CATEGORIES = [
  "ELECTRICAL",
  "NETWORK",
  "AV_EQUIPMENT",
  "PLUMBING",
  "FURNITURE",
  "CLEANLINESS",
  "HOSTEL",
  "OTHER",
] as const;
export type TicketCategory = (typeof TICKET_CATEGORIES)[number];

export const TICKET_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;
export type TicketPriority = (typeof TICKET_PRIORITIES)[number];

export const DEPARTMENT_CODES = ["ELEC", "NET", "CIVIL", "HOSTEL", "CSE"] as const;
export type DepartmentCode = (typeof DEPARTMENT_CODES)[number];

export const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
  OPEN: "Open",
  ASSIGNED: "Assigned",
  IN_PROGRESS: "In progress",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
  REOPENED: "Reopened",
};

export const TICKET_CATEGORY_LABELS: Record<TicketCategory, string> = {
  ELECTRICAL: "Electrical",
  NETWORK: "Network",
  AV_EQUIPMENT: "AV equipment",
  PLUMBING: "Plumbing",
  FURNITURE: "Furniture",
  CLEANLINESS: "Cleanliness",
  HOSTEL: "Hostel",
  OTHER: "Other",
};

export const TICKET_PRIORITY_LABELS: Record<TicketPriority, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  URGENT: "Urgent",
};

/** Statuses that count as "open" for duplicate detection and the staff queue. */
export const OPEN_TICKET_STATUSES: readonly TicketStatus[] = [
  "OPEN",
  "ASSIGNED",
  "IN_PROGRESS",
  "REOPENED",
];
