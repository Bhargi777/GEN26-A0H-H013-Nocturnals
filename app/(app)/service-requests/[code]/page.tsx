import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { AdminActions } from "@/components/service-requests/admin-actions";
import { PageHeader } from "@/components/service-requests/page-header";
import { RequesterActions } from "@/components/service-requests/requester-actions";
import { StatusBadge } from "@/components/service-requests/status-badge";
import { TicketTimeline } from "@/components/service-requests/ticket-timeline";
import { Toast } from "@/components/service-requests/toast";
import { formatAgo, formatDateTime } from "../_lib/format";
import { TICKET_CATEGORY_LABELS, TICKET_PRIORITY_LABELS } from "../_stubs/constants";
import {
  getCurrentProfile,
  getPhotoUrl,
  getTicketByCode,
  listDepartments,
  listTechnicians,
} from "../_stubs/db";

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return { title: decodeURIComponent(code) };
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-0.5">
      <dt className="text-sm text-slate-600">{label}</dt>
      <dd className="text-sm text-slate-900">{children}</dd>
    </div>
  );
}

export default async function TicketPage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ created?: string; followed?: string }>;
}) {
  const [{ code }, flags] = await Promise.all([params, searchParams]);
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const ticket = await getTicketByCode(decodeURIComponent(code), profile.id);
  if (!ticket) notFound();
  const photoUrl = ticket.photo_path ? await getPhotoUrl(ticket.photo_path) : null;

  // The database decides what each role may do; these flags only choose which controls to show.
  const isDeptAdmin =
    profile.role === "dept_admin" &&
    profile.department_id !== null &&
    profile.department_id === ticket.assigned_department_id;
  const adminCanManage = isDeptAdmin && ticket.status !== "CLOSED" && ticket.status !== "RESOLVED";
  const [technicians, departments] = adminCanManage
    ? await Promise.all([listTechnicians(profile.department_id as string), listDepartments()])
    : [[], []];

  const followers =
    ticket.followers_count === 0
      ? "Nobody else has reported this yet"
      : ticket.followers_count === 1
        ? "1 other person has this issue"
        : `${ticket.followers_count} other people have this issue`;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title={`${ticket.code}: ${ticket.title}`}
        description={`Reported by ${ticket.requester?.full_name ?? "a campus user"} ${formatAgo(ticket.created_at)}.`}
        action={<StatusBadge status={ticket.status} />}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {adminCanManage && (
            <AdminActions
              ticketId={ticket.id}
              code={ticket.code}
              currentAssigneeId={ticket.assigned_to}
              currentDepartmentId={ticket.assigned_department_id}
              canAssign={["OPEN", "REOPENED", "ASSIGNED"].includes(ticket.status)}
              technicians={technicians}
              departments={departments}
            />
          )}
          {ticket.status === "RESOLVED" && ticket.requester_id === profile.id && (
            <RequesterActions
              ticketId={ticket.id}
              code={ticket.code}
              category={ticket.category}
              roomId={ticket.room_id}
            />
          )}
          <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-4 sm:p-6">
            <h2 className="text-base font-semibold text-slate-900">Details</h2>
            <p className="text-sm whitespace-pre-line text-slate-900">{ticket.description}</p>
            <dl className="grid gap-4 sm:grid-cols-2">
              <Detail label="Category">{TICKET_CATEGORY_LABELS[ticket.category]}</Detail>
              <Detail label="Priority">{TICKET_PRIORITY_LABELS[ticket.priority]}</Detail>
              <Detail label="Location">
                {ticket.building_name}
                {ticket.room_name && `, ${ticket.room_name}`}
                {ticket.location_note && (
                  <span className="block text-slate-600">{ticket.location_note}</span>
                )}
              </Detail>
              <Detail label="Reported">
                <time dateTime={ticket.created_at}>{formatDateTime(ticket.created_at)}</time>
              </Detail>
              <Detail label="Department">{ticket.department_name ?? "Not routed yet"}</Detail>
              <Detail label="Assigned to">{ticket.assignee?.full_name ?? "Not assigned yet"}</Detail>
              <Detail label="Followers">
                {followers}
                {ticket.is_following && (
                  <span className="block text-slate-600">You are following this ticket.</span>
                )}
              </Detail>
              {ticket.rating !== null && (
                <Detail label="Rating">
                  {ticket.rating} out of 5
                  {ticket.feedback && <span className="block text-slate-600">{ticket.feedback}</span>}
                </Detail>
              )}
            </dl>
          </section>

          {ticket.photo_path && (
            <section className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 sm:p-6">
              <h2 className="text-base font-semibold text-slate-900">Photo</h2>
              {photoUrl ? (
                <Image
                  src={photoUrl}
                  alt={`Photo attached to ${ticket.code}`}
                  width={960}
                  height={720}
                  unoptimized
                  className="h-auto max-h-[480px] w-full rounded-md border border-slate-200 object-contain"
                />
              ) : (
                <p className="text-sm text-slate-600">
                  The photo could not be loaded. Refresh the page to try again.
                </p>
              )}
            </section>
          )}
        </div>

        <aside className="self-start rounded-lg border border-slate-200 bg-white p-4 sm:p-6">
          <h2 className="text-base font-semibold text-slate-900">Status timeline</h2>
          <TicketTimeline events={ticket.events} />
        </aside>
      </div>

      {flags.created && <Toast message={`Ticket ${ticket.code} created. You can follow its progress here.`} />}
      {flags.followed && <Toast message={`You are now following ${ticket.code}.`} />}
    </div>
  );
}
