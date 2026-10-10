"use client";

import { useState, useTransition } from "react";
import {
  confirmFixedAction,
  stillBrokenAction,
  type ActionResult,
} from "@/app/(app)/service-requests/actions";
import type { TicketCategory } from "@/app/(app)/service-requests/_lib/labels";
import { Button } from "./button";
import { Field, inputClass } from "./form-field";

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
    <section
      aria-labelledby="fixed-heading"
      className="space-y-4 rounded-lg border border-teal-700/30 bg-teal-50 p-4 sm:p-6"
    >
      <div>
        <h2 id="fixed-heading" className="text-base font-semibold text-slate-900">
          Is it fixed?
        </h2>
        <p className="mt-1 text-sm text-slate-600">
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
            submit(() =>
              confirmFixedAction({ ticketId, code, category, roomId, rating, feedback }),
            );
          }}
        >
          <fieldset>
            <legend className="text-sm font-medium text-slate-900">
              How satisfied are you with the fix?
            </legend>
            <p className="text-sm text-slate-600">1 is very unsatisfied, 5 is very satisfied.</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <label
                  key={value}
                  className={`flex h-9 w-11 cursor-pointer items-center justify-center rounded-md border text-sm font-medium has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-teal-700 ${
                    rating === value
                      ? "border-teal-700 bg-teal-700 text-white"
                      : "border-slate-200 bg-white text-slate-900 hover:bg-slate-50"
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
          <Field id="feedback" label="Feedback" optional>
            <textarea
              id="feedback"
              rows={3}
              maxLength={1000}
              value={feedback}
              onChange={(event) => setFeedback(event.target.value)}
              className={inputClass}
            />
          </Field>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button type="submit" disabled={pending}>
              {pending ? "Closing..." : "Close ticket"}
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
          <Field id="still-broken-note" label="What is still wrong?">
            <textarea
              id="still-broken-note"
              rows={3}
              required
              minLength={5}
              maxLength={1000}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              className={inputClass}
            />
          </Field>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button type="submit" disabled={pending}>
              {pending ? "Reopening..." : "Reopen ticket"}
            </Button>
            <Button variant="secondary" disabled={pending} onClick={() => setMode("idle")}>
              Back
            </Button>
          </div>
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
