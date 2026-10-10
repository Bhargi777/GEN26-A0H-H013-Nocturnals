import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/service-requests/page-header";
import { StatusBadge } from "@/components/service-requests/status-badge";
import { Toast } from "@/components/service-requests/toast";
import { getCurrentProfile, getTicketByCode } from "../_stubs/db";

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

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title={`${ticket.code}: ${ticket.title}`}
        description={`${ticket.building_name}${ticket.room_name ? `, ${ticket.room_name}` : ""}`}
        action={<StatusBadge status={ticket.status} />}
      />
      {flags.created && <Toast message={`Ticket ${ticket.code} created. You can follow its progress here.`} />}
      {flags.followed && <Toast message={`You are now following ${ticket.code}.`} />}
    </div>
  );
}
