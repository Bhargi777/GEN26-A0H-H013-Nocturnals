import { describe, expect, it } from "vitest";
import { dashboardFor } from "../dashboard/dashboard-model";
import { navigationForRole } from "@/components/layout/navigation";
import { signInSchema, signUpSchema } from "@/app/(auth)/auth-form";
import { emptyFilters, filterSchema } from "@/components/ui/filter-bar";
import { relativeTime } from "@/components/ui/timeline";
import { emptyDashboardData } from "../dashboard/dashboard-model";
import { ROLES, type Role } from "./preview-contract";
import type { DashboardData } from "@/lib/types/campus";

const at = (day: number) => `2026-10-${String(day).padStart(2, "0")}T08:00:00Z`;
const ticket = (n: number, status: string) => ({ id: `t${n}`, code: `SR-${n}`, title: `Ticket ${n}`, status, created_at: at(n), requester_id: "u", assigned_department_id: "d" });
const data: DashboardData = {
  tickets: [ticket(1, "OPEN"), ticket(2, "IN_PROGRESS"), ticket(3, "RESOLVED"), ticket(4, "CLOSED")],
  bookings: [
    { id: "b1", code: "RB-1", status: "PENDING", created_at: at(5), date: "2026-10-20", room: { name: "Lab 101" } },
    { id: "b2", code: "RB-2", status: "APPROVED", created_at: at(6), date: "2026-10-21", room: { name: "LH 1" } },
  ],
  events: [
    { id: "e1", code: "EV-1", title: "Hack night", status: "SUBMITTED", created_at: at(7) },
    { id: "e2", code: "EV-2", title: "Concert", status: "PENDING_DIRECTOR", created_at: at(8) },
    { id: "e3", code: "EV-3", title: "Quiz", status: "APPROVED", created_at: at(9) },
  ],
  orders: [
    { id: "o1", code: "ORD-1", token: "MAIN-001", status: "PLACED", total: 100, created_at: at(10) },
    { id: "o2", code: "ORD-2", token: "MAIN-002", status: "PAID", total: 50, created_at: at(11) },
    { id: "o3", code: "ORD-3", token: "MAIN-003", status: "READY", total: 70, created_at: at(12) },
  ],
  unavailableItems: 2,
};
const model = (role: Role, source: DashboardData = data) => dashboardFor({ role }, source);

describe("dashboard for every role", () => {
  it.each(Object.values(ROLES))("%s gets stats, an action and at most five rows", (role) => {
    const result = model(role);
    expect(result.stats.length).toBeGreaterThan(0);
    expect(result.action.href.startsWith("/")).toBe(true);
    expect(result.rows.length).toBeLessThanOrEqual(5);
    expect(model(role, emptyDashboardData).rows).toEqual([]);
  });
  it("shows a student their open tickets and active orders", () => {
    expect(model(ROLES.STUDENT).stats.map((item) => item.value)).toEqual([2, 3]);
  });
  it("shows faculty pending and approved room counts", () => {
    expect(model(ROLES.FACULTY).stats.map((item) => item.value)).toEqual([2, 1, 1]);
  });
  it("lists the oldest unresolved tickets for technicians", () => {
    expect(model(ROLES.TECHNICIAN).rows.map((row) => row.code)).toEqual(["SR-1", "SR-2"]);
  });
  it("queues only submitted events for student affairs", () => {
    expect(model(ROLES.OSA).rows.map((row) => row.code)).toEqual(["EV-1"]);
  });
  it("queues only director-pending events for the campus director", () => {
    expect(model(ROLES.CAMPUS_DIRECTOR).rows.map((row) => row.code)).toEqual(["EV-2"]);
  });
  it("queues paid orders for the kitchen and unpaid orders for the counter", () => {
    expect(model(ROLES.CANTEEN_KITCHEN).rows.map((row) => row.code)).toEqual(["ORD-2"]);
    expect(model(ROLES.CANTEEN_COUNTER).rows.map((row) => row.code)).toEqual(["ORD-1"]);
  });
  it("reports unavailable menu items to the manager", () => {
    expect(model(ROLES.CANTEEN_MANAGER).stats.at(-1)?.value).toBe(2);
  });
});

describe("navigation contract", () => {
  it("always starts with the dashboard and ends with notifications", () => {
    for (const role of Object.values(ROLES)) {
      const routes = navigationForRole(role).map((item) => item.href);
      expect(routes[0]).toBe("/dashboard");
      expect(routes.at(-1)).toBe("/notifications");
      expect(new Set(routes).size).toBe(routes.length);
    }
  });
  it("sends only room requesters to the booking form", () => {
    expect(navigationForRole(ROLES.FACULTY).map((item) => item.href)).toContain("/rooms");
    expect(navigationForRole(ROLES.STUDENT).map((item) => item.href)).not.toContain("/rooms");
  });
  it("gives department staff the room approval queue", () => {
    for (const role of [ROLES.DEPT_OFFICE, ROLES.DEPT_HEAD]) expect(navigationForRole(role).map((item) => item.href)).toContain("/rooms/dept");
  });
  it("gives administrators every module route", () => {
    const routes = navigationForRole(ROLES.ADMIN).map((item) => item.href);
    expect(routes).toEqual(expect.arrayContaining(["/rooms", "/rooms/dept", "/events/review", "/events/director", "/canteen"]));
  });
});

describe("input validation and dates", () => {
  it("rejects malformed email and empty passwords", () => {
    expect(signInSchema.safeParse({ email: "campus", password: "" }).success).toBe(false);
  });
  it("leaves the accepted campus domains to the server", () => {
    expect(signUpSchema.safeParse({ fullName: "Campus applicant", email: "applicant@outside.example", password: "long-enough-password" }).success).toBe(true);
  });
  it("rejects a short registration password", () => {
    expect(signUpSchema.safeParse({ fullName: "Campus applicant", email: "applicant@campus.example", password: "short" }).success).toBe(false);
  });
  it("accepts an open date range but rejects an inverted range", () => {
    expect(filterSchema.safeParse({ ...emptyFilters, from: "2026-10-01" }).success).toBe(true);
    expect(filterSchema.safeParse({ ...emptyFilters, from: "2026-10-11", to: "2026-10-01" }).success).toBe(false);
  });
  it("renders past, future and malformed audit dates", () => {
    const now = Date.parse("2026-10-11T08:00:00Z");
    expect(relativeTime("2026-10-11T07:00:00Z", now)).toBe("1 hour ago");
    expect(relativeTime("2026-10-12T08:00:00Z", now)).toBe("tomorrow");
    expect(relativeTime("invalid", now)).toBe("Date unavailable");
  });
});
