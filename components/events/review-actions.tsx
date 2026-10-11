"use client";

import { useState } from "react";
import { Button, FormField, Textarea, useToast, type ButtonVariant } from "@/components/ui";

export interface ReviewAction {
  label: string;
  variant?: ButtonVariant;
  /** When set, a written reason is required before the action runs. */
  reasonLabel?: string;
  run: (reason: string) => Promise<void>;
  done: string;
}

/** Buttons for a reviewer, with an inline reason box for actions that need one. */
export function ReviewActions({ code, actions, onDone }: { code: string; actions: ReviewAction[]; onDone: () => Promise<void> }) {
  const toast = useToast();
  const [asking, setAsking] = useState<ReviewAction>();
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  async function run(action: ReviewAction, text: string) {
    if (busy) return;
    if (action.reasonLabel && text.trim().length < 3) { setError("Enter a reason of at least 3 characters."); return; }
    setBusy(true); setError(undefined);
    try {
      await action.run(text.trim());
      toast({ message: `${code}: ${action.done}` });
      setAsking(undefined); setReason("");
      await onDone();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "That change failed. Try again."); }
    finally { setBusy(false); }
  }

  return <div className="space-y-3">
    {asking ? <div className="space-y-3 rounded-control border bg-background p-3" role="group" aria-label={asking.label}>
      <FormField label={asking.reasonLabel ?? "Reason"} required error={error}>{(control) => <Textarea {...control} autoFocus rows={3} maxLength={300} value={reason} onChange={(event) => { setReason(event.target.value); setError(undefined); }} />}</FormField>
      <div className="flex flex-wrap gap-3">
        <Button variant={asking.variant} loading={busy} onClick={() => void run(asking, reason)}>{asking.label}</Button>
        <Button variant="secondary" disabled={busy} onClick={() => { setAsking(undefined); setReason(""); setError(undefined); }}>Cancel</Button>
      </div>
    </div> : <div className="flex flex-wrap gap-3">
      {actions.map((action) => <Button key={action.label} variant={action.variant} loading={busy && !action.reasonLabel} aria-label={`${action.label} ${code}`}
        onClick={() => action.reasonLabel ? setAsking(action) : void run(action, "")}>{action.label}</Button>)}
    </div>}
    {!asking && error && <p role="alert" className="text-status-red-dark">{error}</p>}
  </div>;
}
