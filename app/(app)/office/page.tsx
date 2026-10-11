"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ReviewActions } from "@/components/events/review-actions";
import { RoleGate } from "@/components/layout/role-gate";
import { useFrontend } from "@/components/layout/frontend-provider";
import { Button, Card, EmptyState, FieldError, PageHeader, Skeleton, StatusBadge } from "@/components/ui";
import { ROLES } from "@/lib/constants/roles";
import { CERTIFICATE_LABEL, decideCertificate, listCertificates } from "@/lib/db/certificates";
import { getSupabase } from "@/lib/supabase/browser";
import { formatDay } from "@/lib/time";
import type { CertificateRow, CertificateStatus } from "@/lib/types/campus";

export default function OfficePage() {
  return <RoleGate roles={[ROLES.DEPT_OFFICE, ROLES.DEPT_HEAD, ROLES.OSA, ROLES.ADMIN]}><Reviews /></RoleGate>;
}

function Reviews() {
  const { profile } = useFrontend();
  const [rows, setRows] = useState<CertificateRow[]>();
  const [error, setError] = useState<string>();
  const [tab, setTab] = useState<"waiting" | "decided">("waiting");
  const role = profile?.role;
  const stage: CertificateStatus[] = role === ROLES.OSA ? ["PENDING_OFFICE"] : role === ROLES.ADMIN ? ["PENDING_DEPT", "PENDING_OFFICE"] : ["PENDING_DEPT"];

  const load = useCallback(async () => {
    try { setRows(await listCertificates()); setError(undefined); }
    catch { setError("Certificate requests could not be loaded. Try again."); }
  }, []);

  useEffect(() => {
    const supabase = getSupabase();
    const first = setTimeout(() => void load(), 0);
    const channel = supabase.channel("office-certificates")
      .on("postgres_changes", { event: "*", schema: "public", table: "admin_requests" }, () => void load())
      .subscribe();
    return () => { clearTimeout(first); void supabase.removeChannel(channel); };
  }, [load]);

  if (error && !rows) return <EmptyState message={error} action={<Button onClick={() => void load()}>Try again</Button>} />;
  if (!rows) return <Skeleton label="Loading certificate requests" />;

  const waiting = rows.filter((row) => stage.includes(row.status));
  const decided = rows.filter((row) => !stage.includes(row.status));
  const shown = tab === "waiting" ? [...waiting].reverse() : decided;

  return <div className="space-y-6">
    <PageHeader title="Certificate reviews" context={role === ROLES.OSA ? "Final approval for bonafide and NOC requests. Approved certificates get a verifiable PDF." : "Check requests from students of your department, then forward them to student affairs."} />
    <div role="tablist" aria-label="Request views" className="flex gap-2">
      {([["waiting", `Waiting for you (${waiting.length})`], ["decided", `Handled (${decided.length})`]] as const).map(([id, label]) => <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)}
        className={`min-h-11 rounded-control border px-4 py-2 ${tab === id ? "border-accent bg-accent-light font-medium text-accent" : "bg-surface hover:bg-background"}`}>{label}</button>)}
    </div>
    <FieldError>{error}</FieldError>
    {shown.length === 0 ? <p className="text-secondary">{tab === "waiting" ? "Nothing is waiting for you." : "No handled requests yet."}</p> :
      <ul className="space-y-4">{shown.map((row) => <li key={row.id}><Card className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0"><h2>{CERTIFICATE_LABEL[row.type]}</h2><p className="text-secondary">{row.code} · requested {formatDay(row.created_at.slice(0, 10))}</p></div>
          <StatusBadge status={row.status} />
        </div>
        <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
          <div><dt className="text-secondary">Student</dt><dd>{row.requester?.full_name}{row.requester?.roll_no ? ` (${row.requester.roll_no})` : ""}</dd></div>
          <div><dt className="text-secondary">Department</dt><dd>{row.requester?.department?.name ?? "Not set"}</dd></div>
          <div className="sm:col-span-2"><dt className="text-secondary">Purpose</dt><dd className="break-words">{row.purpose}</dd></div>
        </dl>
        {row.decision_note && <p className="text-secondary">Note: {row.decision_note}</p>}
        {tab === "waiting" ? <ReviewActions code={row.code} onDone={load} actions={row.status === "PENDING_DEPT"
          ? [{ label: "Forward", run: (note) => decideCertificate(row.id, "FORWARD", note), done: "forwarded to student affairs." }, { label: "Reject", variant: "danger", reasonLabel: "Reason for rejecting", run: (note) => decideCertificate(row.id, "REJECT", note), done: "rejected." }]
          : [{ label: "Approve", run: (note) => decideCertificate(row.id, "APPROVE", note), done: "approved. The student can download the PDF." }, { label: "Reject", variant: "danger", reasonLabel: "Reason for rejecting", run: (note) => decideCertificate(row.id, "REJECT", note), done: "rejected." }]} />
          : <Link href={`/requests/${row.id}`} className="text-link">Open details</Link>}
      </Card></li>)}</ul>}
  </div>;
}
