"use client";

import { useState, useTransition } from "react";
import { Button, Card, FormField, Textarea } from "@/components/ui";
import {
  closeRequestAction,
  confirmFixedAction,
  stillBrokenAction,
  type ActionResult,
} from "@/app/(app)/service-requests/actions";
import type { TicketCategory } from "@/app/(app)/service-requests/_lib/labels";

type Mode = "idle" | "confirm" | "broken";

export function RequesterActions({
  ticketId,
  code,
  category,
  roomId,
}: {
  ticketId: string;
  code: string;
  category: TicketCategory;
  roomId: string | null;
}) {
  const [mode, setMode] = useState<Mode>("idle");
  const [rating, setRating] = useState<number | null>(null);
  const [feedback, setFeedback] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const submit = (run: () => Promise<ActionResult>) => {
    setError(null);
    startTransition(async () => {
      const result = await run();
      if (!result.ok) setError(result.error);
      else setMode("idle");
    });
  };

  return (
    <Card aria-labelledby="fixed-heading" role="region" className="space-y-4 border-accent bg-accent-light">
      <div className="space-y-1">
        <h2 id="fixed-heading">Is it fixed?</h2>
        <p className="text-secondary">
          The maintenance team marked this as resolved. Confirm the fix, or tell them it is still
          broken.
        </p>
      </div>

      {mode === "idle" && (
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button onClick={() => setMode("confirm")}>Confirm fixed</Button>
          <Button variant="secondary" onClick={() => setMode("broken")}>
            Still broken
          </Button>
        </div>
      )}

      {mode === "confirm" && (
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (rating === null) {
              setError("Choose a rating from 1 to 5.");
              return;
            }
            submit(() => confirmFixedAction({ ticketId, code, category, roomId, rating, feedback }));
          }}
        >
          <fieldset className="space-y-2">
            <legend className="font-medium">How satisfied are you with the fix?</legend>
            <p className="text-secondary">1 is very unsatisfied, 5 is very satisfied.</p>
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <label
                  key={value}
                  className={`flex min-h-11 w-11 cursor-pointer items-center justify-center rounded-control border font-medium has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent ${
                    rating === value
                      ? "border-accent bg-accent text-on-accent"
                      : "border-secondary bg-surface hover:bg-background"
                  }`}
                >
                  <input
                    type="radio"
                    name="rating"
                    value={value}
                    checked={rating === value}
                    onChange={() => setRating(value)}
                    className="sr-only"
                  />
                  {value}
                </label>
              ))}
            </div>
          </fieldset>
          <FormField id="feedback" label="Feedback (optional)">
            {(control) => (
              <Textarea
                {...control}
                rows={3}
                maxLength={1000}
                value={feedback}
                onChange={(event) => setFeedback(event.target.value)}
              />
            )}
          </FormField>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button type="submit" loading={pending}>
              Close ticket
            </Button>
            <Button variant="secondary" disabled={pending} onClick={() => setMode("idle")}>
              Back
            </Button>
          </div>
        </form>
      )}

      {mode === "broken" && (
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            submit(() => stillBrokenAction({ ticketId, code, note }));
          }}
        >
          <FormField id="still-broken-note" label="What is still wrong?" required>
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
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button type="submit" loading={pending}>
              Reopen ticket
            </Button>
            <Button variant="secondary" disabled={pending} onClick={() => setMode("idle")}>
              Back
            </Button>
          </div>
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

/** For a reopened or still-open request: the requester can close it without waiting for a fix. */
export function CloseRequestActions({ ticketId, code, reopened }: { ticketId: string; code: string; reopened: boolean }) {
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  return (
    <Card role="region" aria-labelledby="close-heading" className="space-y-3">
      <div className="space-y-1">
        <h2 id="close-heading">{reopened ? "Close this reopened request" : "Close this request"}</h2>
        <p className="text-secondary">
          {reopened ? "It was reopened after the first fix. If it is sorted, or no longer needed, you can close it here." : "If you no longer need this, you can close it here."}
        </p>
      </div>
      <form
        className="space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          setError(null);
          startTransition(async () => {
            const result = await closeRequestAction({ ticketId, code, note });
            if (!result.ok) setError(result.error);
          });
        }}
      >
        <FormField id="close-note" label="Note (optional)">
          {(control) => <Textarea {...control} rows={2} maxLength={1000} value={note} onChange={(event) => setNote(event.target.value)} />}
        </FormField>
        {error && <p role="alert" className="text-status-red-dark">{error}</p>}
        <Button type="submit" variant="secondary" loading={pending}>Close request</Button>
      </form>
    </Card>
  );
}
