import { redirect } from "next/navigation";
import { ButtonLink } from "@/components/service-requests/button";
import { EmptyState } from "@/components/service-requests/empty-state";
import { PageHeader } from "@/components/service-requests/page-header";
import { ReportForm } from "@/components/service-requests/report-form";
import { getCurrentProfile, listBuildings, listRooms } from "../_stubs/db";

export const metadata = { title: "Report an issue" };

export default async function NewServiceRequestPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const [buildings, rooms] = await Promise.all([listBuildings(), listRooms()]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Report an issue"
        description="Tell the maintenance team what is broken and where to find it."
      />
      {buildings.length === 0 ? (
        <EmptyState
          message="No buildings are set up yet, so issues cannot be reported."
          action={
            <ButtonLink href="/service-requests" variant="secondary">
              Back to my tickets
            </ButtonLink>
          }
        />
      ) : (
        <ReportForm buildings={buildings} rooms={rooms} />
      )}
    </div>
  );
}
