"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { RoleGate } from "@/components/layout/role-gate";
import { useFrontend } from "@/components/layout/frontend-provider";
import { Button, DataTable, EmptyState, PageHeader, Skeleton, StatusBadge, buttonStyles } from "@/components/ui";
import { ROLES } from "@/lib/constants/roles";
import { CERTIFICATE_LABEL, listCertificates } from "@/lib/db/certificates";
import { getSupabase } from "@/lib/supabase/browser";
import type { CertificateRow } from "@/lib/types/campus";

export default function CertificatesPage() {
  return <RoleGate roles={[ROLES.STUDENT, ROLES.CR, ROLES.CLUB_PRESIDENT, ROLES.ADMIN]}><MyCertificates /></RoleGate>;
}

function MyCertificates() {
  const { profile } = useFrontend();
  const userId = profile?.id;
  const [rows, setRows] = useState<CertificateRow[]>();
  const [error, setError] = useState<string>();

  const load = useCallback(async () => {
    if (!userId) return;
    try { setRows(await listCertificates({ requesterId: userId })); setError(undefined); }
    catch { setError("Your certificate requests could not be loaded. Try again."); }
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    const supabase = getSupabase();
    const first = setTimeout(() => void load(), 0);
    const channel = supabase.channel(`my-certificates-${userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "admin_requests", filter: `requester_id=eq.${userId}` }, () => void load())
      .subscribe();
    return () => { clearTimeout(first); void supabase.removeChannel(channel); };
  }, [load, userId]);

  if (error && !rows) return <EmptyState message={error} action={<Button onClick={() => void load()}>Try again</Button>} />;
  if (!rows) return <Skeleton label="Loading certificate requests" />;

  return <div className="space-y-6">
    <PageHeader title="My certificates" context="Bonafide and no objection certificates. Approved ones can be downloaded as a verifiable PDF." action={<Link href="/requests/new" className={buttonStyles()}>Request a certificate</Link>} />
    <DataTable caption="My certificate requests" rows={rows} rowKey={(row) => row.id} columns={[
      { id: "code", header: "Request", cell: (row) => row.code, sortValue: (row) => row.code },
      { id: "type", header: "Certificate", cell: (row) => <span className="block"><span className="block font-medium">{CERTIFICATE_LABEL[row.type]}</span><span className="block text-secondary">{row.purpose}</span></span> },
      { id: "status", header: "Status", cell: (row) => <StatusBadge status={row.status} />, sortValue: (row) => row.status },
      { id: "created", header: "Requested", cell: (row) => new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" }).format(new Date(row.created_at)), sortValue: (row) => row.created_at },
      { id: "open", header: "Details", cell: (row) => <Link href={`/requests/${row.id}`} className="text-link" aria-label={`Open ${row.code}`}>Open</Link> },
    ]} emptyMessage="You have not requested a certificate yet." emptyAction={<Link href="/requests/new" className={buttonStyles("secondary")}>Request a certificate</Link>} />
  </div>;
}
