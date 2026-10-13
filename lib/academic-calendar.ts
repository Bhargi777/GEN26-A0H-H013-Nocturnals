import type { AcademicCalendarEvent } from "@/lib/types/campus";

function unescapeText(value: string): string {
  return value
    .replace(/\\\\/g, "\u0000")
    .replace(/\\[nN]/g, "\n")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\u0000/g, "\\");
}

function parseDate(value: string, field: string): string {
  const date = /^(\d{4})(\d{2})(\d{2})$/.exec(value);
  if (!date) throw new Error(`Academic calendar ${field} must be an all-day date.`);
  const [, year, month, day] = date;
  const result = `${year}-${month}-${day}`;
  const parsed = new Date(`${result}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== result) {
    throw new Error(`Academic calendar ${field} is not a valid date.`);
  }
  return result;
}

export function parseAcademicCalendar(ics: string): AcademicCalendarEvent[] {
  const lines: string[] = [];
  for (const line of ics.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n")) {
    if (/^[ \t]/.test(line) && lines.length > 0) lines[lines.length - 1] += line.slice(1);
    else lines.push(line);
  }

  const events: AcademicCalendarEvent[] = [];
  let current: Record<string, string> | undefined;
  for (const line of lines) {
    if (line === "BEGIN:VEVENT") {
      if (current) throw new Error("Academic calendar contains a nested event.");
      current = {};
      continue;
    }
    if (line === "END:VEVENT") {
      if (!current) throw new Error("Academic calendar contains an unmatched event end.");
      const id = current.UID;
      const title = current.SUMMARY;
      const start = current.DTSTART;
      const end = current.DTEND;
      if (!id || !title || !start || !end) throw new Error("Academic calendar event is missing a UID, title, or date.");
      const firstDate = parseDate(start, "start");
      const endDate = parseDate(end, "end");
      if (endDate <= firstDate) throw new Error("Academic calendar event has an invalid date range.");

      const cursor = new Date(`${firstDate}T00:00:00Z`);
      const exclusiveEnd = new Date(`${endDate}T00:00:00Z`);
      while (cursor < exclusiveEnd) {
        const eventDate = cursor.toISOString().slice(0, 10);
        events.push({ id: `${id}:${eventDate}`, title: unescapeText(title), event_date: eventDate });
        cursor.setUTCDate(cursor.getUTCDate() + 1);
      }
      current = undefined;
      continue;
    }
    if (!current) continue;
    const separator = line.indexOf(":");
    if (separator < 0) continue;
    const property = line.slice(0, separator).split(";", 1)[0].toUpperCase();
    if (property === "UID" || property === "SUMMARY" || property === "DTSTART" || property === "DTEND") {
      current[property] = line.slice(separator + 1);
    }
  }
  if (current) throw new Error("Academic calendar contains an unterminated event.");
  return events;
}
