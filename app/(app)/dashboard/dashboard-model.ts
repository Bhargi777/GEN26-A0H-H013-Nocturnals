import { smallestK } from "@/lib/algo/heap";
import { ROLES } from "@/lib/constants/roles";
import type { DashboardBooking, DashboardData, DashboardEvent, DashboardOrder, DashboardTicket } from "@/lib/types/campus";
import { STATUS_LABELS, TICKET_STATUS as T, type Profile, type Status } from "../ui/preview-contract";

export interface DashboardRow { id: string; code: string; title: string; status: Status; created_at: string; href: string }
export interface DashboardModel {
  context: string;
  heading: string;
  stats: { label: string; value: number }[];
  rows: DashboardRow[];
  action: { label: string; href: string };
}

export const emptyDashboardData: DashboardData = { tickets: [], bookings: [], events: [], orders: [], unavailableItems: 0 };

const unresolved = (ticket: DashboardTicket) => ticket.status !== T.resolved && ticket.status !== T.closed;
const count = <T,>(rows: T[], test: (row: T) => boolean) => rows.filter(test).length;
// Top five by age with a bounded heap: O(n log 5) instead of sorting every row.
const byAge = (rows: DashboardRow[], newestFirst: boolean) =>
  smallestK(rows, 5, (a, b) => (Date.parse(a.created_at) - Date.parse(b.created_at)) * (newestFirst ? -1 : 1));

const ticketRow = (ticket: DashboardTicket): DashboardRow => ({ id: ticket.id, code: ticket.code, title: ticket.title, status: ticket.status as Status, created_at: ticket.created_at, href: `/service-requests/${ticket.code}` });
const bookingRow = (booking: DashboardBooking, href: string): DashboardRow => ({ id: booking.id, code: booking.code, title: `${booking.room?.name ?? "Room"} · ${booking.date}`, status: booking.status, created_at: booking.created_at, href });
const eventRow = (event: DashboardEvent, href: string): DashboardRow => ({ id: event.id, code: event.code, title: event.title, status: event.status, created_at: event.created_at, href });
const orderRow = (order: DashboardOrder, href: string): DashboardRow => ({ id: order.id, code: order.code, title: `Token ${order.token} · ₹${order.total}`, status: order.status, created_at: order.created_at, href });

