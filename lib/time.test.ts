import { describe, expect, it } from "vitest";
import { findConflicts } from "./db/rooms";
import { formatClock, isBookableDay, isValidCanteenSlot, istDate, istInstant, istTime } from "./time";
import type { RoomBookingRow } from "./types/campus";

describe("IST helpers", () => {
  it("uses the IST calendar day, not the UTC day", () => {
    const lateUtc = new Date("2026-10-11T20:00:00Z"); // 01:30 on 12 Oct in IST
    expect(istDate(0, lateUtc)).toBe("2026-10-12");
    expect(istTime(lateUtc)).toBe("01:30:00");
    expect(istDate(14, lateUtc)).toBe("2026-10-26");
  });
  it("accepts today through 14 days ahead and nothing else", () => {
    const now = new Date("2026-10-11T06:00:00Z");
    expect(isBookableDay("2026-10-11", now)).toBe(true);
    expect(isBookableDay("2026-10-25", now)).toBe(true);
    expect(isBookableDay("2026-10-26", now)).toBe(false);
    expect(isBookableDay("2026-10-10", now)).toBe(false);
  });
  it("converts IST wall-clock to a real instant", () => {
    expect(istInstant("2026-10-11", "12:30").toISOString()).toBe("2026-10-11T07:00:00.000Z");
  });
  it("formats clock times", () => {
    expect(formatClock("09:05:00")).toBe("9:05 AM");
    expect(formatClock("13:00:00")).toBe("1:00 PM");
    expect(formatClock("00:15:00")).toBe("12:15 AM");
  });
  it("requires a canteen slot to start 15+ minutes out and end within 60", () => {
    const now = new Date("2026-10-11T07:00:00Z");
    const at = (minutes: number) => new Date(now.getTime() + minutes * 60000);
    expect(isValidCanteenSlot(at(15), at(30), now)).toBe(true);
    expect(isValidCanteenSlot(at(45), at(60), now)).toBe(true);
    expect(isValidCanteenSlot(at(14), at(29), now)).toBe(false);
    expect(isValidCanteenSlot(at(50), at(65), now)).toBe(false);
  });
});

describe("room request conflicts", () => {
  const row = (id: string, room: string, status: RoomBookingRow["status"]) => ({ id, room_id: room, date: "2026-10-13", period_id: "p5", status }) as RoomBookingRow;
  it("flags pending requests that share a slot", () => {
    const flagged = findConflicts([row("a", "r1", "PENDING"), row("b", "r1", "PENDING"), row("c", "r2", "PENDING"), row("d", "r1", "REJECTED")]);
    expect([...flagged].sort()).toEqual(["a", "b"]);
  });
});
