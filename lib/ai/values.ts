import {
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
  type TicketCategory,
  type TicketPriority,
} from "../constants";

/** The shared category and priority constants as tuples, for z.enum and lists. */
export const CATEGORY_VALUES = Object.values(TICKET_CATEGORIES) as [
  TicketCategory,
  ...TicketCategory[],
];
export const PRIORITY_VALUES = Object.values(TICKET_PRIORITIES) as [
  TicketPriority,
  ...TicketPriority[],
];
