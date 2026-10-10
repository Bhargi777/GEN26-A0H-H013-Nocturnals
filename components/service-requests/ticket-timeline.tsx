import { formatDateTime } from "@/app/(app)/service-requests/_lib/format";
import { TICKET_STATUS_LABELS } from "@/app/(app)/service-requests/_lib/labels";
import type { TicketEvent } from "@/app/(app)/service-requests/_stubs/db";

function eventLabel(event: TicketEvent): string {
  if (!event.from_status && event.to_status) return "Reported";
  if (event.to_status && event.from_status === event.to_status) {
    return `Updated (${TICKET_STATUS_LABELS[event.to_status]})`;
  }
  if (event.to_status) return TICKET_STATUS_LABELS[event.to_status];
  return event.action.replace(/_/g, " ");
}

export function TicketTimeline({ events }: { events: TicketEvent[] }) {
  if (events.length === 0) {
    return <p className="mt-3 text-sm text-slate-600">No updates have been recorded yet.</p>;
  }
  return (
    <ol className="mt-4 space-y-4 border-l border-slate-200 pl-4">
      {events.map((event) => (
        <li key={event.id} className="relative">
          <span
            aria-hidden
            className="absolute top-1.5 -left-[21px] h-2.5 w-2.5 rounded-full border-2 border-white bg-teal-700"
          />
          <p className="text-sm font-medium text-slate-900">{eventLabel(event)}</p>
          <p className="text-sm text-slate-600">
            {event.actor_name ?? "System"} ·{" "}
            <time dateTime={event.created_at}>{formatDateTime(event.created_at)}</time>
          </p>
          {event.note && (
            <p className="mt-1 rounded-md bg-slate-50 p-2 text-sm whitespace-pre-line text-slate-900">
              {event.note}
            </p>
          )}
        </li>
      ))}
    </ol>
  );
}
