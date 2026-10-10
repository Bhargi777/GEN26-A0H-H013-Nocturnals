"use client";

import { useState, useTransition } from "react";
import {
  resolveTicketAction,
  startWorkAction,
  type ActionResult,
} from "@/app/(app)/service-requests/actions";
import type { TicketStatus } from "@/app/(app)/service-requests/_lib/labels";
import { Button } from "./button";
import { Field, inputClass } from "./form-field";

export function TechnicianActions({
  ticketId,
  code,
  status,
}: {
  ticketId: string;
  code: string;
  status: Extract<TicketStatus, "ASSIGNED" | "IN_PROGRESS">;
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
    <section
      aria-labelledby="work-heading"
      className="space-y-4 rounded-lg border border-slate-200 bg-white p-4 sm:p-6"
    >
      <div>
        <h2 id="work-heading" className="text-base font-semibold text-slate-900">
          Your work on this ticket
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          {status === "ASSIGNED"
            ? "This ticket is assigned to you. Start work when you begin the repair."
            : "Mark it as resolved when the repair is done. The requester will be asked to confirm."}
        </p>
      </div>

      {status === "ASSIGNED" ? (
        <Button disabled={pending} onClick={() => run(() => startWorkAction({ ticketId, code }))}>
          {pending ? "Starting..." : "Start work"}
        </Button>
      ) : (
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            run(() => resolveTicketAction({ ticketId, code, note }));
          }}
        >
          <Field id="resolution-note" label="Resolution note" hint="What did you fix or replace?">
            <textarea
              id="resolution-note"
              required
              minLength={5}
              maxLength={1000}
              rows={3}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              className={inputClass}
            />
          </Field>
          <Button type="submit" disabled={pending}>
            {pending ? "Saving..." : "Mark as resolved"}
          </Button>
        </form>
      )}

      {error && (
        <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </p>
      )}
    </section>
  );
}
