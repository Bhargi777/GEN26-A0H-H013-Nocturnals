"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Button, Card, EmptyState, PageHeader, Skeleton, StatusBadge, Timeline, buttonStyles } from "@/components/ui";
import type { Status } from "@/app/(app)/ui/preview-contract";
import { CERTIFICATE_LABEL, getCertificate, getCertificateTimeline } from "@/lib/db/certificates";
import { getSupabase } from "@/lib/supabase/browser";
import { formatDay } from "@/lib/time";
import type { CertificateEvent, CertificateRow } from "@/lib/types/campus";

const ACTION_LABEL: Record<string, string> = { FORWARD: "Forwarded to student affairs", APPROVE: "Approved", REJECT: "Rejected" };

export default function CertificateDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [request, setRequest] = useState<CertificateRow | null>();
  const [timeline, setTimeline] = useState<CertificateEvent[]>([]);
  const [error, setError] = useState<string>();

  const load = useCallback(async () => {
    try {
      const [row, events] = await Promise.all([getCertificate(id), getCertificateTimeline(id)]);
      setRequest(row); setTimeline(events); setError(undefined);
    } catch { setError("This request could not be loaded. Try again."); }
  }, [id]);

  useEffect(() => {
    const supabase = getSupabase();
    const first = setTimeout(() => void load(), 0);
    const channel = supabase.channel(`certificate-${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "admin_requests", filter: `id=eq.${id}` }, () => void load())
      .subscribe();
    return () => { clearTimeout(first); void supabase.removeChannel(channel); };
  }, [id, load]);

  if (error && request === undefined) return <EmptyState message={error} action={<Button onClick={() => void load()}>Try again</Button>} />;
  if (request === undefined) return <Skeleton label="Loading request" />;
  if (request === null) return <EmptyState message="This request does not exist or you cannot view it." action={<Link href="/dashboard" className={buttonStyles("secondary")}>Go to dashboard</Link>} />;

  return <div className="space-y-6">
    <PageHeader title={`${CERTIFICATE_LABEL[request.type]} ${request.code}`} context={`Requested ${formatDay(request.created_at.slice(0, 10))}`} action={<StatusBadge status={request.status} />} />
    <Card className="space-y-3">
      <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
        <div><dt className="text-secondary">Student</dt><dd>{request.requester?.full_name}{request.requester?.roll_no ? ` (${request.requester.roll_no})` : ""}</dd></div>
        <div><dt className="text-secondary">Department</dt><dd>{request.requester?.department?.name ?? "Not set"}</dd></div>
        <div className="sm:col-span-2"><dt className="text-secondary">Purpose</dt><dd className="break-words">{request.purpose}</dd></div>
      </dl>
      {request.decision_note && <p role="note" className="rounded-control border border-status-amber-dark bg-status-amber-light p-3 text-status-amber-dark">Reviewer note: {request.decision_note}</p>}
      {request.status === "APPROVED" && <div className="space-y-2">
        <p className="text-status-green-dark">Approved. The PDF carries a QR code anyone can scan to verify it.</p>
        <div className="flex flex-wrap gap-3">
          <a href={`/api/certificates/${request.id}/pdf`} download className={buttonStyles()}>Download PDF</a>
          <Link href={`/verify/${request.code}`} className={buttonStyles("secondary")} target="_blank">Open verification page</Link>
        </div>
      </div>}
    </Card>
    <section className="space-y-3" aria-labelledby="history-heading"><h2 id="history-heading">History</h2>
      <Timeline events={[{ id: "created", actor_id: request.requester_id, actor_name: request.requester?.full_name, action: "Request submitted", from_status: null, to_status: null, note: null, created_at: request.created_at },
        ...timeline.map((event) => ({ id: event.id, actor_id: event.id, actor_name: event.actor?.full_name, action: ACTION_LABEL[event.action] ?? event.action, from_status: event.from_status as Status | null, to_status: event.to_status as Status | null, note: event.note, created_at: event.created_at }))]} />
    </section>
  </div>;
}
