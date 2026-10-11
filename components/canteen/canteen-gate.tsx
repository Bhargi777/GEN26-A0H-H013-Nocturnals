"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import type { ReactNode } from "react";
import { useFrontend } from "@/components/layout/frontend-provider";
import { RoleGate } from "@/components/layout/role-gate";
import { EmptyState, buttonStyles } from "@/components/ui";
import { ROLES, type Role } from "@/lib/constants/roles";

const STAFF: readonly Role[] = [ROLES.CANTEEN_KITCHEN, ROLES.CANTEEN_COUNTER, ROLES.CANTEEN_MANAGER];

/**
 * Role check plus canteen ownership: kitchen, counter and manager staff only get the screens of the canteen
 * on their profile. Admins see any canteen. The database applies the same rule to every query.
 */
export function CanteenGate({ roles, children }: { roles: readonly Role[]; children: ReactNode }) {
  const { id } = useParams<{ id: string }>();
  const { profile } = useFrontend();
  return <RoleGate roles={roles}>
    {profile && STAFF.includes(profile.role) && profile.canteen_id !== id
      ? <EmptyState message={profile.canteen_id ? "This is not your canteen. You can only open the screens of the canteen you work in." : "Your account is not assigned to a canteen yet. Ask an administrator to assign one."}
          action={<Link href="/dashboard" className={buttonStyles("secondary")}>Go to dashboard</Link>} />
      : children}
  </RoleGate>;
}
