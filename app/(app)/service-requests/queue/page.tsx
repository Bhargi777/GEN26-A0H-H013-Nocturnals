import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ButtonLink, buttonClass } from "@/components/service-requests/button";
import { EmptyState } from "@/components/service-requests/empty-state";
import { inputClass } from "@/components/service-requests/form-field";
import { PageHeader } from "@/components/service-requests/page-header";
import { SortHeader } from "@/components/service-requests/sort-header";
import { StatusBadge } from "@/components/service-requests/status-badge";
import { Toast } from "@/components/service-requests/toast";
import { formatAgo, formatDateTime } from "../_lib/format";
import { listParamsSchema, sortTickets } from "../_lib/list-params";
import { isOverdue, OVERDUE_AFTER_HOURS } from "../_lib/overdue";
import {
  CATEGORY_VALUES,
  TICKET_CATEGORY_LABELS,
  PRIORITY_VALUES,
  TICKET_PRIORITY_LABELS,
  STATUS_VALUES,
  TICKET_STATUS_LABELS,
  type Role,
} from "../_lib/labels";
import { getCurrentProfile, listBuildings, listDepartmentQueue } from "../_stubs/db";

export const metadata = { title: "Department queue" };

const PATH = "/service-requests/queue";
const STAFF_ROLES: readonly Role[] = ["technician", "dept_admin"];

