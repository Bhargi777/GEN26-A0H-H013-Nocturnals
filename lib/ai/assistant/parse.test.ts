import { describe, expect, it } from "vitest";
import { detectIntent, parseAttendees, parseDate, parsePeriod } from "./parse";

const now = new Date("2026-10-11T06:00:00Z"); // Sunday 11 Oct 2026, 11:30 IST

describe("assistant parsing", () => {
  it("recognises what the user wants", () => {
    expect(detectIntent("Book a room for 40 people on Tuesday period 3")).toBe("book_room");
    expect(detectIntent("where is my order?")).toBe("my_orders");
    expect(detectIntent("show my room requests")).toBe("my_rooms");
    expect(detectIntent("what events are on this week")).toBe("events");
    expect(detectIntent("status of my complaint")).toBe("tickets");
    expect(detectIntent("how far ahead can I plan")).toBe("help");
    expect(detectIntent("when does the canteen forfeit my order")).toBe("help");
    expect(detectIntent("how do I book a room")).toBe("help");
    expect(detectIntent("what events are on friday")).toBe("events");
  });
  it("reads dates in IST", () => {
    expect(parseDate("today", now)).toBe("2026-10-11");
    expect(parseDate("tomorrow", now)).toBe("2026-10-12");
    expect(parseDate("on tuesday", now)).toBe("2026-10-13");
    expect(parseDate("sunday", now)).toBe("2026-10-18");
    expect(parseDate("14 oct", now)).toBe("2026-10-14");
    expect(parseDate("2 jan", now)).toBe("2027-01-02");
    expect(parseDate("2026-11-05", now)).toBe("2026-11-05");
    expect(parseDate("sometime", now)).toBeUndefined();
  });
  it("reads periods and headcounts", () => {
    expect(parsePeriod("period 3")).toBe(3);
    expect(parsePeriod("the 5th period")).toBe(5);
    expect(parsePeriod("no period here")).toBeUndefined();
    expect(parseAttendees("for 40 people")).toBe(40);
    expect(parseAttendees("room for 25")).toBe(25);
    expect(parseAttendees("at 10 am")).toBeUndefined();
  });
});
