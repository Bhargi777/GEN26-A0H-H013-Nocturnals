"use client";

import { useCallback, useEffect, useState } from "react";
import { RoleGate } from "@/components/layout/role-gate";
import { Button, Card, EmptyState, PageHeader, Skeleton } from "@/components/ui";
import { ROLES } from "@/lib/constants/roles";
import { loadCampusReport, type CampusReport } from "@/lib/db/reports";
import { useLiveRefresh } from "@/components/layout/live-sync";

export default function ReportsPage() {
  return <RoleGate roles={[ROLES.ADMIN, ROLES.CAMPUS_DIRECTOR]}><Reports /></RoleGate>;
}

const label = (key: string) => key.replace(/_/g, " ").toLowerCase().replace(/^./, (c) => c.toUpperCase());
const clock = (hour: number) => `${hour % 12 || 12}${hour >= 12 ? " PM" : " AM"}`;

interface Bar { name: string; value: number; extra?: number; note?: string }

/** Horizontal bars with the value printed in text, so nothing depends on colour alone. */
function Bars({ title, caption, rows, unit }: { title: string; caption: string; rows: Bar[]; unit?: string }) {
  const max = Math.max(1, ...rows.map((row) => row.value));
  return <Card className="space-y-3">
    <div><h2>{title}</h2><p className="text-secondary">{caption}</p></div>
    {rows.length === 0 ? <p className="text-secondary">No data yet.</p> : <ul className="space-y-2">
      {rows.map((row) => <li key={row.name} className="space-y-1">
        <div className="flex justify-between gap-3"><span className="min-w-0 break-words">{row.name}</span><span className="tabular-nums">{row.value}{unit}{row.note ? ` · ${row.note}` : ""}</span></div>
        <div className="h-3 overflow-hidden rounded-full bg-background" role="img" aria-label={`${row.name}: ${row.value}${unit ?? ""}`}>
          <div className="h-3 rounded-full bg-accent" style={{ width: `${(row.value / max) * 100}%` }} />
        </div>
      </li>)}
    </ul>}
  </Card>;
}

function Reports() {
  const [report, setReport] = useState<CampusReport>();
  const [error, setError] = useState<string>();
  const load = useCallback(async () => {
    try { setReport(await loadCampusReport()); setError(undefined); }
    catch { setError("The report could not be loaded. Try again."); }
  }, []);
  useLiveRefresh(load);
  useEffect(() => { const first = setTimeout(() => void load(), 0); return () => clearTimeout(first); }, [load]);

  if (error && !report) return <EmptyState message={error} action={<Button onClick={() => void load()}>Try again</Button>} />;
  if (!report) return <Skeleton label="Loading campus report" rows={5} />;

  const sum = (record: Record<string, number>) => Object.values(record).reduce((total, value) => total + value, 0);
  const openTickets = report.tickets_by_category.reduce((total, row) => total + row.open, 0);
  const overdue = report.tickets_by_category.reduce((total, row) => total + row.overdue, 0);
  const stats = [
    { label: "Open service requests", value: openTickets },
    { label: "Overdue service requests", value: overdue },
    { label: "Room requests pending", value: report.room_requests.PENDING ?? 0 },
    { label: "Canteen orders", value: report.canteen_totals.orders },
    { label: "Canteen revenue", value: `₹${Number(report.canteen_totals.revenue).toLocaleString("en-IN")}` },
    { label: "Events in the pipeline", value: sum(report.events_by_status) },
  ];

  return <div className="space-y-6">
    <PageHeader title="Campus pulse" context="One view of service requests, rooms, canteen and events." />
    <Card><dl className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">{stats.map((stat) => <div key={stat.label} className="space-y-1"><dt className="text-secondary">{stat.label}</dt><dd className="text-title tabular-nums">{stat.value}</dd></div>)}</dl></Card>
    <div className="grid gap-6 lg:grid-cols-2">
      <Bars title="Service requests by category" caption="Total requests. Overdue means past the response target for its priority." rows={report.tickets_by_category.map((row) => ({ name: label(row.category), value: row.total, note: `${row.open} open, ${row.overdue} overdue${row.avg_hours != null ? `, avg ${row.avg_hours} h to resolve` : ""}` }))} />
      <Bars title="Room use by period" caption="Scheduled classes plus approved bookings across the week." rows={report.room_use_by_period.map((row) => ({ name: row.period, value: row.classes + row.approved, note: `${row.classes} classes, ${row.approved} booked` }))} />
      <Bars title="Canteen orders by pickup hour" caption="Where the queue builds up." rows={report.canteen_by_hour.map((row) => ({ name: clock(row.hour), value: row.orders }))} />
      <Bars title="Events by status" caption="Where each club request is in the approval chain." rows={Object.entries(report.events_by_status).map(([name, value]) => ({ name: label(name), value }))} />
      <Bars title="Room requests by status" caption="Faculty and class representative requests." rows={Object.entries(report.room_requests).map(([name, value]) => ({ name: label(name), value }))} />
    </div>
  </div>;
}
