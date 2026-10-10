"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Button } from "./button";
import { FieldError } from "./form-field";
import { keepDialogFocus } from "./dialog-focus";

export interface DialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  danger?: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
}

export function Dialog({ open, title, description, confirmLabel, danger = false, onClose, onConfirm }: DialogProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const id = useId();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (!open) { element.close(); return; }
    const previous = document.activeElement as HTMLElement | null;
    setError(undefined);
    if (!element.open) element.showModal();
    return () => { element.close(); previous?.focus(); };
  }, [open]);
  return <dialog ref={dialog} onKeyDown={keepDialogFocus} aria-labelledby={`${id}-title`} aria-describedby={`${id}-description`} onCancel={(event) => { event.preventDefault(); if (!busy) onClose(); }} className="m-auto w-[calc(100%-32px)] max-w-lg rounded-card border bg-surface p-6 text-primary backdrop:bg-primary/40">
    <div className="space-y-4">
      <h2 id={`${id}-title`}>{title}</h2>
      <p id={`${id}-description`} className="text-secondary">{description}</p>
      <FieldError>{error}</FieldError>
      <div className="flex flex-wrap justify-end gap-3">
        <Button autoFocus variant="secondary" disabled={busy} onClick={onClose}>Cancel</Button>
        <Button variant={danger ? "danger" : "primary"} loading={busy} onClick={async () => {
          setBusy(true); setError(undefined);
          try { await onConfirm(); onClose(); }
          catch (cause) { setError(cause instanceof Error ? cause.message : "The change could not be saved. Try again."); }
          finally { setBusy(false); }
        }}>{confirmLabel}</Button>
      </div>
    </div>
  </dialog>;
}
