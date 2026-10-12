"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { useFrontend } from "./frontend-provider";

/** A plain link with the unread count. No dropdown: the full list is on the notifications page. */
export function NotificationBell() {
  const { notifications } = useFrontend();
  const unread = notifications.filter((item) => !item.read_at).length;
  return <Link href="/notifications" aria-label={`Notifications, ${unread} unread`} className="flex min-h-11 items-center gap-2 rounded-control px-2 text-on-accent">
    <Bell size={16} aria-hidden="true" /><span aria-hidden="true">{unread}</span>
  </Link>;
}
