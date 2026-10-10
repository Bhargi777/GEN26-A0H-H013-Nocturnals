import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CATEGORY_DEPARTMENT, DEPARTMENT_CODES } from "./routing";
import { CATEGORY_VALUES, PRIORITY_VALUES } from "./values";
import { parseModelJson } from "./model";
import { TRIAGE_SYSTEM_PROMPT, buildTriageUserMessage } from "./prompt";
import type { TriageInput } from "./schema";
import { TRIAGE_TIMEOUT_MS, triage, type Classifier } from "./triage";

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

  it.each([...CATEGORY_VALUES, ...PRIORITY_VALUES, ...DEPARTMENT_CODES])(
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

describe("privacy", () => {
  const withPersonalData = {
    ...input,
    fullName: "Ananya Rao",
    email: "ananya.rao@campus.edu",
    rollNo: "21CS1042",
  } as TriageInput;

  it("passes only title, description and building name to the model", async () => {
    let seen: unknown;
    await triage(withPersonalData, {
      classify: async (modelInput) => {
        seen = modelInput;
        return valid;
      },
    });
    expect(Object.keys(seen as object).sort()).toEqual(["buildingName", "description", "title"]);
    expect(JSON.stringify(seen)).not.toMatch(/Ananya|ananya\.rao@campus\.edu|21CS1042/);
  });

  it("builds the model message from those three fields only", () => {
    const message = buildTriageUserMessage(withPersonalData);
    expect(message).toContain(input.title);
    expect(message).toContain(input.description);
    expect(message).toContain(input.buildingName);
    expect(message).not.toMatch(/Ananya|ananya\.rao@campus\.edu|21CS1042/);
  });
});

describe("fallback to rules", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("waits a few seconds at most", () => {
    expect(TRIAGE_TIMEOUT_MS).toBeGreaterThanOrEqual(2000);
    expect(TRIAGE_TIMEOUT_MS).toBeLessThanOrEqual(6000);
  });

  it("aborts a slow model at the timeout and uses rules", async () => {
    vi.useFakeTimers();
    let aborted = false;
    const pending = triage(input, {
      classify: (_input, { signal }) =>
        new Promise((_resolve, reject) => {
          signal.addEventListener("abort", () => {
            aborted = true;
            reject(new Error("aborted"));
          });
        }),
    });
    await vi.advanceTimersByTimeAsync(TRIAGE_TIMEOUT_MS - 1);
    expect(aborted).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    await expect(pending).resolves.toMatchObject({ source: "rules", category: "AV_EQUIPMENT" });
    expect(aborted).toBe(true);
  });

  it("does not wait for a model that ignores the abort signal", async () => {
    vi.useFakeTimers();
    const pending = triage(input, { classify: () => new Promise(() => {}) });
    await vi.advanceTimersByTimeAsync(TRIAGE_TIMEOUT_MS);
    await expect(pending).resolves.toMatchObject({ source: "rules" });
  });

  it("uses rules when the model call fails", async () => {
    const result = await triage(input, {
      classify: async () => {
        throw new Error("529 overloaded");
      },
    });
    expect(result.source).toBe("rules");
  });

  it("uses rules without calling any model when no API key is set", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const result = await triage(input);
    expect(result).toMatchObject({
      source: "rules",
      category: "AV_EQUIPMENT",
      departmentCode: CATEGORY_DEPARTMENT.AV_EQUIPMENT,
    });
    expect(fetchSpy).not.toHaveBeenCalled();
    vi.unstubAllEnvs();
  });
});

describe("parseModelJson", () => {
  it("reads a bare JSON object", () => {
    expect(parseModelJson('{"category":"NETWORK"}')).toEqual({ category: "NETWORK" });
  });

  it("reads JSON inside a code fence", () => {
    expect(parseModelJson('```json\n{"category":"NETWORK"}\n```')).toEqual({ category: "NETWORK" });
  });

  it("throws on text that is not JSON, so triage falls back to rules", () => {
    expect(() => parseModelJson("Category: Network")).toThrow();
  });
});
