"use client";

import { EventSummary, useEvents } from "@/components/events/event-summary";
import { ReviewActions } from "@/components/events/review-actions";
import { RoleGate } from "@/components/layout/role-gate";
import { Button, EmptyState, FieldError, PageHeader, Skeleton } from "@/components/ui";
import { ROLES } from "@/lib/constants/roles";
import { directorApproveEventRequest, directorRejectEventRequest, getEventRequestsForDirector } from "@/lib/db/events";

export default function DirectorEventsPage() {
  return <RoleGate roles={[ROLES.CAMPUS_DIRECTOR, ROLES.ADMIN]}><Approvals /></RoleGate>;
}

function Approvals() {
  const { events, error, reload } = useEvents(getEventRequestsForDirector, "events-director");

  if (error && !events) return <EmptyState message={error} action={<Button onClick={() => void reload()}>Try again</Button>} />;
  if (!events) return <Skeleton label="Loading event approvals" />;

  return <div className="space-y-6">
    <PageHeader title="Event approvals" context="Events that student affairs has reviewed. Approved events go to the events department for the calendar." />
    <FieldError>{error}</FieldError>
    {events.length === 0 ? <p className="text-secondary">No events are waiting for your approval.</p> :
      <ul className="space-y-4">{events.map((event) => <li key={event.id}><EventSummary event={event}>
        <ReviewActions code={event.code} onDone={reload} actions={[
          { label: "Approve", run: () => directorApproveEventRequest(event.id), done: "approved." },
          { label: "Reject", variant: "danger", reasonLabel: "Reason for rejecting", run: (reason) => directorRejectEventRequest(event.id, reason), done: "rejected." },
        ]} />
      </EventSummary></li>)}</ul>}
  </div>;
}
