"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Button, Card, StatusBadge } from "@/components/ui";
import { followTicketAction } from "@/app/(app)/service-requests/actions";
import { formatAgo } from "@/app/(app)/service-requests/_lib/format";
import type { SimilarTicket } from "@/app/(app)/service-requests/_lib/queries";

export function SimilarTickets({ matches }: { matches: SimilarTicket[] }) {
  const [pending, startTransition] = useTransition();
  const [followingId, setFollowingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (matches.length === 0) return null;

  return (
    <Card aria-labelledby="similar-heading" role="region" className="space-y-3 bg-background">
      <div className="space-y-1">
        <h2 id="similar-heading">Similar open issues in this building</h2>
        <p className="text-secondary">
          If one of these is your problem, follow it instead of reporting it again. You will get the
          same updates as the person who reported it.
        </p>
      </div>
      <ul className="divide-y rounded-card border bg-surface">
        {matches.map((ticket) => (
          <li key={ticket.id} className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <Link href={`/service-requests/${ticket.code}`} className="text-link font-medium">
                  {ticket.code}
                </Link>
                <StatusBadge status={ticket.status} />
                <span className="text-secondary">{formatAgo(ticket.created_at)}</span>
              </div>
              <p className="break-words">{ticket.title}</p>
            </div>
            <Button
              variant="secondary"
              loading={pending && followingId === ticket.id}
              disabled={pending}
              onClick={() => {
                setError(null);
                setFollowingId(ticket.id);
                startTransition(async () => {
                  const result = await followTicketAction({ ticketId: ticket.id, code: ticket.code });
                  if (result?.error) setError(result.error);
                });
              }}
            >
              I have this issue too
            </Button>
          </li>
        ))}
      </ul>
      {error && (
        <p role="alert" className="text-status-red-dark">
          {error}
        </p>
      )}
    </Card>
  );
}
