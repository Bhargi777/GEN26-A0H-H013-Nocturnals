"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useFrontend } from "@/components/layout/frontend-provider";
import { Button, Card, DataTable, EmptyState, PageHeader, Skeleton, StatusBadge, buttonStyles } from "@/components/ui";
import { dashboardFor, type DashboardModel } from "./dashboard-model";

export default function DashboardPage() {
  const { adapter, profile } = useFrontend();
  const [model, setModel] = useState<DashboardModel>();
  const [error, setError] = useState<string>();
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!profile) return;
    let cancelled = false;
    setModel(undefined); setError(undefined);
    void adapter.getDashboard(profile).then((data) => { if (!cancelled) setModel(dashboardFor(profile, data.tickets, data.requests)); }).catch(() => { if (!cancelled) setError("Your dashboard could not be loaded. Try again."); });
    return () => { cancelled = true; };
  }, [adapter, profile, attempt]);
  if (error) return <EmptyState message={error} action={<Button onClick={() => setAttempt((value) => value + 1)}>Try again</Button>} />;
  if (!model) return <Skeleton label="Loading dashboard" />;
  return <div className="space-y-6">
    <PageHeader title="Dashboard" context={model.context} action={<Link href={model.action.href} className={buttonStyles()}>{model.action.label}</Link>} />
    <Card><dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">{model.stats.map((stat) => <div key={stat.label} className="space-y-1"><dt className="text-secondary">{stat.label}</dt><dd className="text-title tabular-nums">{stat.value}</dd></div>)}</dl></Card>
    <section className="space-y-3" aria-labelledby="recent-heading"><h2 id="recent-heading">{model.heading}</h2>
      <DataTable caption={model.heading} rows={model.rows} rowKey={(row) => row.id} rowHref={(row) => row.href} columns={[
        { id: "code", header: "Reference", cell: (row) => row.code, sortValue: (row) => row.code },
        { id: "title", header: "Details", cell: (row) => row.title, sortValue: (row) => row.title },
        { id: "status", header: "Status", cell: (row) => <StatusBadge status={row.status} />, sortValue: (row) => row.status },
        { id: "date", header: "Submitted", cell: (row) => <time dateTime={row.created_at}>{new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" }).format(new Date(row.created_at))}</time>, sortValue: (row) => row.created_at },
      ]} emptyMessage="There are no items to display." emptyAction={<Link href={model.action.href} className={buttonStyles("secondary")}>{model.action.label}</Link>} />
    </section>
  </div>;
}
