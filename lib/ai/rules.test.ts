import { describe, expect, it } from "vitest";
import {
  TICKET_CATEGORIES,
  type TicketCategory,
} from "@/app/(app)/service-requests/_stubs/constants";
import { CATEGORY_DEPARTMENT } from "./routing";
import { triageByRules, URGENT_KEYWORDS } from "./rules";

const rules = (title: string, description = "", buildingName = "Main Block") =>
  triageByRules({ title, description, buildingName });

const CATEGORY_CASES: Record<TicketCategory, string[]> = {
  NETWORK: ["Wifi keeps dropping", "No internet in the lab", "LAN port dead at desk 3"],
  AV_EQUIPMENT: [
    "Projector will not turn on",
    "Speaker crackles in hall B",
    "Mic not working for the lecture",
    "HDMI cable gives no signal",
  ],
  ELECTRICAL: [
    "Ceiling fan stopped",
    "Light in the corridor is out",
    "Switch board is loose and hot",
    "Socket near bench 4 is dead",
  ],
  PLUMBING: ["Leak under the washbasin", "Tap keeps running", "Flush is not working"],
  FURNITURE: ["Broken chair in classroom", "Desk drawer is jammed"],
  CLEANLINESS: ["Garbage not collected for two days", "Bad smell from the dustbin"],
  HOSTEL: ["Mess food served cold", "Warden office closed during the posted hours"],
  OTHER: ["Something odd near the gate", "Please look into this"],
};

describe("triageByRules categories", () => {
  it("has a case for every category", () => {
    expect(Object.keys(CATEGORY_CASES).sort()).toEqual([...TICKET_CATEGORIES].sort());
  });

  for (const [category, titles] of Object.entries(CATEGORY_CASES)) {
    it.each(titles)(`routes "%s" to ${category}`, (title) => {
      const result = rules(title);
      expect(result.category).toBe(category);
      expect(result.departmentCode).toBe(CATEGORY_DEPARTMENT[category as TicketCategory]);
      expect(result.source).toBe("rules");
    });
  }

  it("reads the description as well as the title", () => {
    expect(rules("Issue in room 204", "The projector shows a blue screen").category).toBe("AV_EQUIPMENT");
  });

  it("ignores case", () => {
    expect(rules("WIFI DOWN").category).toBe("NETWORK");
  });

  it("matches whole words only", () => {
    expect(rules("Need a plan for the event").category).toBe("OTHER");
    expect(rules("Microwave in the staff room").category).toBe("OTHER");
  });

  it("sends a fault in a hostel to the trade that fixes it", () => {
    expect(rules("Fan not working in my hostel room").category).toBe("ELECTRICAL");
  });

  it("is least confident when nothing matches", () => {
    expect(rules("Please look into this").confidence).toBeLessThan(rules("Wifi down").confidence);
  });
});

describe("triageByRules priority", () => {
  it.each(["sparks", "smoke", "flooding"])("treats %s as URGENT", (word) => {
    expect(rules(`There is ${word} in room 12`).priority).toBe("URGENT");
  });

  it.each(URGENT_KEYWORDS)("treats the urgent keyword %s as URGENT", (word) => {
    expect(rules("Problem in the lab", `We noticed ${word} near the board`).priority).toBe("URGENT");
  });

  it("marks whole-floor and exam problems HIGH", () => {
    expect(rules("No power on the whole floor").priority).toBe("HIGH");
    expect(rules("Projector broken before the exam").priority).toBe("HIGH");
  });

  it("marks minor problems LOW", () => {
    expect(rules("Minor scratch on the desk").priority).toBe("LOW");
  });

  it("defaults to MEDIUM", () => {
    expect(rules("Tap is dripping").priority).toBe("MEDIUM");
  });

  it("lets danger win over everything else", () => {
    expect(rules("Minor smoke smell from the socket").priority).toBe("URGENT");
  });
});
