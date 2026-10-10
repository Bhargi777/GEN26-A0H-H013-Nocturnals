import { getPhotoUrl, getTicket, getTicketEvents } from "@/lib/db/service-requests";
import { TICKET_STATUSES, type TicketStatus } from "@/lib/constants";
import type { EventLog, ServiceTicket } from "@/lib/types";
import { getFollowers, getPeople, listBuildings, listDepartments, listRooms, resolveTicketId } from "./queries";

export type TicketListItem = ServiceTicket & {
  building_name: string;
  room_name: string | null;
  department_name: string | null;
  assignee_name: string | null;
};

/** Shaped like AuditEvent in components/ui so it can go straight to Timeline. */
export type TimelineEvent = {
  id: string;
  actor_id: string;
  actor_name?: string;
  action: string;
  from_status: TicketStatus | null;
  to_status: TicketStatus | null;
  note: string | null;
  created_at: string;
};

export type TicketDetail = TicketListItem & {
  requester_name: string | null;
  events: TimelineEvent[];
  followers_count: number;
  is_following: boolean;
  photo_url: string | null;
};

const STATUS_SET = new Set<string>(Object.values(TICKET_STATUSES));
const asStatus = (value: string | null): TicketStatus | null =>
  value && STATUS_SET.has(value) ? (value as TicketStatus) : null;

/** Adds building, room, department and assignee names to plain ticket rows. */
export async function withNames(tickets: ServiceTicket[]): Promise<TicketListItem[]> {
  if (tickets.length === 0) return [];
  const [buildings, rooms, departments, people] = await Promise.all([
    listBuildings(),
    listRooms(),
    listDepartments(),
    getPeople(tickets.map((t) => t.assigned_to ?? "")),
  ]);
  const name = <T extends { id: string; name: string }>(list: T[], id: string | null) =>
    list.find((item) => item.id === id)?.name ?? null;
  return tickets.map((ticket) => ({
    ...ticket,
    building_name: name(buildings, ticket.building_id) ?? "",
    room_name: name(rooms, ticket.room_id),
    department_name: name(departments, ticket.assigned_department_id),
    assignee_name: ticket.assigned_to ? (people.get(ticket.assigned_to) ?? null) : null,
  }));
}

/**
 * Turns database events into timeline entries. transition_ticket records the
 * new status in both status columns, and department moves record department
 * ids there, so only the new status is shown and moves are described in words.
 */
function toTimeline(
  ticket: ServiceTicket,
  events: EventLog[],
  people: Map<string, string>,
  departments: Map<string, string>,
): TimelineEvent[] {
  const reported: TimelineEvent = {
    id: `${ticket.id}-reported`,
    actor_id: ticket.requester_id,
    actor_name: people.get(ticket.requester_id),
    action: "Reported the issue",
    from_status: null,
    to_status: TICKET_STATUSES.OPEN,
    note: null,
    created_at: ticket.created_at,
  };
  const rest = events.map((event): TimelineEvent => {
    if (event.action === "CREATED") {
      return { ...reported, id: event.id, actor_name: people.get(event.actor_id), created_at: event.created_at };
    }
    const moved = event.action === "REASSIGN_DEPARTMENT";
    const toStatus = moved ? null : asStatus(event.to_status);
    return {
      id: event.id,
      actor_id: event.actor_id,
      actor_name: people.get(event.actor_id),
      action: moved
        ? `Sent to ${departments.get(event.to_status ?? "") ?? "another department"}`
        : toStatus
          ? "Changed the status"
          : event.action.toLowerCase().replace(/_/g, " "),
      from_status: null,
      to_status: toStatus,
      note: event.note,
      created_at: event.created_at,
    };
  });
  // No creation event is written when a ticket is inserted, so add one unless
  // the history already has it (the seeded demo story writes one).
  return events.some((event) => event.action === "CREATED") ? rest : [reported, ...rest];
}

export async function loadTicketDetail(codeOrId: string, viewerId: string): Promise<TicketDetail | null> {
  const id = await resolveTicketId(codeOrId);
  if (!id) return null;
  const ticket = await getTicket(id);
  if (!ticket) return null;

  const [[item], events, followers, departments] = await Promise.all([
    withNames([ticket]),
    getTicketEvents(ticket.id),
    getFollowers(ticket.id, viewerId),
    listDepartments(),
  ]);
  const people = await getPeople([ticket.requester_id, ...events.map((e) => e.actor_id)]);
  const photoUrl = ticket.photo_path ? await getPhotoUrl(ticket.photo_path).catch(() => null) : null;

  return {
    ...item,
    requester_name: people.get(ticket.requester_id) ?? null,
    events: toTimeline(ticket, events, people, new Map(departments.map((d) => [d.id, d.name]))),
    followers_count: followers.count,
    is_following: followers.following,
    photo_url: photoUrl,
  };
}
