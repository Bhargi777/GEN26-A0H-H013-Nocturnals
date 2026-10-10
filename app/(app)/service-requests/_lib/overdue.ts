import type { TicketPriority, TicketStatus } from "../_stubs/constants";

const HOUR_MS = 60 * 60 * 1000;

/**
 * How long a ticket may stay unresolved, by priority, counted from creation
 * until it is resolved. The single place to change response targets.
 */
export const OVERDUE_AFTER_HOURS: Record<TicketPriority, number> = {
  URGENT: 4,
  HIGH: 24,
  MEDIUM: 72,
  LOW: 7 * 24,
};

type OverdueFields = {
  priority: TicketPriority;
  status: TicketStatus;
  created_at: string;
  resolved_at: string | null;
};

/** The clock stops when the ticket is resolved; a reopened ticket's clock runs again. */
export function isOverdue(ticket: OverdueFields, now: number = Date.now()): boolean {
  const stopped =
    (ticket.status === "RESOLVED" || ticket.status === "CLOSED") && ticket.resolved_at;
  const end = stopped ? Date.parse(ticket.resolved_at as string) : now;
  return end - Date.parse(ticket.created_at) > OVERDUE_AFTER_HOURS[ticket.priority] * HOUR_MS;
}
