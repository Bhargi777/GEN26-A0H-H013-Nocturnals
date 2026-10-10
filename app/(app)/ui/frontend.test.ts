import { describe, expect, it } from "vitest";
import { dashboardFor } from "../dashboard/dashboard-model";
import { navigationForRole } from "@/components/layout/navigation";
import { signInSchema, signUpSchema } from "@/app/(auth)/auth-form";
import { emptyFilters, filterSchema } from "@/components/ui/filter-bar";
import { relativeTime } from "@/components/ui/timeline";
import { PREVIEW_DEPARTMENT_ID, PREVIEW_USER_ID, previewRequests, previewTickets } from "./fixtures";
import { ROLES, type Profile, type Role } from "./preview-contract";

const profile = (role: Role): Profile => ({ id: PREVIEW_USER_ID, full_name: "Role preview", email: "preview@example.invalid", role, department_id: PREVIEW_DEPARTMENT_ID });

describe("dashboard role boundaries", () => {
  it.each([ROLES.student, ROLES.faculty])("shows only the requester's counts and latest five for %s", (role) => {
    const result = dashboardFor(profile(role), previewTickets, previewRequests);
    expect(result.stats.map((item) => item.value)).toEqual([3, 2]);
    expect(result.rows).toHaveLength(5);
    expect(result.rows.map((item) => item.code)).toEqual(["AR-000205", "AR-000204", "SR-000106", "SR-000105", "AR-000202"]);
    expect(result.rows.some((item) => item.id === "sr-104" || item.id === "ar-203")).toBe(false);
  });
  it.each([ROLES.technician, ROLES.deptAdmin])("shows the department's oldest unresolved tickets for %s", (role) => {
    const result = dashboardFor(profile(role), previewTickets, previewRequests);
    expect(result.rows.map((item) => item.code)).toEqual(["SR-000101", "SR-000103", "SR-000104"]);
    expect(result.stats.reduce((total, item) => total + item.value, 0)).toBe(4);
    expect(result.action.href).toBe("/service-requests/queue");
  });
  it("limits office work to pending office review", () => {
    const result = dashboardFor(profile(ROLES.officeStaff), previewTickets, previewRequests);
    expect(result.stats[0].value).toBe(2);
    expect(result.rows.map((item) => item.code)).toEqual(["AR-000203", "AR-000201"]);
  });
  it("allows administrators to see campus totals", () => {
    expect(dashboardFor(profile(ROLES.admin), previewTickets, previewRequests).stats.map((item) => item.value)).toEqual([4, 3]);
  });
  it("handles an empty queue without missing counts", () => {
    const result = dashboardFor(profile(ROLES.technician), [], []);
    expect(result.rows).toEqual([]);
    expect(result.stats.every((item) => item.value === 0)).toBe(true);
  });
});

describe("navigation contract", () => {
  it("keeps office navigation focused on its queue", () => {
    expect(navigationForRole(ROLES.officeStaff).map((item) => item.href)).toEqual(["/dashboard", "/office"]);
  });
  it("retains personal routes for department roles", () => {
    const personal = navigationForRole(ROLES.student).map((item) => item.href);
    for (const role of [ROLES.technician, ROLES.deptAdmin]) expect(navigationForRole(role).map((item) => item.href)).toEqual(expect.arrayContaining([...personal, "/service-requests/queue"]));
  });
  it("gives administrators every module route without duplicates", () => {
    const routes = navigationForRole(ROLES.admin).map((item) => item.href);
    expect(routes).toHaveLength(8);
    expect(new Set(routes).size).toBe(routes.length);
    expect(routes).toContain("/admin/reports");
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
