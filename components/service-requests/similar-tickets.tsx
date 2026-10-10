"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { followTicketAction } from "@/app/(app)/service-requests/actions";
import { formatAgo } from "@/app/(app)/service-requests/_lib/format";
import type { SimilarTicket } from "@/app/(app)/service-requests/_lib/queries";
import { Button } from "./button";
import { StatusBadge } from "./status-badge";

export function SimilarTickets({ matches }: { matches: SimilarTicket[] }) {
  const [pending, startTransition] = useTransition();
  const [followingId, setFollowingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (matches.length === 0) return null;

  return (
    <section
      aria-labelledby="similar-heading"
      className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4"
    >
      <div>
        <h2 id="similar-heading" className="text-base font-semibold text-slate-900">
          Similar open issues in this building
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          If one of these is your problem, follow it instead of reporting it again. You will get the
          same updates as the person who reported it.
        </p>
      </div>
      <ul className="divide-y divide-slate-200 rounded-md border border-slate-200 bg-white">
        {matches.map((ticket) => (
          <li
            key={ticket.id}
            className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/service-requests/${ticket.code}`}
                  className="rounded-sm font-medium text-teal-700 hover:text-teal-800 hover:underline focus-visible:outline-2 focus-visible:outline-teal-700"
                >
                  {ticket.code}
                </Link>
                <StatusBadge status={ticket.status} />
                <span className="text-sm text-slate-600">{formatAgo(ticket.created_at)}</span>
              </div>
              <p className="text-sm text-slate-900">{ticket.title}</p>
            </div>
            <Button
              variant="secondary"
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
              {pending && followingId === ticket.id ? "Following..." : "I have this issue too"}
            </Button>
          </li>
        ))}
      </ul>
      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
    </section>
  );
}
