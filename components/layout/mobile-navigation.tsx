"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import type { Role } from "@/app/(app)/ui/preview-contract";
import { Button } from "@/components/ui/button";
import { Navigation } from "./navigation";
import { keepDialogFocus } from "@/components/ui/dialog-focus";

export function MobileNavigation({ role }: { role?: Role }) {
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const id = useId();
  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open) element.showModal(); else element.close();
    const trigger_ = trigger.current;
    return () => { element.close(); if (open) trigger_?.focus(); };
  }, [open]);
  return <div>
    <button ref={trigger} type="button" aria-expanded={open} aria-controls={id} onClick={() => setOpen(true)} className="inline-flex min-h-11 items-center gap-2 rounded-control border border-on-accent px-3 py-2 font-medium text-on-accent hover:bg-accent-hover"><Menu size={18} aria-hidden="true" />Menu</button>
    <dialog ref={dialog} id={id} onKeyDown={keepDialogFocus} aria-labelledby={`${id}-title`} onCancel={(event) => { event.preventDefault(); setOpen(false); }} className="m-0 h-dvh max-h-none w-80 max-w-[calc(100%-32px)] rounded-none border-r bg-surface p-4 text-primary backdrop:bg-primary/40">
      <div className="mb-6 flex items-center justify-between gap-3"><h2 id={`${id}-title`}>ourAmrita</h2><Button autoFocus variant="ghost" size="sm" aria-label="Close menu" onClick={() => setOpen(false)}><X size={16} aria-hidden="true" /></Button></div>
      <Navigation role={role} onNavigate={() => setOpen(false)} />
    </dialog>
  </div>;
}
