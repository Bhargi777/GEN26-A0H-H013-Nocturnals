// Pure helpers for understanding a campus question without a language model.
import { istDate } from "../../time";

export type Intent = "book_room" | "my_orders" | "my_rooms" | "events" | "tickets" | "help";

const WEEKDAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

export function detectIntent(text: string): Intent {
  const t = text.toLowerCase();
  // "How/when/why/what happens..." questions are about rules, unless they ask for the user's own status
  const ruleQuestion = /^(how|when|why|can|what happens|what is|what are the|is there|do i|does)\b/.test(t.trim()) && !/\b(where is|status of|show|list)\b/.test(t);
  if (ruleQuestion && !/\bevents?\b|\bcalendar\b/.test(t)) return "help";
  if (/\b(book|reserve|need|find|get)\b.*\b(room|hall|class ?room|lab)\b/.test(t) || /\broom for\b/.test(t)) return "book_room";
  if (/\b(request|booking)s?\b/.test(t) && /\broom|booking\b/.test(t)) return "my_rooms";
  if (/\b(order|orders|token|food)\b/.test(t)) return "my_orders";
  if (/\b(event|events|calendar|happening|what'?s on|fest)\b/.test(t)) return "events";
  if (/\b(ticket|tickets|complaint|service request|issue status)\b/.test(t)) return "tickets";
  return "help";
}

/** Date in IST as yyyy-MM-dd from words like today, tomorrow, friday, 13 oct or 2026-10-13. */
export function parseDate(text: string, now: Date = new Date()): string | undefined {
  const t = text.toLowerCase();
  const iso = t.match(/\b(20\d\d)-(\d\d)-(\d\d)\b/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  if (/\btoday\b/.test(t)) return istDate(0, now);
  if (/\btomorrow\b/.test(t)) return istDate(1, now);
  const today = istDate(0, now);
  const todayIndex = new Date(`${today}T00:00:00Z`).getUTCDay();
  for (let index = 0; index < 7; index += 1) {
    if (new RegExp(`\\b${WEEKDAYS[index]}\\b`).test(t)) return istDate((index - todayIndex + 7) % 7 || 7, now);
  }
  const dayMonth = t.match(/\b(\d{1,2})\s*(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\b/);
  if (dayMonth) {
    const year = Number(today.slice(0, 4));
    const month = MONTHS.indexOf(dayMonth[2]) + 1;
    const candidate = `${year}-${String(month).padStart(2, "0")}-${String(Number(dayMonth[1])).padStart(2, "0")}`;
    return candidate < today ? `${year + 1}${candidate.slice(4)}` : candidate;
  }
  return undefined;
}

export function parsePeriod(text: string): number | undefined {
  const match = text.toLowerCase().match(/\bperiod\s*(\d{1,2})\b|\b(\d)(?:st|nd|rd|th)\s+period\b/);
  const value = match ? Number(match[1] ?? match[2]) : undefined;
  return value && value >= 1 && value <= 12 ? value : undefined;
}

export function parseAttendees(text: string): number | undefined {
  const t = text.toLowerCase();
  const match = t.match(/\b(\d{1,4})\s*(people|persons|students|attendees|members|seats|pax)\b/) ?? t.match(/\bfor\s+(\d{1,4})\b(?!\s*(?:am|pm|:))/);
  const value = match ? Number(match[1]) : undefined;
  return value && value > 0 && value <= 2000 ? value : undefined;
}
