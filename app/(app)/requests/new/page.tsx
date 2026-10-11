"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { RoleGate } from "@/components/layout/role-gate";
import { Button, FieldError, FormField, PageHeader, Select, Textarea, useToast } from "@/components/ui";
import { ROLES } from "@/lib/constants/roles";
import { createCertificateRequest } from "@/lib/db/certificates";
import type { CertificateType } from "@/lib/types/campus";

export default function NewCertificatePage() {
  return <RoleGate roles={[ROLES.STUDENT, ROLES.CR, ROLES.CLUB_PRESIDENT]}><NewCertificate /></RoleGate>;
}

function NewCertificate() {
  const router = useRouter();
  const toast = useToast();
  const [type, setType] = useState<CertificateType>("BONAFIDE");
  const [purpose, setPurpose] = useState("");
  const [purposeError, setPurposeError] = useState<string>();
  const [formError, setFormError] = useState<string>();
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setFormError(undefined);
    if (purpose.trim().length < 5) { setPurposeError("Describe the purpose in at least 5 characters."); return; }
    setPurposeError(undefined);
    setBusy(true);
    try {
      const request = await createCertificateRequest(type, purpose.trim());
      toast({ message: `Request ${request.code} submitted.` });
      router.push(`/requests/${request.id}`);
    } catch (cause) { setFormError(cause instanceof Error ? cause.message : "The request could not be sent. Try again."); }
    finally { setBusy(false); }
  }

  return <div className="space-y-6">
    <PageHeader title="Request a certificate" context="Bonafide certificates go to student affairs. No objection certificates are checked by your department first." />
    <form noValidate onSubmit={submit} className="max-w-xl space-y-5 rounded-card border bg-surface p-4 md:p-6">
      <fieldset disabled={busy} className="space-y-5">
        <legend className="sr-only">Certificate details</legend>
        <FormField label="Certificate" required>{(c) => <Select {...c} value={type} onChange={(event) => setType(event.target.value as CertificateType)}><option value="BONAFIDE">Bonafide certificate</option><option value="NOC">No objection certificate (NOC)</option></Select>}</FormField>
        <FormField label="Purpose" required help="For example: opening a bank account, internship at a company, passport application." error={purposeError}>{(c) => <Textarea {...c} value={purpose} maxLength={300} onChange={(event) => setPurpose(event.target.value)} />}</FormField>
      </fieldset>
      <div aria-live="polite"><FieldError>{formError}</FieldError></div>
      <Button type="submit" loading={busy}>Submit request</Button>
    </form>
  </div>;
}
