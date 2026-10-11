"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { EventSummary, useEvents } from "@/components/events/event-summary";
import { RoleGate } from "@/components/layout/role-gate";
import { useFrontend } from "@/components/layout/frontend-provider";
import { Button, EmptyState, FieldError, PageHeader, Skeleton, buttonStyles, useToast } from "@/components/ui";
import { ROLES } from "@/lib/constants/roles";
import { getMyEventRequests, resubmitEventRequest } from "@/lib/db/events";

export default function MyEventsPage() {
  return <RoleGate roles={[ROLES.CLUB_PRESIDENT, ROLES.ADMIN]}><MyEvents /></RoleGate>;
}

function MyEvents() {
  const { profile } = useFrontend();
  const toast = useToast();
  const userId = profile?.id ?? "";
  const load = useCallback(() => getMyEventRequests(userId), [userId]);
  const { events, error, reload } = useEvents(load, `my-events-${userId}`);
  const [busy, setBusy] = useState<string>();
  const [actionError, setActionError] = useState<string>();

  async function resubmit(id: string, code: string) {
    if (busy) return;
    setBusy(id); setActionError(undefined);
    try { await resubmitEventRequest(id); toast({ message: `${code} sent back for review.` }); await reload(); }
    catch (cause) { setActionError(cause instanceof Error ? cause.message : "The request could not be resubmitted. Try again."); }
    finally { setBusy(undefined); }
  }

  if (error && !events) return <EmptyState message={error} action={<Button onClick={() => void reload()}>Try again</Button>} />;
  if (!events) return <Skeleton label="Loading your events" />;

  return <div className="space-y-6">
    <PageHeader title="My events" context="Every event you have requested and where it stands." action={<Link href="/events/new" className={buttonStyles()}>Request an event</Link>} />
    <div aria-live="polite"><FieldError>{actionError ?? error}</FieldError></div>
    {events.length === 0 ? <EmptyState message="You have not requested any events yet." action={<Link href="/events/new" className={buttonStyles("secondary")}>Request an event</Link>} /> :
      <ul className="space-y-4">{events.map((event) => <li key={event.id}><EventSummary event={event}>
        {event.status === "CHANGES_REQUESTED" && <Button loading={busy === event.id} onClick={() => void resubmit(event.id, event.code)}>Resubmit for review</Button>}
      </EventSummary></li>)}</ul>}
  </div>;
}
