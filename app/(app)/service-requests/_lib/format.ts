import { connection } from "next/server";

const relative = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["day", 24 * 60 * 60 * 1000],
  ["hour", 60 * 60 * 1000],
  ["minute", 60 * 1000],
];

/** "3 hours ago", "yesterday", "just now". */
export function formatAgo(iso: string, now: number = Date.now()): string {
  const elapsed = Date.parse(iso) - now;
  for (const [unit, ms] of UNITS) {
    if (Math.abs(elapsed) >= ms) return relative.format(Math.round(elapsed / ms), unit);
  }
  return "just now";
}

const dateTime = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export function formatDateTime(iso: string): string {
  return dateTime.format(new Date(iso));
}

/** The time a server page is rendered at, read once per request. Awaiting connection() marks the page as request-time, so the clock is never prerendered. */
export async function requestTime(): Promise<number> {
  await connection();
  return Date.now();
}
