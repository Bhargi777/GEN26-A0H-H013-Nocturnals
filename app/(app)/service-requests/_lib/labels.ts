import { CATEGORY_VALUES, PRIORITY_VALUES } from "@/lib/ai/values";
import {
  TICKET_STATUSES,
  type TicketCategory,
  type TicketPriority,
  type TicketStatus,
} from "@/lib/constants";

export { CATEGORY_VALUES, PRIORITY_VALUES };
export type { Role, TicketCategory, TicketPriority, TicketStatus } from "@/lib/constants";

export const STATUS_VALUES = Object.values(TICKET_STATUSES) as [TicketStatus, ...TicketStatus[]];

/** Statuses that count as open for duplicate detection and the staff queue. */
export const OPEN_TICKET_STATUSES: readonly TicketStatus[] = [
  TICKET_STATUSES.OPEN,
  TICKET_STATUSES.ASSIGNED,
  TICKET_STATUSES.IN_PROGRESS,
  TICKET_STATUSES.REOPENED,
];

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
