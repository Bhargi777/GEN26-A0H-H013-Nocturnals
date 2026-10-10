import { z } from "zod";
import { CATEGORY_VALUES, PRIORITY_VALUES, STATUS_VALUES } from "./labels";
import type { TicketListItem } from "./tickets";

const optionalEnum = <T extends readonly [string, ...string[]]>(values: T) =>
  z.enum(values).optional().catch(undefined);

/** Parses list filters from the URL. Unknown values are ignored instead of failing the page. */
export const listParamsSchema = z.object({
  status: optionalEnum(STATUS_VALUES),
  category: optionalEnum(CATEGORY_VALUES),
  priority: optionalEnum(PRIORITY_VALUES),
  building: z.string().max(64).optional().catch(undefined),
  /** Queue only: "all" also lists closed tickets. */
  show: z.enum(["active", "all"]).optional().catch(undefined),
});
export type ListParams = z.infer<typeof listParamsSchema>;

const PRIORITY_RANK = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 } as const;

/** Starting order for the queue: most urgent first, then oldest first. */
export function byPriorityThenAge(tickets: TicketListItem[]): TicketListItem[] {
  return [...tickets].sort(
    (a, b) =>
      PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] ||
      a.created_at.localeCompare(b.created_at),
  );
}

/** Starting order for the requester's list: most recently updated first. */
export function byLastUpdate(tickets: TicketListItem[]): TicketListItem[] {
  return [...tickets].sort((a, b) => b.updated_at.localeCompare(a.updated_at));
}
