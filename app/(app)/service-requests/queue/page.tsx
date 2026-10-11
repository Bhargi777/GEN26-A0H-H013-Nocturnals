import Link from "next/link";
import { redirect } from "next/navigation";
import { EmptyState, Label, PageHeader, Select, buttonStyles } from "@/components/ui";
import { FilterSelect } from "@/components/service-requests/filter-select";
import { FlashToast } from "@/components/service-requests/flash-toast";
import { QueueTable } from "@/components/service-requests/ticket-tables";
import { ROLES, TICKET_STATUSES, type Role } from "@/lib/constants";
import { listDepartmentTickets } from "@/lib/db/service-requests";
import { getCurrentProfile } from "@/lib/db/shared";
import { requestTime } from "../_lib/format";
import {
  CATEGORY_VALUES,
  PRIORITY_VALUES,
  STATUS_VALUES,
  TICKET_CATEGORY_LABELS,
  TICKET_PRIORITY_LABELS,
  TICKET_STATUS_LABELS,
} from "../_lib/labels";
import { byPriorityThenAge, listParamsSchema } from "../_lib/list-params";
import { isOverdue, OVERDUE_AFTER_HOURS } from "../_lib/overdue";
import { listBuildings } from "../_lib/queries";
import { withNames } from "../_lib/tickets";

export const metadata = { title: "Department queue" };

const PATH = "/service-requests/queue";
const STAFF_ROLES: readonly Role[] = [ROLES.TECHNICIAN, ROLES.DEPT_OFFICE, ROLES.DEPT_HEAD];

const backToMine = (
  <Link href="/service-requests" className={buttonStyles("secondary")}>
    Go to my tickets
  </Link>
);

export default async function QueuePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const params = listParamsSchema.parse(raw);
  const moved = typeof raw.moved === "string" && /^SR-\d+$/.test(raw.moved) ? raw.moved : null;
  const profile = await getCurrentProfile();
  if (!profile) redirect("/sign-in");

  if (!STAFF_ROLES.includes(profile.role)) {
    return (
      <EmptyState
        message="The department queue is only for technicians and department admins."
        action={backToMine}
      />
    );
  }
  if (!profile.department_id) {
    return (
      <EmptyState
        message="Your profile is not linked to a department yet. Ask the admin office to add you to one."
        action={backToMine}
      />
    );
  }

  const [all, buildings] = await Promise.all([
    listDepartmentTickets({
      assigned_department_id: profile.department_id,
      ...(params.status && { status: params.status }),
      ...(params.category && { category: params.category }),
      ...(params.priority && { priority: params.priority }),
      ...(params.building && { building_id: params.building }),
    }).then(withNames),
    listBuildings(),
  ]);
  const visible =
    params.status || params.show === "all"
      ? all
      : all.filter((t) => t.status !== TICKET_STATUSES.CLOSED);
  const tickets = byPriorityThenAge(visible);
  const now = await requestTime();
  const overdueCount = tickets.filter((t) => isOverdue(t, now)).length;
  const filtered = Boolean(
    params.status || params.category || params.priority || params.building || params.show,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Department queue"
        context={`Tickets routed to your department, most urgent and oldest first.${
          overdueCount ? ` ${overdueCount} overdue.` : ""
        }`}
      />

      <form method="get" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 xl:items-end">
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
          <Label htmlFor="show">Closed tickets</Label>
          <Select id="show" name="show" defaultValue={params.show ?? ""}>
            <option value="">Hide closed</option>
            <option value="all">Include closed</option>
          </Select>
        </div>
        <div className="flex gap-3">
          <button type="submit" className={buttonStyles("secondary")}>
            Apply filters
          </button>
          {filtered && (
            <Link href={PATH} className={buttonStyles("ghost")}>
              Clear
            </Link>
          )}
        </div>
      </form>

      <p className="text-secondary">
        Overdue means unresolved longer than the target for its priority: urgent{" "}
        {OVERDUE_AFTER_HOURS.URGENT} hours, high {OVERDUE_AFTER_HOURS.HIGH} hours, medium{" "}
        {OVERDUE_AFTER_HOURS.MEDIUM} hours, low {OVERDUE_AFTER_HOURS.LOW / 24} days.
      </p>

      {tickets.length === 0 ? (
        filtered ? (
          <EmptyState
            message="No tickets match these filters."
            action={
              <Link href={PATH} className={buttonStyles("secondary")}>
                Clear filters
              </Link>
            }
          />
        ) : (
          <EmptyState
            message="There are no open tickets for your department."
            action={
              <Link href={`${PATH}?show=all`} className={buttonStyles("secondary")}>
                Show closed tickets
              </Link>
            }
          />
        )
      ) : (
        <QueueTable rows={tickets} now={now} />
      )}
      {moved && <FlashToast message={`${moved} was sent to the other department.`} />}
    </div>
  );
}
