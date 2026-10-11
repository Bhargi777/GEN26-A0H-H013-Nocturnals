"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { ROLE_LABELS } from "@/app/(app)/ui/preview-contract";
import { Button, EmptyState, Skeleton, buttonStyles, useToast } from "@/components/ui";
import { useFrontend } from "./frontend-provider";
import { Navigation } from "./navigation";
import { MobileNavigation } from "./mobile-navigation";
import { NotificationBell } from "./notification-bell";

export function AppShell({ children }: { children: ReactNode }) {
  const { profile, ready, error, refresh, signOut } = useFrontend();
  const pathname = usePathname();
  const router = useRouter();
  const toast = useToast();
  const [leaving, setLeaving] = useState(false);
  return <div className="min-h-screen">
    <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-control focus:bg-surface focus:p-3">Skip to content</a>
    <aside className="fixed inset-y-0 left-0 hidden w-64 border-r bg-surface p-6 md:block">
      <Link href="/dashboard" className="font-semibold text-primary">CampusConnect</Link>
      <div className="mt-6"><Navigation role={profile?.role} /></div>
    </aside>
    <div className="min-w-0 md:pl-64">
      <header className="flex min-h-16 flex-wrap items-center justify-between gap-3 border-b bg-surface px-4 py-3 md:px-6">
        <MobileNavigation role={profile?.role} />
        <div className="min-w-0"><p className="break-words font-medium">{profile?.full_name ?? "CampusConnect"}</p>{profile && <p className="text-secondary">{ROLE_LABELS[profile.role]}</p>}</div>
        <div className="flex items-center gap-3">
          <NotificationBell />
          {profile ? <Button variant="ghost" size="sm" loading={leaving} onClick={async () => {
            setLeaving(true);
            try { await signOut(); router.replace("/sign-in"); }
            catch { toast({ tone: "error", message: "Sign-out failed. Try again." }); }
            finally { setLeaving(false); }
          }}>Sign out</Button> : <Link href="/sign-in" className="text-link">Sign in</Link>}
        </div>
      </header>
      <main id="main-content" tabIndex={-1} className="mx-auto max-w-screen-xl space-y-6 p-4 md:p-6">
        {!ready ? <Skeleton label="Loading account" /> : error ? <EmptyState message={error} action={<Button onClick={() => void refresh()}>Try again</Button>} /> : <>
          {profile?.email.endsWith(".invalid") && <div className="rounded-card border bg-accent-light p-3 text-accent">Sample data preview · <Link href="/ui" className="underline">Change preview role</Link></div>}
          {profile || pathname === "/ui" ? children : <div className="space-y-4"><EmptyState message="Sign in with your campus account to view your requests." action={<Link href="/sign-in" className={buttonStyles()}>Sign in</Link>} /><Link href="/ui" className="text-link">Open the component preview</Link></div>}
        </>}
      </main>
    </div>
  </div>;
}
