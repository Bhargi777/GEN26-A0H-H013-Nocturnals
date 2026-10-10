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
    const breakpoint = window.matchMedia("(min-width: 768px)");
    const close = () => { if (breakpoint.matches) setOpen(false); };
    breakpoint.addEventListener("change", close);
    return () => { breakpoint.removeEventListener("change", close); element.close(); if (open) trigger.current?.focus(); };
  }, [open]);
  return <div className="md:hidden">
    <Button ref={trigger} variant="secondary" size="sm" aria-expanded={open} aria-controls={id} onClick={() => setOpen(true)}><Menu size={16} aria-hidden="true" />Menu</Button>
    <dialog ref={dialog} id={id} onKeyDown={keepDialogFocus} aria-labelledby={`${id}-title`} onCancel={(event) => { event.preventDefault(); setOpen(false); }} className="m-0 h-dvh max-h-none w-80 max-w-[calc(100%-32px)] rounded-none border-r bg-surface p-4 text-primary backdrop:bg-primary/40">
      <div className="mb-6 flex items-center justify-between gap-3"><h2 id={`${id}-title`}>CampusConnect</h2><Button autoFocus variant="ghost" size="sm" aria-label="Close menu" onClick={() => setOpen(false)}><X size={16} aria-hidden="true" /></Button></div>
      <Navigation role={role} onNavigate={() => setOpen(false)} />
    </dialog>
  </div>;
}
