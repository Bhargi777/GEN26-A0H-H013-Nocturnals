import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  DEPARTMENT_CODES,
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
} from "@/app/(app)/service-requests/_stubs/constants";
import { TRIAGE_SYSTEM_PROMPT } from "./prompt";
import { triage, type Classifier } from "./triage";

const input = {
  title: "Projector not turning on",
  description: "The projector in room 204 shows no signal over HDMI",
  buildingName: "Main Block",
};
const valid = { category: "AV_EQUIPMENT", priority: "HIGH", departmentCode: "ELEC", confidence: 0.92 };
const returning = (output: unknown): Classifier => async () => output;

beforeEach(() => {
  vi.spyOn(console, "warn").mockImplementation(() => {});
});
afterEach(() => {
  vi.restoreAllMocks();
});

describe("triage prompt", () => {
  it("asks for JSON only", () => {
    expect(TRIAGE_SYSTEM_PROMPT).toMatch(/JSON only/);
  });

  it.each([...TICKET_CATEGORIES, ...TICKET_PRIORITIES, ...DEPARTMENT_CODES])(
    "lists the allowed value %s",
    (value) => {
      expect(TRIAGE_SYSTEM_PROMPT).toContain(value);
    },
  );
});

describe("model output validation", () => {
  it("uses valid model output and marks the source as model", async () => {
    await expect(triage(input, { classify: returning(valid) })).resolves.toEqual({
      ...valid,
      source: "model",
    });
  });

  it.each([
    ["an unknown category", { ...valid, category: "PROJECTOR" }],
    ["an unknown priority", { ...valid, priority: "CRITICAL" }],
    ["an unknown department", { ...valid, departmentCode: "AV" }],
    ["a confidence above 1", { ...valid, confidence: 1.4 }],
    ["a missing field", { category: "AV_EQUIPMENT", priority: "HIGH" }],
    ["plain text", "Category: AV equipment"],
    ["null", null],
  ])("rejects %s and falls back to rules", async (_label, output) => {
    const result = await triage(input, { classify: returning(output) });
    expect(result.source).toBe("rules");
    expect(result.category).toBe("AV_EQUIPMENT");
  });
});
