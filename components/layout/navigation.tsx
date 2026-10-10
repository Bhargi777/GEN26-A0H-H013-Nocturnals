"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, FileText, LayoutDashboard, ListChecks, Plus, ChartNoAxesColumn, type LucideIcon } from "lucide-react";
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

export function navigationForRole(role?: Role): NavigationItem[] {
  if (!role) return [dashboard];
  if (role === ROLES.officeStaff) return [dashboard, office];
  if (role === ROLES.admin) return [dashboard, ...personal, department, office, reports];
  if (role === ROLES.technician || role === ROLES.deptAdmin) return [dashboard, department, ...personal];
  return [dashboard, ...personal];
}

export function Navigation({ role, onNavigate }: { role?: Role; onNavigate?: () => void }) {
  const pathname = usePathname();
  const items = navigationForRole(role);
  const active = [...items].sort((a, b) => b.href.length - a.href.length).find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))?.href;
  return <nav aria-label="Main navigation" className="space-y-1">{items.map(({ href, label, icon: Icon }) => <Link key={href} href={href} aria-current={active === href ? "page" : undefined} onClick={onNavigate} className={`flex min-h-11 items-center gap-2 rounded-control px-3 py-2 ${active === href ? "bg-accent-light font-medium text-accent" : "text-secondary hover:bg-background hover:text-primary"}`}><Icon size={16} aria-hidden="true" className="shrink-0" /><span>{label}</span></Link>)}</nav>;
}
