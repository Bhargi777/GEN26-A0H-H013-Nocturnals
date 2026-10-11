import { describe, expect, it } from "vitest";
import { groupByDate, monthGrid, shiftMonth } from "./calendar-grid";

describe("month grid", () => {
  it("always has six full weeks starting on Sunday", () => {
    const grid = monthGrid(2026, 10);
    expect(grid).toHaveLength(42);
    expect(grid[0].date).toBe("2026-09-27"); // 1 Oct 2026 is a Thursday
    expect(grid[0].inMonth).toBe(false);
    expect(grid.filter((day) => day.inMonth)).toHaveLength(31);
  });
  it("handles February in a leap year", () => {
    expect(monthGrid(2028, 2).filter((day) => day.inMonth)).toHaveLength(29);
  });
  it("moves across year boundaries", () => {
    expect(shiftMonth(2026, 12, 1)).toEqual({ year: 2027, month: 1 });
    expect(shiftMonth(2026, 1, -1)).toEqual({ year: 2025, month: 12 });
  });
  it("groups events by day", () => {
    const map = groupByDate([{ event_date: "2026-10-20", id: 1 }, { event_date: "2026-10-21", id: 2 }, { event_date: "2026-10-20", id: 3 }]);
    expect(map.get("2026-10-20")?.map((item) => item.id)).toEqual([1, 3]);
    expect(map.get("2026-10-22")).toBeUndefined();
  });
});
