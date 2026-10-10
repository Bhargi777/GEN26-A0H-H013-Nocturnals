import type { ReactNode } from "react";
import { REQUEST_STATUS, STATUS_LABELS, TICKET_STATUS, type Status } from "@/app/(app)/ui/preview-contract";

export type BadgeTone = "slate" | "blue" | "amber" | "green" | "orange" | "red";
const styles: Record<BadgeTone, string> = {
  slate: "bg-status-slate-light text-status-slate-dark", blue: "bg-status-blue-light text-status-blue-dark",
  amber: "bg-status-amber-light text-status-amber-dark", green: "bg-status-green-light text-status-green-dark",
  orange: "bg-status-orange-light text-status-orange-dark", red: "bg-status-red-light text-status-red-dark",
};
const statusTones: Record<Status, BadgeTone> = {
  [TICKET_STATUS.open]: "slate", [TICKET_STATUS.closed]: "slate", [TICKET_STATUS.assigned]: "blue",
  [TICKET_STATUS.inProgress]: "amber", [TICKET_STATUS.resolved]: "green", [TICKET_STATUS.reopened]: "orange",
  [REQUEST_STATUS.pendingDept]: "blue", [REQUEST_STATUS.pendingOffice]: "blue",
  [REQUEST_STATUS.approved]: "green", [REQUEST_STATUS.rejected]: "red",
};
export function Badge({ tone = "slate", children }: { tone?: BadgeTone; children: ReactNode }) {
  return <span className={`inline-flex rounded-control px-2 py-1 text-body font-medium ${styles[tone]}`}>{children}</span>;
}
export function StatusBadge({ status }: { status: Status }) {
  return <Badge tone={statusTones[status]}>{STATUS_LABELS[status]}</Badge>;
}
