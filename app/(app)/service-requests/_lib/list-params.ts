import { z } from "zod";
import { TICKET_CATEGORIES, TICKET_PRIORITIES, TICKET_STATUSES } from "../_stubs/constants";
import type { TicketListItem } from "../_stubs/db";

export const SORT_KEYS = ["code", "title", "category", "location", "status", "priority", "created", "updated"] as const;
export type SortKey = (typeof SORT_KEYS)[number];
export type SortDir = "asc" | "desc";

const optionalEnum = <T extends readonly [string, ...string[]]>(values: T) =>
  z.enum(values).optional().catch(undefined);

/** Parses list filters from the URL. Unknown values are ignored instead of failing the page. */
export const listParamsSchema = z.object({
  status: optionalEnum(TICKET_STATUSES),
  category: optionalEnum(TICKET_CATEGORIES),
  priority: optionalEnum(TICKET_PRIORITIES),
  building: z.string().max(64).optional().catch(undefined),
  sort: optionalEnum(SORT_KEYS),
  dir: z.enum(["asc", "desc"]).optional().catch(undefined),
});
export type ListParams = z.infer<typeof listParamsSchema>;

const PRIORITY_RANK = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 } as const;

function sortValue(ticket: TicketListItem, key: SortKey): string | number {
  switch (key) {
    case "location":
      return `${ticket.building_name} ${ticket.room_name ?? ""}`.toLowerCase();
    case "priority":
      return PRIORITY_RANK[ticket.priority];
    case "created":
      return ticket.created_at;
    case "updated":
      return ticket.updated_at;
    case "title":
      return ticket.title.toLowerCase();
    default:
      return ticket[key];
  }
}

export function sortTickets(tickets: TicketListItem[], key: SortKey, dir: SortDir): TicketListItem[] {
  const factor = dir === "asc" ? 1 : -1;
  return [...tickets].sort((a, b) => {
    const left = sortValue(a, key);
    const right = sortValue(b, key);
    return left < right ? -factor : left > right ? factor : 0;
  });
}

/** Builds a list URL that keeps the current filters and changes only what is given. */
export function listHref(path: string, params: ListParams, change: Partial<ListParams>): string {
  const merged = { ...params, ...change };
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(merged)) {
    if (value) query.set(key, String(value));
  }
  const text = query.toString();
  return text ? `${path}?${text}` : path;
}
