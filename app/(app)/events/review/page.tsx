"use client";

import { useState } from "react";
import { EventSummary, useEvents } from "@/components/events/event-summary";
import { ReviewActions } from "@/components/events/review-actions";
import { RoleGate } from "@/components/layout/role-gate";
import { Button, EmptyState, FieldError, PageHeader, Skeleton } from "@/components/ui";
import { ROLES } from "@/lib/constants/roles";
import { getEventRequestsForOSA, osaApproveEventRequest, osaRejectEventRequest, osaRequestChanges } from "@/lib/db/events";
import type { EventStatusValue } from "@/lib/types/campus";

type Tab = Extract<EventStatusValue, "SUBMITTED" | "CHANGES_REQUESTED" | "PENDING_DIRECTOR">;
const TABS: { id: Tab; label: string }[] = [{ id: "SUBMITTED", label: "Submitted" }, { id: "CHANGES_REQUESTED", label: "Changes requested" }, { id: "PENDING_DIRECTOR", label: "With director" }];

export default function ReviewEventsPage() {
  return <RoleGate roles={[ROLES.OSA, ROLES.ADMIN]}><Review /></RoleGate>;
}

function Review() {
  const { events, error, reload } = useEvents(getEventRequestsForOSA, "events-review");
  const [tab, setTab] = useState<Tab>("SUBMITTED");

  if (error && !events) return <EmptyState message={error} action={<Button onClick={() => void reload()}>Try again</Button>} />;
  if (!events) return <Skeleton label="Loading event requests" />;
  const shown = events.filter((event) => event.status === tab);

  return <div className="space-y-6">
    <PageHeader title="Event reviews" context="Approve events to send them to the campus director, or ask the club to change them." />
    <div role="tablist" aria-label="Request views" className="flex flex-wrap gap-2">
      {TABS.map((item) => <button key={item.id} type="button" role="tab" id={`tab-${item.id}`} aria-selected={tab === item.id} aria-controls="events-panel" onClick={() => setTab(item.id)}
        className={`min-h-11 rounded-control border px-4 py-2 ${tab === item.id ? "border-accent bg-accent-light font-medium text-accent" : "bg-surface hover:bg-background"}`}>
        {item.label} ({events.filter((event) => event.status === item.id).length})
      </button>)}
    </div>
    <FieldError>{error}</FieldError>
    <div id="events-panel" role="tabpanel" aria-labelledby={`tab-${tab}`}>
      {shown.length === 0 ? <p className="text-secondary">No events in this view.</p> :
        <ul className="space-y-4">{shown.map((event) => <li key={event.id}><EventSummary event={event}>
          {tab === "SUBMITTED" && <ReviewActions code={event.code} onDone={reload} actions={[
            { label: "Approve", run: () => osaApproveEventRequest(event.id), done: "sent to the campus director." },
            { label: "Request changes", variant: "secondary", reasonLabel: "What should the club change?", run: (reason) => osaRequestChanges(event.id, reason), done: "changes requested." },
            { label: "Reject", variant: "danger", reasonLabel: "Reason for rejecting", run: (reason) => osaRejectEventRequest(event.id, reason), done: "rejected." },
          ]} />}
        </EventSummary></li>)}</ul>}
    </div>
  </div>;
}
