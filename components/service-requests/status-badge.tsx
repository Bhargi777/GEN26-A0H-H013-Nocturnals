import {
  TICKET_STATUS_LABELS,
  type TicketStatus,
} from "@/app/(app)/service-requests/_stubs/constants";

// Muted pairs from the team UI rules: light background, dark text.
const tones: Record<TicketStatus, string> = {
  OPEN: "bg-slate-100 text-slate-700",
  CLOSED: "bg-slate-100 text-slate-700",
  ASSIGNED: "bg-blue-50 text-blue-800",
  IN_PROGRESS: "bg-amber-50 text-amber-800",
  RESOLVED: "bg-green-50 text-green-800",
  REOPENED: "bg-orange-50 text-orange-800",
};

export function StatusBadge({ status }: { status: TicketStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium whitespace-nowrap ${tones[status]}`}
    >
      {TICKET_STATUS_LABELS[status]}
    </span>
  );
}
