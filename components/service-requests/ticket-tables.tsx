"use client";

import { Badge, DataTable, StatusBadge, type Column } from "@/components/ui";
import { formatAgo, formatDateTime } from "@/app/(app)/service-requests/_lib/format";
import {
  TICKET_CATEGORY_LABELS,
  TICKET_PRIORITY_LABELS,
} from "@/app/(app)/service-requests/_lib/labels";
import { isOverdue } from "@/app/(app)/service-requests/_lib/overdue";
import type { TicketListItem } from "@/app/(app)/service-requests/_lib/tickets";

const PRIORITY_RANK = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 } as const;
const href = (ticket: TicketListItem) => `/service-requests/${ticket.code}`;
const location = (ticket: TicketListItem) =>
  `${ticket.building_name}${ticket.room_name ? `, ${ticket.room_name}` : ""}`;

function When({ iso, now }: { iso: string; now: number }) {
  return (
    <time dateTime={iso} title={formatDateTime(iso)} className="whitespace-nowrap text-secondary">
      {formatAgo(iso, now)}
    </time>
  );
}

const code: Column<TicketListItem> = {
  id: "code",
  header: "Code",
  cell: (t) => <span className="whitespace-nowrap font-medium">{t.code}</span>,
  sortValue: (t) => t.code,
};
const category: Column<TicketListItem> = {
  id: "category",
  header: "Category",
  cell: (t) => TICKET_CATEGORY_LABELS[t.category],
  sortValue: (t) => TICKET_CATEGORY_LABELS[t.category],
};
const where: Column<TicketListItem> = {
  id: "location",
  header: "Location",
  cell: (t) => <span className="text-secondary">{location(t)}</span>,
  sortValue: location,
};
const status: Column<TicketListItem> = {
  id: "status",
  header: "Status",
  cell: (t) => <StatusBadge status={t.status} />,
  sortValue: (t) => t.status,
};

export function MyTicketsTable({ rows, now }: { rows: TicketListItem[]; now: number }) {
  const columns: Column<TicketListItem>[] = [
    code,
    {
      id: "title",
      header: "Title",
      cell: (t) => (
        <span className="block max-w-80 space-y-1">
          <span className="block break-words">{t.title}</span>
          {/* On phones the status column is off-screen, so repeat it here. */}
          <span className="block sm:hidden">
            <StatusBadge status={t.status} />
          </span>
        </span>
      ),
      sortValue: (t) => t.title.toLowerCase(),
    },
    category,
    where,
    status,
    {
      id: "updated",
      header: "Last update",
      cell: (t) => <When iso={t.updated_at} now={now} />,
      sortValue: (t) => t.updated_at,
    },
  ];
  return (
    <DataTable
      caption="Your service requests"
      columns={columns}
      rows={rows}
      rowKey={(t) => t.id}
      rowHref={href}
      pageSize={25}
    />
  );
}

export function QueueTable({ rows, now }: { rows: TicketListItem[]; now: number }) {
  const columns: Column<TicketListItem>[] = [
    code,
    {
      id: "title",
      header: "Title",
      cell: (t) => (
        <span className="block max-w-80 space-y-1">
          <span className="block break-words">{t.title}</span>
          <span className="flex flex-wrap items-center gap-2 sm:hidden">
            <StatusBadge status={t.status} />
            {isOverdue(t, now) && <Badge tone="red">Overdue</Badge>}
          </span>
        </span>
      ),
      sortValue: (t) => t.title.toLowerCase(),
    },
    {
      id: "priority",
      header: "Priority",
      cell: (t) => (
        <span className={t.priority === "URGENT" ? "font-medium text-status-red-dark" : undefined}>
          {TICKET_PRIORITY_LABELS[t.priority]}
        </span>
      ),
      sortValue: (t) => PRIORITY_RANK[t.priority],
    },
    category,
    where,
    status,
    {
      id: "assignee",
      header: "Assigned to",
      cell: (t) => <span className="text-secondary">{t.assignee_name ?? "Unassigned"}</span>,
      sortValue: (t) => t.assignee_name ?? "",
    },
    {
      id: "age",
      header: "Age",
      cell: (t) => (
        <span className="flex flex-wrap items-center gap-2">
          <When iso={t.created_at} now={now} />
          {isOverdue(t, now) && <Badge tone="red">Overdue</Badge>}
        </span>
      ),
      sortValue: (t) => t.created_at,
    },
  ];
  return (
    <DataTable
      caption="Department tickets, most urgent and oldest first"
      columns={columns}
      rows={rows}
      rowKey={(t) => t.id}
      rowHref={href}
      pageSize={25}
    />
  );
}