function FilterSelect({
  id,
  label,
  value,
  allLabel,
  options,
}: {
  id: string;
  label: string;
  value: string | undefined;
  allLabel: string;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-sm font-medium text-slate-900">
        {label}
      </label>
      <select id={id} name={id} defaultValue={value ?? ""} className={inputClass}>
        <option value="">{allLabel}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export default async function QueuePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const params = listParamsSchema.parse(raw);
  const moved = typeof raw.moved === "string" && /^SR-\d+$/.test(raw.moved) ? raw.moved : null;
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  if (!STAFF_ROLES.includes(profile.role)) {
    return (
      <div className="mx-auto max-w-xl">
        <EmptyState
          message="The department queue is only for technicians and department admins."
          action={
            <ButtonLink href="/service-requests" variant="secondary">
              Go to my tickets
            </ButtonLink>
          }
        />
      </div>
    );
  }
  if (!profile.department_id) {
    return (
      <div className="mx-auto max-w-xl">
        <EmptyState
          message="Your profile is not linked to a department yet. Ask the admin office to add you to one."
          action={
            <ButtonLink href="/service-requests" variant="secondary">
              Go to my tickets
            </ButtonLink>
          }
        />
      </div>
    );
  }

  const [all, buildings] = await Promise.all([
    listDepartmentQueue(profile.department_id, {
      status: params.status,
      category: params.category,
      priority: params.priority,
      buildingId: params.building,
    }),
    listBuildings(),
  ]);
  const visible =
    params.status || params.show === "all" ? all : all.filter((t) => t.status !== "CLOSED");
  const sort = params.sort ?? "priority";
  const dir = params.dir ?? "asc";
  const tickets = sortTickets(visible, sort, dir);
  const now = Date.now();
  const overdueCount = tickets.filter((t) => isOverdue(t, now)).length;
  const filtered = Boolean(
    params.status || params.category || params.priority || params.building || params.show,
  );
  const header = { path: PATH, params, activeSort: sort, activeDir: dir };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="Department queue"
        description={`Tickets routed to your department, most urgent and oldest first.${
          overdueCount ? ` ${overdueCount} overdue.` : ""
        }`}
      />

      <form method="get" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6 lg:items-end">
        <FilterSelect
          id="status"
          label="Status"
          value={params.status}
          allLabel="Any status"
          options={STATUS_VALUES.map((s) => ({ value: s, label: TICKET_STATUS_LABELS[s] }))}
        />
        <FilterSelect
          id="category"
          label="Category"
          value={params.category}
          allLabel="All categories"
          options={CATEGORY_VALUES.map((c) => ({ value: c, label: TICKET_CATEGORY_LABELS[c] }))}
        />
        <FilterSelect
          id="priority"
          label="Priority"
          value={params.priority}
          allLabel="All priorities"
          options={PRIORITY_VALUES.map((p) => ({ value: p, label: TICKET_PRIORITY_LABELS[p] }))}
        />
        <FilterSelect
          id="building"
          label="Building"
          value={params.building}
          allLabel="All buildings"
          options={buildings.map((b) => ({ value: b.id, label: b.name }))}
        />
        <div className="space-y-1">
          <label htmlFor="show" className="block text-sm font-medium text-slate-900">
            Closed tickets
          </label>
          <select id="show" name="show" defaultValue={params.show ?? ""} className={inputClass}>
            <option value="">Hide closed</option>
            <option value="all">Include closed</option>
          </select>
        </div>
        {params.sort && <input type="hidden" name="sort" value={params.sort} />}
        {params.dir && <input type="hidden" name="dir" value={params.dir} />}
        <div className="flex gap-3">
          <button type="submit" className={buttonClass("secondary")}>
            Apply filters
          </button>
          {filtered && (
            <Link href={PATH} className={buttonClass("secondary")}>
              Clear
            </Link>
          )}
        </div>
      </form>

      {tickets.length === 0 ? (
        filtered ? (
          <EmptyState
            message="No tickets match these filters."
            action={
              <ButtonLink href={PATH} variant="secondary">
                Clear filters
              </ButtonLink>
            }
          />
        ) : (
          <EmptyState
            message="There are no open tickets for your department."
            action={
              <ButtonLink href={`${PATH}?show=all`} variant="secondary">
                Show closed tickets
              </ButtonLink>
            }
          />
        )
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full min-w-[960px] text-sm">
            <caption className="sr-only">
              Department tickets. Overdue means unresolved longer than the target for its
              priority: urgent {OVERDUE_AFTER_HOURS.URGENT} hours, high {OVERDUE_AFTER_HOURS.HIGH}{" "}
              hours, medium {OVERDUE_AFTER_HOURS.MEDIUM} hours, low{" "}
              {OVERDUE_AFTER_HOURS.LOW / 24} days.
            </caption>
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <SortHeader label="Code" column="code" {...header} />
                <SortHeader label="Title" column="title" {...header} />
                <SortHeader label="Priority" column="priority" {...header} />
                <SortHeader label="Category" column="category" {...header} />
                <SortHeader label="Location" column="location" {...header} />
                <SortHeader label="Status" column="status" {...header} />
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium tracking-wide text-slate-600 uppercase">
                  Assigned to
                </th>
                <SortHeader label="Age" column="created" {...header} />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {tickets.map((ticket) => {
                const overdue = isOverdue(ticket, now);
                return (
                  <tr
                    key={ticket.id}
                    className={overdue ? "bg-red-50/60 hover:bg-red-50" : "hover:bg-slate-50"}
                  >
                    <td className="px-3 py-2 font-medium whitespace-nowrap">
                      <Link
                        href={`/service-requests/${ticket.code}`}
                        className="rounded-sm text-teal-700 hover:text-teal-800 hover:underline focus-visible:outline-2 focus-visible:outline-teal-700"
                      >
                        {ticket.code}
                      </Link>
                    </td>
                    <td className="max-w-xs px-3 py-2 text-slate-900">
                      <span className="block truncate">{ticket.title}</span>
                      {/* On phones these columns are off-screen, so repeat them here. */}
                      <span className="mt-1 flex flex-wrap items-center gap-2 sm:hidden">
                        <StatusBadge status={ticket.status} />
                        <span className="text-xs text-slate-600">
                          {TICKET_PRIORITY_LABELS[ticket.priority]}
                        </span>
                        {overdue && <span className="text-xs font-medium text-red-800">Overdue</span>}
                      </span>
                    </td>
                    <td
                      className={`px-3 py-2 whitespace-nowrap ${
                        ticket.priority === "URGENT" ? "font-medium text-red-800" : "text-slate-900"
                      }`}
                    >
                      {TICKET_PRIORITY_LABELS[ticket.priority]}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-slate-600">
                      {TICKET_CATEGORY_LABELS[ticket.category]}
                    </td>
                    <td className="px-3 py-2 text-slate-600">
                      {ticket.building_name}
                      {ticket.room_name && `, ${ticket.room_name}`}
                    </td>
                    <td className="px-3 py-2">
                      <StatusBadge status={ticket.status} />
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-slate-600">
                      {ticket.assignee_name ?? "Unassigned"}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <time
                        dateTime={ticket.created_at}
                        title={formatDateTime(ticket.created_at)}
                        className="text-slate-600"
                      >
                        {formatAgo(ticket.created_at, now)}
                      </time>
                      {overdue && (
                        <span className="ml-2 inline-flex items-center gap-1 rounded-md bg-red-100 px-1.5 py-0.5 text-xs font-medium text-red-800">
                          <AlertTriangle size={16} aria-hidden />
                          Overdue
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {moved && <Toast message={`${moved} was sent to the other department.`} />}
    </div>
  );
}
