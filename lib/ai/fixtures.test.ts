import { describe, expect, it } from "vitest";
import { CATEGORY_VALUES } from "./values";
import fixtures from "./fixtures.json";

describe("triage fixtures", () => {
  it("holds 25 to 30 labelled complaints with unique ids", () => {
    expect(fixtures.length).toBeGreaterThanOrEqual(25);
    expect(fixtures.length).toBeLessThanOrEqual(30);
    expect(new Set(fixtures.map((f) => f.id)).size).toBe(fixtures.length);
  });

  it("uses only known categories and covers every one", () => {
    const used = new Set(fixtures.map((f) => f.expectedCategory));
    for (const category of used) expect(CATEGORY_VALUES).toContain(category);
    expect([...used].sort()).toEqual([...CATEGORY_VALUES].sort());
  });
});
