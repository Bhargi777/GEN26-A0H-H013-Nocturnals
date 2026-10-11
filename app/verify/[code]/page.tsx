import { createClient } from "@supabase/supabase-js";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = { title: "Verify a certificate" };

interface Verified { code: string; type: string; holder: string; department: string | null; issued_on: string }

async function Result({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false } });
  const { data, error } = await supabase.rpc("verify_certificate", { p_code: decodeURIComponent(code) });
  const found = (data as Verified[] | null)?.[0];

  if (error) return <div role="alert" className="space-y-2 rounded-card border border-status-amber-dark bg-status-amber-light p-6 text-status-amber-dark"><h1>Verification is unavailable</h1><p>Try again in a moment.</p></div>;
  if (!found) return <div role="alert" className="space-y-2 rounded-card border border-status-red-dark bg-status-red-light p-6 text-status-red-dark"><h1>Not a valid certificate</h1><p>No approved certificate has the number {decodeURIComponent(code)}. Check the number on the document.</p></div>;

  const issued = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata" }).format(new Date(found.issued_on));
  return <div role="status" className="space-y-4 rounded-card border border-status-green-dark bg-status-green-light p-6">
    <h1 className="text-status-green-dark">Valid certificate</h1>
    <dl className="grid gap-3 sm:grid-cols-2">
      <div><dt className="text-secondary">Certificate number</dt><dd className="font-medium">{found.code}</dd></div>
      <div><dt className="text-secondary">Type</dt><dd className="font-medium">{found.type === "NOC" ? "No objection certificate" : "Bonafide certificate"}</dd></div>
      <div><dt className="text-secondary">Issued to</dt><dd className="font-medium">{found.holder}</dd></div>
      <div><dt className="text-secondary">Department</dt><dd className="font-medium">{found.department ?? "Not recorded"}</dd></div>
      <div><dt className="text-secondary">Issued on</dt><dd className="font-medium">{issued}</dd></div>
    </dl>
  </div>;
}

export default function VerifyPage({ params }: { params: Promise<{ code: string }> }) {
  return <main className="mx-auto min-h-screen max-w-xl space-y-6 p-4 md:p-8">
    <p className="font-semibold text-accent">CampusConnect</p>
    <Suspense fallback={<p role="status" className="text-secondary">Checking certificate…</p>}><Result params={params} /></Suspense>
  </main>;
}
