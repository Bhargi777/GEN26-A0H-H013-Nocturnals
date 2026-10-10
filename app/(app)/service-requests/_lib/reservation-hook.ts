export type AvTicketChange = {
  ticketId: string;
  roomId: string | null;
  change: "opened" | "closed";
};

/**
 * Called after an AV_EQUIPMENT ticket is opened or closed.
 * TODO(reservation): link the ticket to the room's bookings once the room
 * reservation module exists. Intentionally a no-op until then.
 */
export function onAvTicketChange(change: AvTicketChange): void {
  void change;
}
