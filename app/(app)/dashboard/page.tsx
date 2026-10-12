"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ChevronRight, CircleHelp } from "lucide-react";
import { useFrontend } from "@/components/layout/frontend-provider";
import { navigationForRole } from "@/components/layout/navigation";
import { Button, Card, DataTable, EmptyState, Skeleton, StatusBadge, buttonStyles } from "@/components/ui";
import { ROLE_LABELS } from "@/app/(app)/ui/preview-contract";
import { loadDashboardData } from "@/lib/db/dashboard";
import { dashboardFor, type DashboardModel } from "./dashboard-model";
import { useLiveRefresh } from "@/components/layout/live-sync";

const QUOTE = "When love and compassion fills your heart, you find newness in every moment, and life becomes a celebration.";

/** Circular portrait. The photo is public/portrait.jpg; initials show until it is added. */
function Portrait({ name }: { name: string }) {
  const [missing, setMissing] = useState(false);
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
  return <div className="relative h-40 w-40 shrink-0 rounded-full border-4 border-accent-light bg-accent-light">
    {missing
      ? <span role="img" aria-label={`${name} initials`} className="flex h-full w-full items-center justify-center rounded-full text-title text-accent">{initials}</span>
      // eslint-disable-next-line @next/next/no-img-element -- a fixed local photo in a small frame; optimisation adds nothing
      : <img src="/portrait.jpg" alt="" width={152} height={152} onError={() => setMissing(true)} className="h-full w-full rounded-full object-cover object-top" />}
    <span aria-hidden="true" className="absolute bottom-3 right-3 h-4 w-4 rounded-full border-2 border-surface bg-status-green-dark" />
  </div>;
}

/** One angled-icon tile, like a portal home screen. */
function Tile({ href, label, icon: Icon }: { href: string; label: string; icon: React.ComponentType<{ size?: number; "aria-hidden"?: boolean }> }) {
  return <Link href={href} className="group relative flex min-h-14 items-center overflow-hidden rounded-control border bg-surface py-3 pl-4 pr-24 uppercase text-accent hover:bg-background">
    <span className="min-w-0 break-words">{label}</span>
    <span aria-hidden="true" className="absolute inset-y-0 right-0 flex w-20 items-center justify-center bg-accent pl-4 text-on-accent [clip-path:polygon(25%_0,100%_0,100%_100%,0_100%)] group-hover:bg-accent-hover"><Icon size={18} aria-hidden /></span>
  </Link>;
}

export default function DashboardPage() {
  const { profile, notifications } = useFrontend();
  const [model, setModel] = useState<DashboardModel>();
  const [error, setError] = useState<string>();
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!profile) return;
    let cancelled = false;
    void loadDashboardData(profile).then((data) => { if (!cancelled) setModel(dashboardFor(profile, data)); }).catch(() => { if (!cancelled) setError("Your dashboard could not be loaded. Try again."); });
    return () => { cancelled = true; };
  }, [profile, attempt]);
  // Live data: reload the counts quietly when anything changes or the app comes back to the foreground
  useLiveRefresh(() => setAttempt((value) => value + 1));

  const tiles = useMemo(() => navigationForRole(profile?.role, profile?.canteen_id).filter((item) => item.href !== "/dashboard"), [profile?.role, profile?.canteen_id]);
  const alerts = useMemo(() => [...notifications].sort((a, b) => Number(Boolean(a.read_at)) - Number(Boolean(b.read_at)) || Date.parse(b.created_at) - Date.parse(a.created_at)).slice(0, 4), [notifications]);

  if (!profile) return null;
  if (error) return <EmptyState message={error} action={<Button onClick={() => { setError(undefined); setModel(undefined); setAttempt((value) => value + 1); }}>Try again</Button>} />;

  return <div className="space-y-8">
    <h1 className="break-words text-accent">Welcome! {profile.full_name.toUpperCase()} <span className="whitespace-nowrap">( {ROLE_LABELS[profile.role]} )</span></h1>

    <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
      <Card className="flex flex-col-reverse gap-6 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 space-y-4">
          <span aria-hidden="true" className="block text-[56px] font-bold leading-none text-status-amber-dark">“</span>
          <p className="max-w-prose text-accent">{QUOTE}</p>
          <p className="font-semibold text-accent">— Amma</p>
          {model && <p className="text-secondary">{model.context}</p>}
        </div>
        <Portrait name={profile.full_name} />
      </Card>

      <Card className="space-y-4 p-6" role="region" aria-labelledby="alerts-heading">
        <h2 id="alerts-heading" className="text-accent">Alerts</h2>
        {alerts.length === 0 ? <p className="text-secondary">You are all caught up.</p> : <ul className="space-y-3">{alerts.map((alert) => <li key={alert.id}>
          <Link href={alert.link} className="flex items-start gap-3 text-link no-underline">
            <ChevronRight size={16} aria-hidden="true" className="mt-1 shrink-0 text-secondary" />
            <CircleHelp size={18} aria-hidden="true" className="mt-0.5 shrink-0 text-secondary" />
            <span className="min-w-0 break-words">{alert.title}{!alert.read_at && <span className="ml-2 rounded-full bg-accent px-2 text-on-accent">new</span>}</span>
          </Link>
        </li>)}</ul>}
        <Link href="/notifications" className="text-link inline-block py-1">View all notifications</Link>
      </Card>
    </div>

    <nav aria-label="Your sections">
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{tiles.map((item) => <li key={item.href}><Tile href={item.href} label={item.label} icon={item.icon} /></li>)}</ul>
    </nav>

    {!model ? <Skeleton label="Loading your summary" /> : <section className="space-y-4" aria-labelledby="summary-heading">
      <h2 id="summary-heading" className="text-accent">At a glance</h2>
      <Card><dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">{model.stats.map((stat) => <div key={stat.label} className="space-y-1"><dt className="text-secondary">{stat.label}</dt><dd className="text-title tabular-nums">{stat.value}</dd></div>)}</dl></Card>
      <h2 className="text-accent">{model.heading}</h2>
      <DataTable caption={model.heading} rows={model.rows} rowKey={(row) => row.id} rowHref={(row) => row.href} columns={[
        { id: "code", header: "Reference", cell: (row) => row.code, sortValue: (row) => row.code },
        { id: "title", header: "Details", cell: (row) => row.title, sortValue: (row) => row.title },
        { id: "status", header: "Status", cell: (row) => <StatusBadge status={row.status} />, sortValue: (row) => row.status },
        { id: "date", header: "Submitted", cell: (row) => <time dateTime={row.created_at}>{new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" }).format(new Date(row.created_at))}</time>, sortValue: (row) => row.created_at },
      ]} emptyMessage="There are no items to display." emptyAction={<Link href={model.action.href} className={buttonStyles("secondary")}>{model.action.label}</Link>} />
    </section>}
  </div>;
}
