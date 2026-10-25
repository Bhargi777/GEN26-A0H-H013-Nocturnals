"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { useFrontend } from "@/components/layout/frontend-provider";
import { Button, FieldError, FormField, Input } from "@/components/ui";

export const signInSchema = z.object({
  email: z.string().trim().email("Enter a valid campus email address.").max(254, "Email must be at most 254 characters."),
  password: z.string().min(1, "Enter your password.").max(128, "Password must be at most 128 characters."),
});
export const signUpSchema = signInSchema.extend({
  fullName: z.string().trim().min(2, "Enter your full name.").max(100, "Name must be at most 100 characters.").regex(/^[\p{L}][\p{L} .'-]*$/u, "Use letters only in your name."),
  password: z.string().min(8, "Use at least 8 characters for your password.").max(128, "Password must be at most 128 characters.")
    .refine((value) => /[A-Za-z]/.test(value) && /\d/.test(value), "Use letters and at least one number in your password."),
});

const DEMO_ACCOUNTS = [
  ["Student", "arjun.s@example.edu"], ["Class rep", "cr.cse@example.edu"], ["Faculty", "dr.rao@example.edu"],
  ["CSE office (AB-3)", "office.cse@example.edu"], ["Electrical office (AB-2)", "office.elec@example.edu"], ["Club president", "club.president@example.edu"], ["Student affairs", "osa.staff@example.edu"],
  ["Campus director", "director.campus@example.edu"], ["Events dept", "events.dept@example.edu"], ["Main counter", "counter.main@example.edu"],
  ["Main kitchen", "kitchen.main@example.edu"], ["Main manager", "canteen.manager@example.edu"], ["IT kitchen", "kitchen.north@example.edu"], ["IT manager", "manager.north@example.edu"], ["IT office", "office.it@example.edu"], ["Natya president", "ieee.president@example.edu"], ["Technician", "ramesh.t@example.edu"], ["Admin", "admin.sys@example.edu"],
] as const;
const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export function AuthForm({ mode = "sign-in" }: { mode?: "sign-in" | "sign-up" }) {
  const signingUp = mode === "sign-up";
  const { adapter, refresh } = useFrontend();
  const router = useRouter();
  const form = useRef<HTMLFormElement>(null);
  const summary = useRef<HTMLDivElement>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string>();
  useEffect(() => { form.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(); }, [errors]);
  useEffect(() => { if (error) summary.current?.focus(); }, [error]);
  return <div className="space-y-6">
    <div className="space-y-2"><h1>{signingUp ? "Create an account" : "Sign in"}</h1><p className="text-secondary">Only campus accounts are accepted.</p></div>
    <form ref={form} noValidate className="space-y-4" onSubmit={async (event) => {
      event.preventDefault();
      if (busy) return;
      setError(undefined);
      setMessage(undefined);
      const values = new FormData(event.currentTarget);
      const input = { email: values.get("email"), password: values.get("password"), fullName: values.get("fullName") };
      const result = (signingUp ? signUpSchema : signInSchema).safeParse(input);
      if (!result.success) { setErrors(Object.fromEntries(result.error.issues.map((issue) => [issue.path[0], issue.message]))); return; }
      setErrors({}); setBusy(true);
      try {
        const response = signingUp ? await adapter.signUp(signUpSchema.parse(input)) : await adapter.signIn(result.data);
        if (response.error) setError(response.error);
        else if (signingUp) { setMessage(response.message ?? "Account created. Check your campus email for the next step."); form.current?.reset(); }
        else { await refresh(); router.replace("/dashboard"); }
      } catch { setError(`${signingUp ? "Registration" : "Sign-in"} could not be completed. Check your connection and try again.`); }
      finally { setBusy(false); }
    }}>
      <fieldset disabled={busy} className="space-y-4">
        <legend className="sr-only">Campus account details</legend>
        {signingUp && <FormField label="Full name" required error={errors.fullName}>{(control) => <Input {...control} name="fullName" autoComplete="name" maxLength={100} />}</FormField>}
        <FormField label="Campus email" required error={errors.email}>{(control) => <Input {...control} name="email" type="email" autoComplete="email" autoCapitalize="none" maxLength={254} />}</FormField>
        <FormField label="Password" required help={signingUp ? "Use at least 8 characters." : undefined} error={errors.password}>{(control) => <Input {...control} name="password" type="password" autoComplete={signingUp ? "new-password" : "current-password"} maxLength={128} />}</FormField>
      </fieldset>
      <div ref={summary} tabIndex={error ? -1 : undefined}><FieldError>{error}</FieldError></div>
      {message && <p role="status" className="text-status-green-dark">{message}</p>}
      <Button type="submit" loading={busy} className="w-full">{signingUp ? "Create account" : "Sign in"}</Button>
    </form>
    {demoMode && !signingUp && <section aria-labelledby="demo-heading" className="space-y-2 rounded-control border bg-background p-3">
      <h2 id="demo-heading">Demo accounts</h2>
      <p className="text-secondary">Sign in as a seeded user to see each role.</p>
      <div className="flex flex-wrap gap-2">{DEMO_ACCOUNTS.map(([label, email]) => <Button key={email} size="sm" variant="secondary" disabled={busy} onClick={async () => {
        setBusy(true); setError(undefined);
        try {
          const response = await adapter.signIn({ email, password: "password123" });
          if (response.error) setError(response.error); else { await refresh(); router.replace("/dashboard"); }
        } catch { setError("Demo sign-in failed. Is the local database running?"); }
        finally { setBusy(false); }
      }}>{label}</Button>)}</div>
    </section>}
    <p className="text-secondary">Accounts are created by your campus administrator.</p>
  </div>;
}
