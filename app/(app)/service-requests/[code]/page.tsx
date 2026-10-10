import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import type { ReactNode } from "react";
import { Card, PageHeader, StatusBadge, Timeline } from "@/components/ui";
import { AdminActions } from "@/components/service-requests/admin-actions";
import { FlashToast } from "@/components/service-requests/flash-toast";
import { RequesterActions } from "@/components/service-requests/requester-actions";
import { TechnicianActions } from "@/components/service-requests/technician-actions";
import { ROLES, TICKET_STATUSES, type TicketStatus } from "@/lib/constants";
import { getCurrentProfile } from "@/lib/db/shared";
import { formatAgo, formatDateTime, requestTime } from "../_lib/format";
import { TICKET_CATEGORY_LABELS, TICKET_PRIORITY_LABELS } from "../_lib/labels";
import { listDepartments, listTechnicians } from "../_lib/queries";
import { loadTicketDetail } from "../_lib/tickets";

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return { title: decodeURIComponent(code) };
}

const ASSIGNABLE: readonly TicketStatus[] = [
  TICKET_STATUSES.OPEN,
  TICKET_STATUSES.REOPENED,
  TICKET_STATUSES.ASSIGNED,
];

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1">
      <dt className="text-secondary">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

export default async function TicketPage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ created?: string; followed?: string; photo?: string }>;
}) {
  const [{ code }, flags] = await Promise.all([params, searchParams]);
  const profile = await getCurrentProfile();
  if (!profile) redirect("/sign-in");

  const ticket = await loadTicketDetail(decodeURIComponent(code), profile.id);
  if (!ticket) notFound();
  const now = requestTime();

  // The database decides what each role may do; these flags only choose which controls to show.
  const adminCanManage =
    profile.role === ROLES.DEPT_ADMIN &&
    profile.department_id !== null &&
    profile.department_id === ticket.assigned_department_id &&
    ticket.status !== TICKET_STATUSES.CLOSED &&
    ticket.status !== TICKET_STATUSES.RESOLVED;
  const [technicians, departments] = adminCanManage
    ? await Promise.all([listTechnicians(profile.department_id as string), listDepartments()])
    : [[], []];
  const technicianCanWork =
    profile.role === ROLES.TECHNICIAN &&
    ticket.assigned_to === profile.id &&
    (ticket.status === TICKET_STATUSES.ASSIGNED || ticket.status === TICKET_STATUSES.IN_PROGRESS);

  const followers =
    ticket.followers_count === 0
      ? "Nobody else has reported this yet"
      : ticket.followers_count === 1
        ? "1 other person has this issue"
        : `${ticket.followers_count} other people have this issue`;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${ticket.code}: ${ticket.title}`}
        context={`Reported by ${ticket.requester_name ?? "a campus user"} ${formatAgo(ticket.created_at, now)}.`}
        action={<StatusBadge status={ticket.status} />}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="min-w-0 space-y-6 lg:col-span-2">
          {adminCanManage && (
            <AdminActions
              ticketId={ticket.id}
              code={ticket.code}
              currentAssigneeId={ticket.assigned_to}
              currentDepartmentId={ticket.assigned_department_id}
              canAssign={ASSIGNABLE.includes(ticket.status)}
              technicians={technicians}
              departments={departments}
            />
          )}
          {technicianCanWork && (
            <TechnicianActions
              ticketId={ticket.id}
              code={ticket.code}
              status={ticket.status === TICKET_STATUSES.ASSIGNED ? "ASSIGNED" : "IN_PROGRESS"}
            />
          )}
          {ticket.status === TICKET_STATUSES.RESOLVED && ticket.requester_id === profile.id && (
            <RequesterActions
              ticketId={ticket.id}
              code={ticket.code}
              category={ticket.category}
              roomId={ticket.room_id}
            />
          )}

          <Card className="space-y-4">
            <h2>Details</h2>
            <p className="whitespace-pre-line break-words">{ticket.description}</p>
            <dl className="grid gap-4 sm:grid-cols-2">
              <Detail label="Category">{TICKET_CATEGORY_LABELS[ticket.category]}</Detail>
              <Detail label="Priority">{TICKET_PRIORITY_LABELS[ticket.priority]}</Detail>
              <Detail label="Location">
                {ticket.building_name}
                {ticket.room_name && `, ${ticket.room_name}`}
                {ticket.location_note && <span className="block text-secondary">{ticket.location_note}</span>}
              </Detail>
              <Detail label="Reported">
                <time dateTime={ticket.created_at}>{formatDateTime(ticket.created_at)}</time>
              </Detail>
              <Detail label="Department">{ticket.department_name ?? "Not routed yet"}</Detail>
              <Detail label="Assigned to">{ticket.assignee_name ?? "Not assigned yet"}</Detail>
              <Detail label="Followers">
                {followers}
                {ticket.is_following && (
                  <span className="block text-secondary">You are following this ticket.</span>
                )}
              </Detail>
              {ticket.rating !== null && (
                <Detail label="Rating">
                  {ticket.rating} out of 5
                  {ticket.feedback && <span className="block text-secondary">{ticket.feedback}</span>}
                </Detail>
              )}
            </dl>
          </Card>

          {ticket.photo_path && (
            <Card className="space-y-3">
              <h2>Photo</h2>
              {ticket.photo_url ? (
                <Image
                  src={ticket.photo_url}
                  alt={`Photo attached to ${ticket.code}`}
                  width={960}
                  height={720}
                  unoptimized
                  className="h-auto max-h-96 w-full rounded-card border object-contain"
                />
              ) : (
                <p className="text-secondary">The photo could not be loaded. Refresh the page to try again.</p>
              )}
            </Card>
          )}
        </div>

        <Card className="space-y-4 self-start">
          <h2>Status timeline</h2>
          <Timeline events={ticket.events} now={now} />
        </Card>
      </div>

      {flags.created && (
        <FlashToast message={`Ticket ${ticket.code} created. You can follow its progress here.`} />
      )}
      {flags.photo === "failed" && (
        <FlashToast
          tone="error"
          message="The photo could not be uploaded. The ticket was created without it."
        />
      )}
      {flags.followed && <FlashToast message={`You are now following ${ticket.code}.`} />}
    </div>
  );
}