export function dashboardFor(profile: Pick<Profile, "role"> & { canteen_id?: string | null }, data: DashboardData): DashboardModel {
  const canteen = (screen: string) => (profile.canteen_id ? `/canteen/${profile.canteen_id}/${screen}` : "/dashboard");
  const { tickets, bookings, events, orders } = data;
  const openTickets = count(tickets, unresolved);
  const ticketStats = Object.values(T).map((status) => ({ label: STATUS_LABELS[status], value: count(tickets, (ticket) => ticket.status === status) }));
  const oldestTickets = byAge(tickets.filter(unresolved).map(ticketRow), false);
  const recentTickets = tickets.map(ticketRow);
  const activeOrder = (order: DashboardOrder) => order.status === "PLACED" || order.status === "PAID" || order.status === "READY";

  switch (profile.role) {
    case ROLES.STUDENT:
      return {
        context: "Track your service requests and canteen orders.", heading: "Five most recent items",
        stats: [{ label: "Open service requests", value: openTickets }, { label: "Active canteen orders", value: count(orders, activeOrder) }],
        rows: byAge([...recentTickets, ...orders.map((order) => orderRow(order, "/canteen/orders"))], true),
        action: { label: "Report an issue", href: "/service-requests/new" },
      };
    case ROLES.FACULTY:
    case ROLES.CR:
      return {
        context: "Track your room requests and service requests.", heading: "Five most recent items",
        stats: [
          { label: "Open service requests", value: openTickets },
          { label: "Pending room requests", value: count(bookings, (booking) => booking.status === "PENDING") },
          { label: "Approved room bookings", value: count(bookings, (booking) => booking.status === "APPROVED") },
        ],
        rows: byAge([...recentTickets, ...bookings.map((booking) => bookingRow(booking, "/rooms/my-requests"))], true),
        action: { label: "Book a room", href: "/rooms" },
      };
    case ROLES.CLUB_PRESIDENT:
      return {
        context: "Track your club's event requests.", heading: "Five most recent items",
        stats: [
          { label: "Open service requests", value: openTickets },
          { label: "Events in review", value: count(events, (event) => ["SUBMITTED", "PENDING_DIRECTOR", "CHANGES_REQUESTED"].includes(event.status)) },
          { label: "Approved events", value: count(events, (event) => event.status === "APPROVED" || event.status === "CALENDARED") },
        ],
        rows: byAge([...recentTickets, ...events.map((event) => eventRow(event, "/events/mine"))], true),
        action: { label: "Request an event", href: "/events/new" },
      };
    case ROLES.TECHNICIAN:
      return { context: "Review your department's service queue.", heading: "Oldest unresolved tickets", stats: ticketStats, rows: oldestTickets, action: { label: "Open department queue", href: "/service-requests/queue" } };
    case ROLES.DEPT_OFFICE:
    case ROLES.DEPT_HEAD: {
      const pending = bookings.filter((booking) => booking.status === "PENDING");
      return {
        context: "Review room requests and your department's service queue.", heading: "Oldest items waiting for you",
        stats: [{ label: "Pending room requests", value: pending.length }, { label: "Unresolved tickets", value: openTickets }, { label: "Approved room bookings", value: count(bookings, (booking) => booking.status === "APPROVED") }],
        rows: byAge([...oldestTickets, ...pending.map((booking) => bookingRow(booking, "/rooms/dept"))], false),
        action: profile.role === ROLES.DEPT_OFFICE ? { label: "Review room requests", href: "/rooms/dept" } : { label: "Open department queue", href: "/service-requests/queue" },
      };
    }
    case ROLES.OSA: {
      const queue = events.filter((event) => event.status === "SUBMITTED");
      return {
        context: "Review event requests from clubs.", heading: "Oldest submitted events",
        stats: [{ label: "Waiting for review", value: queue.length }, { label: "Changes requested", value: count(events, (event) => event.status === "CHANGES_REQUESTED") }, { label: "Sent to director", value: count(events, (event) => event.status === "PENDING_DIRECTOR") }],
        rows: byAge(queue.map((event) => eventRow(event, "/events/review")), false),
        action: { label: "Review events", href: "/events/review" },
      };
    }
    case ROLES.CAMPUS_DIRECTOR: {
      const queue = events.filter((event) => event.status === "PENDING_DIRECTOR");
      return {
        context: "Approve events that student affairs has reviewed.", heading: "Oldest events awaiting approval",
        stats: [{ label: "Awaiting approval", value: queue.length }, { label: "Approved", value: count(events, (event) => event.status === "APPROVED" || event.status === "CALENDARED") }, { label: "Rejected", value: count(events, (event) => event.status === "REJECTED") }],
        rows: byAge(queue.map((event) => eventRow(event, "/events/director")), false),
        action: { label: "Open event approvals", href: "/events/director" },
      };
    }
    case ROLES.EVENTS_DEPT: {
      const queue = events.filter((event) => event.status === "APPROVED");
      return {
        context: "Add approved events to the campus calendar.", heading: "Oldest approved events to calendar",
        stats: [{ label: "Waiting for calendar", value: queue.length }, { label: "Calendared", value: count(events, (event) => event.status === "CALENDARED") }],
        rows: byAge(queue.map((event) => eventRow(event, "/events/calendar")), false),
        action: { label: "Open event calendar queue", href: "/events/calendar" },
      };
    }
    case ROLES.CANTEEN_KITCHEN: {
      const queue = orders.filter((order) => order.status === "PAID");
      return {
        context: "Orders paid at the counter are waiting to be prepared.", heading: "Oldest orders to prepare",
        stats: [{ label: "To prepare", value: queue.length }, { label: "Ready for pickup", value: count(orders, (order) => order.status === "READY") }],
        rows: byAge(queue.map((order) => orderRow(order, canteen("kitchen"))), false),
        action: { label: "Open kitchen screen", href: canteen("kitchen") },
      };
    }
    case ROLES.CANTEEN_COUNTER: {
      const queue = orders.filter((order) => order.status === "PLACED");
      return {
        context: "Take payment, then hand over ready orders.", heading: "Oldest orders awaiting payment",
        stats: [{ label: "Awaiting payment", value: queue.length }, { label: "Ready for pickup", value: count(orders, (order) => order.status === "READY") }, { label: "Collected today", value: count(orders, (order) => order.status === "COLLECTED") }],
        rows: byAge(queue.map((order) => orderRow(order, canteen("counter"))), false),
        action: { label: "Open counter screen", href: canteen("counter") },
      };
    }
    case ROLES.CANTEEN_MANAGER:
      return {
        context: "Today's orders and menu status.", heading: "Five most recent orders",
        stats: [{ label: "Orders today", value: orders.length }, { label: "Active orders", value: count(orders, activeOrder) }, { label: "Unavailable menu items", value: data.unavailableItems }],
        rows: byAge(orders.map((order) => orderRow(order, canteen("manage"))), true),
        action: { label: "Manage menu and slots", href: canteen("manage") },
      };
    case ROLES.ADMIN:
    default:
      return {
        context: "Track service requests, rooms, events and canteen orders across campus.", heading: "Five most recent service requests",
        stats: [
          { label: "Open service requests", value: openTickets },
          { label: "Pending room requests", value: count(bookings, (booking) => booking.status === "PENDING") },
          { label: "Events in review", value: count(events, (event) => ["SUBMITTED", "PENDING_DIRECTOR", "CHANGES_REQUESTED"].includes(event.status)) },
          { label: "Active canteen orders", value: count(orders, activeOrder) },
        ],
        rows: byAge(recentTickets, true),
        action: { label: "Open department queue", href: "/service-requests/queue" },
      };
  }
}
