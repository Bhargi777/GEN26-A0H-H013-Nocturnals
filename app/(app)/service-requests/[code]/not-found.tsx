import Link from "next/link";
import { EmptyState, buttonStyles } from "@/components/ui";

export default function TicketNotFound() {
  return (
    <EmptyState
      message="This ticket does not exist, or you do not have access to it."
      action={
        <Link href="/service-requests" className={buttonStyles("secondary")}>
          Back to my tickets
        </Link>
      }
    />
  );
}
