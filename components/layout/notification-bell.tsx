"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { Bell } from "lucide-react";
import { useFrontend } from "./frontend-provider";

export function NotificationBell() {
  const { notifications, markRead } = useFrontend();
  const details = useRef<HTMLDetailsElement>(null);
  const summary = useRef<HTMLElement>(null);
  const unread = notifications.filter((item) => !item.read_at).length;
  const latest = [...notifications].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at)).slice(0, 5);
  useEffect(() => {
    function outside(event: PointerEvent) { if (event.target instanceof Node && details.current && !details.current.contains(event.target)) details.current.open = false; }
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, []);
  function close() { if (details.current) details.current.open = false; }
  return <details ref={details} className="relative" onKeyDown={(event) => { if (event.key === "Escape") { close(); summary.current?.focus(); event.stopPropagation(); } }} onBlur={(event) => { if (event.relatedTarget instanceof Node && !event.currentTarget.contains(event.relatedTarget)) close(); }}>
    <summary ref={summary} aria-label={`Notifications, ${unread} unread`} className="flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-control px-2 text-accent [&::-webkit-details-marker]:hidden"><Bell size={16} aria-hidden="true" /><span aria-hidden="true">{unread}</span></summary>
    <div className="fixed left-4 right-4 top-24 z-40 space-y-3 rounded-card border border-secondary bg-surface p-4 md:absolute md:left-auto md:right-0 md:top-full md:w-80">
      <h2>Notifications</h2>
      <p className="text-secondary">{unread} unread</p>
      {latest.length ? <ul className="max-h-80 divide-y overflow-y-auto">{latest.map((item) => <li key={item.id}><Link href={item.link} onClick={() => { close(); if (!item.read_at) void markRead(item.id).catch(() => undefined); }} className="block space-y-1 rounded-control py-3 hover:bg-background"><span className="block text-accent underline">{item.title}</span><span className="block text-secondary">{item.body}</span><span className="block font-medium">{item.read_at ? "Read" : "Unread"}</span></Link></li>)}</ul> : <p>You have no notifications.</p>}
      <Link href="/notifications" onClick={close} className="text-link inline-block py-2">View all notifications</Link>
    </div>
  </details>;
}
