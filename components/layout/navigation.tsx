"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, FileText, LayoutDashboard, ListChecks, Plus, ChartNoAxesColumn, Calendar, UtensilsCrossed, type LucideIcon } from "lucide-react";
import { ROLES, type Role } from "@/app/(app)/ui/preview-contract";

export interface NavigationItem { href: string; label: string; icon: LucideIcon }
const dashboard: NavigationItem = { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard };
const personal: NavigationItem[] = [
  { href: "/service-requests", label: "My service requests", icon: ClipboardList },
  { href: "/service-requests/new", label: "Report an issue", icon: Plus },
  { href: "/requests", label: "My certificates", icon: FileText },
  { href: "/requests/new", label: "Request a certificate", icon: Plus },
];
const department: NavigationItem = { href: "/service-requests/queue", label: "Department queue", icon: ListChecks };
const office: NavigationItem = { href: "/office", label: "Office review queue", icon: ListChecks };
const reports: NavigationItem = { href: "/admin/reports", label: "Reports", icon: ChartNoAxesColumn };
const myEvents: NavigationItem = { href: "/events/mine", label: "My events", icon: Calendar };
const eventReview: NavigationItem = { href: "/events/review", label: "Event reviews", icon: Calendar };
const eventApproval: NavigationItem = { href: "/events/director", label: "Event approvals", icon: Calendar };
const canteenOrders: NavigationItem = { href: "/canteen", label: "Canteen orders", icon: UtensilsCrossed };

export function navigationForRole(role?: Role | string): NavigationItem[] {
  if (!role) return [dashboard];

  // Map new role names to navigation items
  const items = [dashboard, ...personal];

  // OSA staff can review events
  if (role === "osa") {
    items.push(eventReview);
  }

  // Club president can request events
  if (role === "club_president") {
    items.push(myEvents);
  }

  // Campus director can approve events
  if (role === "campus_director") {
    items.push(eventApproval);
  }

  // Events department can mark events as calendared
  if (role === "events_dept") {
    items.push(eventApproval);
  }

  // All users can order from canteen
  items.push(canteenOrders);

  // Old role mappings for compatibility
  if (role === ROLES.officeStaff) return [dashboard, office];
  if (role === ROLES.admin) return [dashboard, ...personal, department, office, reports];
  if (role === ROLES.technician || role === ROLES.deptAdmin) return [dashboard, department, ...personal];

  return items;
}

export function Navigation({ role, onNavigate }: { role?: Role; onNavigate?: () => void }) {
  const pathname = usePathname();
  const items = navigationForRole(role);
  const active = [...items].sort((a, b) => b.href.length - a.href.length).find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))?.href;
  return <nav aria-label="Main navigation" className="space-y-1">{items.map(({ href, label, icon: Icon }) => <Link key={href} href={href} aria-current={active === href ? "page" : undefined} onClick={onNavigate} className={`flex min-h-11 items-center gap-2 rounded-control px-3 py-2 ${active === href ? "bg-accent-light font-medium text-accent" : "text-secondary hover:bg-background hover:text-primary"}`}><Icon size={16} aria-hidden="true" className="shrink-0" /><span>{label}</span></Link>)}</nav>;
}
