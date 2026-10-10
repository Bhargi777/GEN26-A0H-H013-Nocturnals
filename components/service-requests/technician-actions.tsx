"use client";

import { useState, useTransition } from "react";
import { Button, Card, FormField, Textarea } from "@/components/ui";
import {
  resolveTicketAction,
  startWorkAction,
  type ActionResult,
} from "@/app/(app)/service-requests/actions";

export function TechnicianActions({
  ticketId,
  code,
  status,
}: {
  ticketId: string;
  code: string;
  status: "ASSIGNED" | "IN_PROGRESS";
}) {
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const run = (action: () => Promise<ActionResult>) => {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) setError(result.error);
      else setNote("");
    });
  };

  return (
    <Card aria-labelledby="work-heading" role="region" className="space-y-4">
      <div className="space-y-1">
        <h2 id="work-heading">Your work on this ticket</h2>
        <p className="text-secondary">
          {status === "ASSIGNED"
            ? "This ticket is assigned to you. Start work when you begin the repair."
            : "Mark it as resolved when the repair is done. The requester will be asked to confirm."}
        </p>
      </div>

      {status === "ASSIGNED" ? (
        <Button loading={pending} onClick={() => run(() => startWorkAction({ ticketId, code }))}>
          Start work
        </Button>
      ) : (
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            run(() => resolveTicketAction({ ticketId, code, note }));
          }}
        >
          <FormField id="resolution-note" label="Resolution note" required help="What did you fix or replace?">
            {(control) => (
              <Textarea
                {...control}
                rows={3}
                maxLength={1000}
                value={note}
                onChange={(event) => setNote(event.target.value)}
              />
            )}
          </FormField>
          <Button type="submit" loading={pending}>
            Mark as resolved
          </Button>
        </form>
      )}

      {error && (
        <p role="alert" className="rounded-card border border-status-red-dark bg-status-red-light p-3 text-status-red-dark">
          {error}
        </p>
      )}
    </Card>
  );
}
