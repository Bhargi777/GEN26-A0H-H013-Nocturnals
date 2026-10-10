import Link from "next/link";
import { redirect } from "next/navigation";
import { ButtonLink, buttonClass } from "@/components/service-requests/button";
import { EmptyState } from "@/components/service-requests/empty-state";
import { inputClass } from "@/components/service-requests/form-field";
import { PageHeader } from "@/components/service-requests/page-header";
import { SortHeader } from "@/components/service-requests/sort-header";
import { StatusBadge } from "@/components/service-requests/status-badge";
import { formatAgo, formatDateTime } from "./_lib/format";
import { listParamsSchema, sortTickets } from "./_lib/list-params";
import {
  CATEGORY_VALUES,
  TICKET_CATEGORY_LABELS,
  STATUS_VALUES,
  TICKET_STATUS_LABELS,
} from "./_lib/labels";
import { getCurrentProfile } from "@/lib/db/shared";
import { listMyTickets } from "@/lib/db/service-requests";
import { withNames } from "./_lib/tickets";

export const metadata = { title: "My service requests" };

const PATH = "/service-requests";

export default async function MyTicketsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = listParamsSchema.parse(await searchParams);
  const profile = await getCurrentProfile();
  if (!profile) redirect("/sign-in");

  const sort = params.sort ?? "updated";
  const dir = params.dir ?? (params.sort ? "asc" : "desc");
  const tickets = sortTickets(
    await withNames(
      (await listMyTickets()).filter(
        (t) =>
          (!params.status || t.status === params.status) &&
          (!params.category || t.category === params.category),
      ),
    ),
    sort,
    dir,
  );
  const filtered = Boolean(params.status || params.category);
  const header = { path: PATH, params, activeSort: sort, activeDir: dir };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="My service requests"
        description="Issues you have reported and where each one stands."
        action={<ButtonLink href="/service-requests/new">Report an issue</ButtonLink>}
      />

      <form method="get" className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="space-y-1 sm:w-48">
          <label htmlFor="status" className="block text-sm font-medium text-slate-900">
            Status
          </label>
          <select id="status" name="status" defaultValue={params.status ?? ""} className={inputClass}>
            <option value="">All statuses</option>
            {STATUS_VALUES.map((status) => (
              <option key={status} value={status}>
                {TICKET_STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1 sm:w-48">
          <label htmlFor="category" className="block text-sm font-medium text-slate-900">
            Category
          </label>
          <select id="category" name="category" defaultValue={params.category ?? ""} className={inputClass}>
            <option value="">All categories</option>
            {CATEGORY_VALUES.map((category) => (
              <option key={category} value={category}>
                {TICKET_CATEGORY_LABELS[category]}
              </option>
            ))}
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
            message="You have not reported any issues yet."
            action={<ButtonLink href="/service-requests/new">Report an issue</ButtonLink>}
          />
        )
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full min-w-[720px] text-sm">
            <caption className="sr-only">Your service requests</caption>
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <SortHeader label="Code" column="code" {...header} />
                <SortHeader label="Title" column="title" {...header} />
                <SortHeader label="Category" column="category" {...header} />
                <SortHeader label="Location" column="location" {...header} />
                <SortHeader label="Status" column="status" {...header} />
                <SortHeader label="Last update" column="updated" {...header} />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {tickets.map((ticket) => (
                <tr key={ticket.id} className="hover:bg-slate-50">
                  <td className="px-3 py-2 font-medium whitespace-nowrap">
                    <Link
                      href={`${PATH}/${ticket.code}`}
                      className="rounded-sm text-teal-700 hover:text-teal-800 hover:underline focus-visible:outline-2 focus-visible:outline-teal-700"
                    >
                      {ticket.code}
                    </Link>
                  </td>
                  <td className="max-w-xs px-3 py-2 text-slate-900">
                    <span className="block truncate">{ticket.title}</span>
                    {/* On phones the status column is off-screen, so repeat it here. */}
                    <span className="mt-1 block sm:hidden">
                      <StatusBadge status={ticket.status} />
                    </span>
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
                    <time dateTime={ticket.updated_at} title={formatDateTime(ticket.updated_at)}>
                      {formatAgo(ticket.updated_at)}
                    </time>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
