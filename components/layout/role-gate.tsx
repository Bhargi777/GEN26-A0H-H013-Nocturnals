"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import type { Role } from "@/app/(app)/ui/preview-contract";
import { EmptyState, buttonStyles } from "@/components/ui";
import { useFrontend } from "./frontend-provider";

/** Hides a page from roles that cannot use it. RLS and the RPCs still enforce access on the server. */
export function RoleGate({ roles, children }: { roles: readonly Role[]; children: ReactNode }) {
  const { profile } = useFrontend();
  if (!profile) return null;
  if (!roles.includes(profile.role)) {
    return <EmptyState message="Your role does not have access to this page." action={<Link href="/dashboard" className={buttonStyles("secondary")}>Go to dashboard</Link>} />;
  }
  return <>{children}</>;
}
