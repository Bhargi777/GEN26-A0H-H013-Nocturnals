"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useFrontend } from "@/components/layout/frontend-provider";
import { Button, EmptyState, Skeleton } from "@/components/ui";

export function AuthGate({ children }: { children: ReactNode }) {
  const { profile, ready, error, refresh } = useFrontend();
  const router = useRouter();
  useEffect(() => { if (ready && profile && !error) router.replace("/dashboard"); }, [ready, profile, error, router]);
  if (!ready) return <Skeleton label="Checking your account" rows={2} />;
  if (error) return <EmptyState message={error} action={<Button onClick={() => void refresh()}>Try again</Button>} />;
  if (profile) return <Skeleton label="Opening dashboard" rows={2} />;
  return children;
}
