"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Award, Bell, ChartNoAxesColumn, Building2, Calendar, ClipboardList, DoorOpen, LayoutDashboard, ListChecks, Plus, ReceiptText, UtensilsCrossed, type LucideIcon } from "lucide-react";
import { ROLES, type Role } from "@/app/(app)/ui/preview-contract";
import { useFrontend } from "./frontend-provider";

export interface NavigationItem { href: string; label: string; icon: LucideIcon }
const item = (href: string, label: string, icon: LucideIcon): NavigationItem => ({ href, label, icon });

const dashboard = item("/dashboard", "Dashboard", LayoutDashboard);
const notifications = item("/notifications", "Notifications", Bell);
const myRequests = item("/service-requests", "My service requests", ClipboardList);
const report = item("/service-requests/new", "Report an issue", Plus);
const department = item("/service-requests/queue", "Department queue", ListChecks);
const bookRoom = item("/rooms", "Book a room", DoorOpen);
const myBookings = item("/rooms/my-requests", "My room requests", DoorOpen);
const roomQueue = item("/rooms/dept", "Room approvals", Building2);
const newEvent = item("/events/new", "Request an event", Plus);
const myEvents = item("/events/mine", "My events", Calendar);
const eventReview = item("/events/review", "Event reviews", Calendar);
const eventApproval = item("/events/director", "Event approvals", Calendar);
const eventCalendar = item("/events/calendar", "Event calendar", Calendar);
const certificates = item("/requests", "My certificates", Award);
const newCertificate = item("/requests/new", "Request a certificate", Plus);
const certificateReviews = item("/office", "Certificate reviews", Award);
const myClasses = item("/rooms/classes", "My classes", Calendar);
const reports = item("/admin/reports", "Campus pulse", ChartNoAxesColumn);
const canteen = item("/canteen", "Canteen", UtensilsCrossed);
const myOrders = item("/canteen/orders", "My orders", ReceiptText);

const requester = [myRequests, report];
const byRole: Record<Role, NavigationItem[]> = {
  [ROLES.STUDENT]: [...requester, certificates, newCertificate, canteen, myOrders],
  [ROLES.FACULTY]: [...requester, bookRoom, myBookings, myClasses, canteen, myOrders],
  [ROLES.CR]: [...requester, bookRoom, myBookings, certificates, newCertificate, canteen, myOrders],
  [ROLES.CLUB_PRESIDENT]: [...requester, newEvent, myEvents, certificates, newCertificate, canteen, myOrders],
  [ROLES.TECHNICIAN]: [department],
  [ROLES.DEPT_OFFICE]: [department, roomQueue, certificateReviews],
  [ROLES.DEPT_HEAD]: [department, roomQueue, certificateReviews],
  [ROLES.EVENTS_DEPT]: [eventCalendar],
  [ROLES.OSA]: [eventReview, certificateReviews],
  [ROLES.CAMPUS_DIRECTOR]: [eventApproval, reports],
  [ROLES.CANTEEN_KITCHEN]: [canteen],
  [ROLES.CANTEEN_COUNTER]: [canteen],
  [ROLES.CANTEEN_MANAGER]: [canteen],
  [ROLES.ADMIN]: [...requester, department, bookRoom, roomQueue, newEvent, eventReview, eventApproval, eventCalendar, certificateReviews, reports, canteen, myOrders],
};

export function navigationForRole(role?: Role | string): NavigationItem[] {
  const specific = role ? byRole[role as Role] : undefined;
  return [dashboard, ...(specific ?? []), notifications];
}

export function Navigation({ role, onNavigate }: { role?: Role; onNavigate?: () => void }) {
  const pathname = usePathname();
  const { notifications: inbox } = useFrontend();
  const unread = inbox.filter((entry) => !entry.read_at).length;
  const items = navigationForRole(role);
  const active = [...items].sort((a, b) => b.href.length - a.href.length).find((entry) => pathname === entry.href || pathname.startsWith(`${entry.href}/`))?.href;
  return <nav aria-label="Main navigation" className="space-y-1">{items.map(({ href, label, icon: Icon }) => <Link key={href} href={href} aria-current={active === href ? "page" : undefined} onClick={onNavigate} className={`flex min-h-11 items-center gap-2 rounded-control px-3 py-2 ${active === href ? "bg-accent-light font-medium text-accent" : "text-secondary hover:bg-background hover:text-primary"}`}>
    <Icon size={16} aria-hidden="true" className="shrink-0" /><span className="min-w-0 flex-1">{label}</span>
    {href === "/notifications" && unread > 0 && <span className="rounded-full bg-accent px-2 text-surface" aria-label={`${unread} unread`}>{unread}</span>}
  </Link>)}</nav>;
}
