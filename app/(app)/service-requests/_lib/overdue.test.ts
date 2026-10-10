import { describe, expect, it } from "vitest";
import { isOverdue, OVERDUE_AFTER_HOURS } from "./overdue";

const HOUR = 60 * 60 * 1000;
const NOW = Date.parse("2026-10-10T12:00:00Z");
const hoursBefore = (hours: number) => new Date(NOW - hours * HOUR).toISOString();

describe("OVERDUE_AFTER_HOURS", () => {
  it("matches the agreed targets", () => {
    expect(OVERDUE_AFTER_HOURS).toEqual({ URGENT: 4, HIGH: 24, MEDIUM: 72, LOW: 168 });
  });
});

describe("isOverdue", () => {
  it.each(Object.entries(OVERDUE_AFTER_HOURS) as [keyof typeof OVERDUE_AFTER_HOURS, number][])(
    "%s is on time at its limit and overdue just after it",
    (priority, hours) => {
      const base = { priority, status: "OPEN" as const, resolved_at: null };
      expect(isOverdue({ ...base, created_at: hoursBefore(hours) }, NOW)).toBe(false);
      expect(isOverdue({ ...base, created_at: hoursBefore(hours + 0.1) }, NOW)).toBe(true);
    },
  );

  it("stops the clock when the ticket is resolved", () => {
    const ticket = {
      priority: "URGENT" as const,
      status: "RESOLVED" as const,
      created_at: hoursBefore(10),
      resolved_at: hoursBefore(8),
    };
    expect(isOverdue(ticket, NOW)).toBe(false);
    expect(isOverdue({ ...ticket, resolved_at: hoursBefore(2) }, NOW)).toBe(true);
  });

  it("keeps the clock stopped once closed", () => {
    expect(
      isOverdue(
        { priority: "HIGH", status: "CLOSED", created_at: hoursBefore(100), resolved_at: hoursBefore(90) },
        NOW,
      ),
    ).toBe(false);
  });

  it("runs the clock again for a reopened ticket", () => {
    expect(
      isOverdue(
        { priority: "URGENT", status: "REOPENED", created_at: hoursBefore(10), resolved_at: hoursBefore(8) },
        NOW,
      ),
    ).toBe(true);
  });
});
