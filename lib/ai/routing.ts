import { TICKET_CATEGORIES, type TicketCategory } from "../constants";

/**
 * Department codes seeded in supabase/seed.sql. Departments are data, so the
 * codes triage may return are listed here next to the routing that uses them.
 */
export const DEPARTMENT_CODES = ["ELEC", "IT", "HOSTEL", "ACAD", "CSE"] as const;
export type DepartmentCode = (typeof DEPARTMENT_CODES)[number];

/**
 * Which department handles each category, matching the seeded tickets. One
 * config object, so moving a category to another department is a data change.
 */
export const CATEGORY_DEPARTMENT: Record<TicketCategory, DepartmentCode> = {
  [TICKET_CATEGORIES.ELECTRICAL]: "ELEC",
  [TICKET_CATEGORIES.NETWORK]: "IT",
  [TICKET_CATEGORIES.AV_EQUIPMENT]: "IT",
  [TICKET_CATEGORIES.PLUMBING]: "HOSTEL",
  [TICKET_CATEGORIES.FURNITURE]: "HOSTEL",
  [TICKET_CATEGORIES.CLEANLINESS]: "HOSTEL",
  [TICKET_CATEGORIES.HOSTEL]: "HOSTEL",
  [TICKET_CATEGORIES.OTHER]: "ACAD",
};
