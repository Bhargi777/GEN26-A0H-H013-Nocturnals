import Link from "next/link";
import { redirect } from "next/navigation";
import { EmptyState, PageHeader, buttonStyles } from "@/components/ui";
import { ReportForm } from "@/components/service-requests/report-form";
import { getCurrentProfile } from "@/lib/db/shared";
import { listBuildings, listRooms } from "../_lib/queries";

export const metadata = { title: "Report an issue" };

export default async function NewServiceRequestPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/sign-in");

  const [buildings, rooms] = await Promise.all([listBuildings(), listRooms()]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Report an issue"
        context="Tell the maintenance team what is broken and where to find it."
      />
      {buildings.length === 0 ? (
        <EmptyState
          message="No buildings are set up yet, so issues cannot be reported."
          action={
            <Link href="/service-requests" className={buttonStyles("secondary")}>
              Back to my tickets
            </Link>
          }
        />
      ) : (
        <ReportForm buildings={buildings} rooms={rooms} />
      )}
    </div>
  );
}
