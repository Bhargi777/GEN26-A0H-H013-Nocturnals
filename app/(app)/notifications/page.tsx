"use client";

import Link from "next/link";
import { useState } from "react";
import { useFrontend } from "@/components/layout/frontend-provider";
import { Badge, Button, DataTable, PageHeader, buttonStyles, useToast } from "@/components/ui";

export default function NotificationsPage() {
  const { notifications, markRead } = useFrontend();
  const [busy, setBusy] = useState<string>();
  const toast = useToast();
  const unread = notifications.filter((item) => !item.read_at).length;
  const ordered = [...notifications].sort((a, b) => Number(Boolean(a.read_at)) - Number(Boolean(b.read_at)) || Date.parse(b.created_at) - Date.parse(a.created_at));
  async function mark(id?: string) {
    if (busy) return;
    setBusy(id ?? "all");
    try { await markRead(id); toast({ message: id ? "Notification marked as read." : "All notifications marked as read." }); }
    catch (cause) { toast({ tone: "error", message: cause instanceof Error ? cause.message : "Notifications could not be updated. Try again." }); }
    finally { setBusy(undefined); }
  }
  return <div className="space-y-6">
    <PageHeader title="Notifications" context={`${unread} unread. Unread notifications appear first.`} action={<Button disabled={unread === 0 || Boolean(busy)} loading={busy === "all"} onClick={() => void mark()}>Mark all read</Button>} />
    <DataTable caption="Campus notifications" rows={ordered} rowKey={(row) => row.id} rowHref={(row) => row.link} columns={[
      { id: "notification", header: "Notification", cell: (row) => <span className="block max-w-md space-y-1"><span className="block font-medium">{row.title}</span><span className="block text-secondary">{row.body}</span></span> },
      { id: "read", header: "Read status", cell: (row) => <Badge tone={row.read_at ? "slate" : "blue"}>{row.read_at ? "Read" : "Unread"}</Badge> },
      { id: "received", header: "Received", cell: (row) => <time dateTime={row.created_at}>{new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" }).format(new Date(row.created_at))}</time> },
      { id: "action", header: "Action", cell: (row) => row.read_at ? <span className="text-secondary">Already read</span> : <Button variant="secondary" size="sm" aria-label={`Mark ${row.title} as read`} disabled={Boolean(busy)} loading={busy === row.id} onClick={() => void mark(row.id)}>Mark read</Button> },
    ]} emptyMessage="You have no notifications." emptyAction={<Link href="/dashboard" className={buttonStyles("secondary")}>Go to dashboard</Link>} />
  </div>;
}
