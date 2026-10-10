"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { useFrontend } from "@/components/layout/frontend-provider";
import { Button, FieldError, FormField, Input } from "@/components/ui";

export const signInSchema = z.object({
  email: z.string().trim().email("Enter a valid campus email address.").max(254, "Email must be at most 254 characters."),
  password: z.string().min(1, "Enter your password.").max(128, "Password must be at most 128 characters."),
});

export function AuthForm() {
  const { adapter, refresh } = useFrontend();
  const router = useRouter();
  const form = useRef<HTMLFormElement>(null);
  const summary = useRef<HTMLDivElement>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  useEffect(() => { form.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(); }, [errors]);
  useEffect(() => { if (error) summary.current?.focus(); }, [error]);
  return <div className="space-y-6">
    <div className="space-y-2"><h1>Sign in</h1><p className="text-secondary">Only campus accounts are accepted.</p></div>
    <form ref={form} noValidate className="space-y-4" onSubmit={async (event) => {
      event.preventDefault();
      if (busy) return;
      setError(undefined);
      const values = new FormData(event.currentTarget);
      const result = signInSchema.safeParse({ email: values.get("email"), password: values.get("password") });
      if (!result.success) { setErrors(Object.fromEntries(result.error.issues.map((issue) => [issue.path[0], issue.message]))); return; }
      setErrors({}); setBusy(true);
      try {
        const response = await adapter.signIn(result.data);
        if (response.error) setError(response.error);
        else { await refresh(); router.replace("/dashboard"); }
      } catch { setError("Sign-in could not be completed. Check your connection and try again."); }
      finally { setBusy(false); }
    }}>
      <fieldset disabled={busy} className="space-y-4">
        <legend className="sr-only">Campus account details</legend>
        <FormField label="Campus email" required error={errors.email}>{(control) => <Input {...control} name="email" type="email" autoComplete="email" autoCapitalize="none" maxLength={254} />}</FormField>
        <FormField label="Password" required error={errors.password}>{(control) => <Input {...control} name="password" type="password" autoComplete="current-password" maxLength={128} />}</FormField>
      </fieldset>
      <div ref={summary} tabIndex={error ? -1 : undefined}><FieldError>{error}</FieldError></div>
      <Button type="submit" loading={busy} className="w-full">Sign in</Button>
    </form>
    <p className="text-secondary">Need a campus account? <Link href="/sign-up" className="text-link">Create an account</Link></p>
  </div>;
}
