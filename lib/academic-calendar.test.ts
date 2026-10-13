import { describe, expect, it } from "vitest";
import { parseAcademicCalendar } from "@/lib/academic-calendar";

describe("parseAcademicCalendar", () => {
  it("unfolds event lines, unescapes text, and expands exclusive all-day ranges", () => {
    const ics = [
      "BEGIN:VCALENDAR",
      "BEGIN:VEVENT",
      "UID:abc-123",
      "SUMMARY:Holiday\\,",
      " continued",
      "DTSTART;VALUE=DATE:20261224",
      "DTEND;VALUE=DATE:20261226",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    expect(parseAcademicCalendar(ics)).toEqual([
      { id: "abc-123:2026-12-24", title: "Holiday,continued", event_date: "2026-12-24" },
      { id: "abc-123:2026-12-25", title: "Holiday,continued", event_date: "2026-12-25" },
    ]);
  });

  it("rejects timed events rather than silently treating them as all-day", () => {
    expect(() => parseAcademicCalendar([
      "BEGIN:VEVENT",
      "UID:timed",
      "SUMMARY:Meeting",
      "DTSTART:20261224T100000",
      "DTEND:20261224T110000",
      "END:VEVENT",
    ].join("\n"))).toThrow("must be an all-day date");
  });
});
