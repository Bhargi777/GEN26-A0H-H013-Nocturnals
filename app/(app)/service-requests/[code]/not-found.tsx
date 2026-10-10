import { ButtonLink } from "@/components/service-requests/button";
import { EmptyState } from "@/components/service-requests/empty-state";

export default function TicketNotFound() {
  return (
    <div className="mx-auto max-w-xl">
      <EmptyState
        message="This ticket does not exist, or you do not have access to it."
        action={
          <ButtonLink href="/service-requests" variant="secondary">
            Back to my tickets
          </ButtonLink>
        }
      />
    </div>
  );
}
