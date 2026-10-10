import Link from "next/link";
import { redirect } from "next/navigation";
import { EmptyState, PageHeader, buttonStyles } from "@/components/ui";
import { FilterSelect } from "@/components/service-requests/filter-select";
import { MyTicketsTable } from "@/components/service-requests/ticket-tables";
import { listMyTickets } from "@/lib/db/service-requests";
import { getCurrentProfile } from "@/lib/db/shared";
import { requestTime } from "./_lib/format";
import {
  CATEGORY_VALUES,
  STATUS_VALUES,
  TICKET_CATEGORY_LABELS,
  TICKET_STATUS_LABELS,
} from "./_lib/labels";
import { byLastUpdate, listParamsSchema } from "./_lib/list-params";
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

  const tickets = byLastUpdate(
    await withNames(
      (await listMyTickets()).filter(
        (t) =>
          (!params.status || t.status === params.status) &&
          (!params.category || t.category === params.category),
      ),
    ),
  );
  const filtered = Boolean(params.status || params.category);

  return (
    <div className="space-y-6">
      <PageHeader
        title="My service requests"
        context="Issues you have reported and where each one stands."
        action={
          <Link href={`${PATH}/new`} className={buttonStyles()}>
            Report an issue
          </Link>
        }
      />

      <form method="get" className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <FilterSelect
          id="status"
          label="Status"
          value={params.status}
          allLabel="All statuses"
          options={STATUS_VALUES.map((s) => ({ value: s, label: TICKET_STATUS_LABELS[s] }))}
        />
        <FilterSelect
          id="category"
          label="Category"
          value={params.category}
          allLabel="All categories"
          options={CATEGORY_VALUES.map((c) => ({ value: c, label: TICKET_CATEGORY_LABELS[c] }))}
        />
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
            message="You have not reported any issues yet."
            action={
              <Link href={`${PATH}/new`} className={buttonStyles()}>
                Report an issue
              </Link>
            }
          />
        )
      ) : (
        <MyTicketsTable rows={tickets} now={requestTime()} />
      )}
    </div>
  );
}
