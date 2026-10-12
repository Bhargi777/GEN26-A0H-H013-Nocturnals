"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { ROLE_LABELS } from "@/app/(app)/ui/preview-contract";
import { Button, EmptyState, Skeleton, buttonStyles, useToast } from "@/components/ui";
import { useFrontend } from "./frontend-provider";
import { MobileNavigation } from "./mobile-navigation";
import { navigationForRole } from "./navigation";
import { NotificationBell } from "./notification-bell";
import { AssistantPanel } from "@/components/assistant/assistant-panel";
import { ThemeToggle } from "./theme-provider";

/** Home / Section breadcrumb: the section label comes from the role's navigation, else a tidied path segment. */
function useCrumb(): string | undefined {
  const pathname = usePathname();
  const { profile } = useFrontend();
  if (pathname === "/dashboard" || pathname === "/") return undefined;
  const items = navigationForRole(profile?.role, profile?.canteen_id);
  const match = [...items].sort((a, b) => b.href.length - a.href.length).find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));
  if (match) return match.label;
  const segment = pathname.split("/").filter(Boolean)[0] ?? "";
  return segment.replace(/-/g, " ").replace(/^./, (c) => c.toUpperCase());
}

export function AppShell({ children }: { children: ReactNode }) {
  const { profile, ready, error, refresh, signOut } = useFrontend();
  const pathname = usePathname();
  const router = useRouter();
  const toast = useToast();
  const crumb = useCrumb();
  const [leaving, setLeaving] = useState(false);
  return <div className="min-h-screen">
    <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-control focus:bg-surface focus:p-3">Skip to content</a>
    <header className="bg-accent text-on-accent">
      <div className="flex min-h-16 flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-8">
        <div className="flex min-w-0 items-center gap-3">
          {profile && <MobileNavigation role={profile.role} />}
          <Link href="/dashboard" className="min-w-0 truncate text-title text-on-accent">ourAmrita</Link>
        </div>
        <div className="flex items-center gap-3">
          {profile && <p className="hidden min-w-0 text-right sm:block"><span className="block break-words font-medium">{profile.full_name}</span><span className="block opacity-90">{ROLE_LABELS[profile.role]}</span></p>}
          {profile && <AssistantPanel />}
          <NotificationBell />
          <ThemeToggle />
          {profile
            ? <button type="button" disabled={leaving} className="inline-flex min-h-11 items-center rounded-control border border-on-accent px-3 py-2 font-medium text-on-accent hover:bg-accent-hover disabled:opacity-60" onClick={async () => {
              setLeaving(true);
              try { await signOut(); router.replace("/sign-in"); }
              catch { toast({ tone: "error", message: "Sign-out failed. Try again." }); }
              finally { setLeaving(false); }
            }}>Sign out</button>
            : <Link href="/sign-in" className="font-medium text-on-accent underline">Sign in</Link>}
        </div>
      </div>
    </header>
    <nav aria-label="Breadcrumb" className="border-b bg-surface px-4 py-3 md:px-8">
      <ol className="flex flex-wrap items-center gap-2 text-body">
        <li><Link href="/dashboard" className="text-link">Home</Link></li>
        {crumb && <><li aria-hidden="true" className="text-secondary">/</li><li aria-current="page" className="text-secondary">{crumb}</li></>}
      </ol>
    </nav>
    <main id="main-content" tabIndex={-1} className="mx-auto max-w-screen-xl space-y-6 p-4 md:p-8">
      {!ready ? <Skeleton label="Loading account" /> : error ? <EmptyState message={error} action={<Button onClick={() => void refresh()}>Try again</Button>} /> : <>
        {profile?.email.endsWith(".invalid") && <div className="rounded-card border bg-accent-light p-3 text-accent">Sample data preview · <Link href="/ui" className="underline">Change preview role</Link></div>}
        {profile || pathname === "/ui" ? children : <div className="space-y-4"><EmptyState message="Sign in with your campus account to continue." action={<Link href="/sign-in" className={buttonStyles()}>Sign in</Link>} /></div>}
      </>}
    </main>
  </div>;
}
