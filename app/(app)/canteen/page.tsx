"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useFrontend } from "@/components/layout/frontend-provider";
import { Button, Card, EmptyState, PageHeader, Skeleton, buttonStyles } from "@/components/ui";
import { ROLES, type Role } from "@/lib/constants/roles";
import { listCanteens } from "@/lib/db/canteen";
import type { CanteenRow } from "@/lib/types/campus";

const SCREENS: { path: string; label: string; roles: Role[] }[] = [
  { path: "kitchen", label: "Kitchen screen", roles: [ROLES.CANTEEN_KITCHEN, ROLES.CANTEEN_MANAGER, ROLES.ADMIN] },
  { path: "counter", label: "Counter screen", roles: [ROLES.CANTEEN_COUNTER, ROLES.CANTEEN_MANAGER, ROLES.ADMIN] },
  { path: "display", label: "Display board", roles: [ROLES.CANTEEN_KITCHEN, ROLES.CANTEEN_COUNTER, ROLES.CANTEEN_MANAGER, ROLES.ADMIN] },
  { path: "manage", label: "Menu and slots", roles: [ROLES.CANTEEN_MANAGER, ROLES.ADMIN] },
];
const STAFF: Role[] = [ROLES.CANTEEN_KITCHEN, ROLES.CANTEEN_COUNTER, ROLES.CANTEEN_MANAGER];

export default function CanteenPage() {
  const { profile } = useFrontend();
  const [canteens, setCanteens] = useState<CanteenRow[]>();
  const [error, setError] = useState<string>();
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    listCanteens()
      .then((rows) => { if (!cancelled) setCanteens(rows); })
      .catch(() => { if (!cancelled) setError("Canteens could not be loaded. Try again."); });
    return () => { cancelled = true; };
  }, [attempt]);

  if (!profile) return null;
  if (error) return <EmptyState message={error} action={<Button onClick={() => { setError(undefined); setAttempt((value) => value + 1); }}>Try again</Button>} />;
  if (!canteens) return <Skeleton label="Loading canteens" />;

  const isStaff = STAFF.includes(profile.role) || profile.role === ROLES.ADMIN;
  const screens = SCREENS.filter((screen) => screen.roles.includes(profile.role));
  const customer = !STAFF.includes(profile.role);

  return <div className="space-y-6">
    <PageHeader title="Canteen" context={isStaff ? "Choose a canteen to open your screens." : "Order ahead and collect it in a 15-minute pickup slot."}
      action={customer ? <Link href="/canteen/orders" className={buttonStyles("secondary")}>My orders</Link> : undefined} />
    {canteens.length === 0 ? <EmptyState message="No canteens are set up yet." action={<Link href="/dashboard" className={buttonStyles("secondary")}>Go to dashboard</Link>} /> :
      <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {canteens.map((canteen) => <li key={canteen.id}><Card className="h-full space-y-3">
          <div><h2>{canteen.name}</h2><p className="text-secondary">{canteen.location}</p></div>
          <div className="flex flex-wrap gap-2">
            {customer && <Link href={`/canteen/${canteen.id}`} className={buttonStyles()}>Order from {canteen.name}</Link>}
            {screens.map((screen) => <Link key={screen.path} href={`/canteen/${canteen.id}/${screen.path}`} className={buttonStyles(customer ? "secondary" : screen.path === "display" ? "secondary" : "primary")}>{screen.label}</Link>)}
          </div>
        </Card></li>)}
      </ul>}
  </div>;
}
