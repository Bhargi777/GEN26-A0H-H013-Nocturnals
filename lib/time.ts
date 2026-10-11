// IST (Asia/Kolkata) timezone utilities
// All scheduling logic must use IST, never browser clock

import { format, parseISO } from 'date-fns';
import { formatInTimeZone, fromZonedTime, toZonedTime } from 'date-fns-tz';

const IST = 'Asia/Kolkata';

/**
 * Get current time in IST
 */
export function nowIST(): Date {
  return toZonedTime(new Date(), IST);
}

/**
 * Convert UTC to IST
 */
export function toIST(utcDate: Date): Date {
  return toZonedTime(utcDate, IST);
}

/**
 * Get next calendar date for a given weekday (0=Sun, 6=Sat)
 * If today matches and the slot hasn't started, return today's date
 */
export function nextDateForWeekday(weekday: number): Date {
  const now = nowIST();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayWeekday = today.getDay();

  let daysAhead = weekday - todayWeekday;
  if (daysAhead <= 0) {
    daysAhead += 7;
  }

  const result = new Date(today);
  result.setDate(result.getDate() + daysAhead);
  return result;
}

/**
 * Get slot info for a given date and period
 * Returns { startTime, endTime } in HH:MM format
 */
export function slotFor(date: Date, periodId: string): { startTime: string; endTime: string } | null {
  // In practice, this would query the periods table
  // For now, return null (caller should fetch from DB)
  return null;
}

/**
 * Validate canteen slot window against real instants:
 * - start must be >= 15 minutes from now
 * - end must be <= 60 minutes from now
 */
export function isValidCanteenSlot(slotStart: Date, slotEnd: Date, now: Date = new Date()): boolean {
  const earliestStart = now.getTime() + 15 * 60 * 1000;
  const latestEnd = now.getTime() + 60 * 60 * 1000;
  return slotEnd.getTime() > slotStart.getTime() && slotStart.getTime() >= earliestStart && slotEnd.getTime() <= latestEnd;
}

/** Calendar date in IST as yyyy-MM-dd, `offsetDays` from today. */
export function istDate(offsetDays = 0, now: Date = new Date()): string {
  const day = formatInTimeZone(now, IST, 'yyyy-MM-dd');
  if (!offsetDays) return day;
  const shifted = new Date(`${day}T00:00:00Z`);
  shifted.setUTCDate(shifted.getUTCDate() + offsetDays);
  return shifted.toISOString().slice(0, 10);
}

/** Current wall-clock time in IST as HH:mm:ss. */
export function istTime(now: Date = new Date()): string {
  return formatInTimeZone(now, IST, 'HH:mm:ss');
}

/** The real instant of an IST wall-clock date (yyyy-MM-dd) and time (HH:mm[:ss]). */
export function istInstant(date: string, time: string): Date {
  return fromZonedTime(`${date}T${time.length === 5 ? `${time}:00` : time}`, IST);
}

/** 09:05:00 -> 9:05 AM */
export function formatClock(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const suffix = hours >= 12 ? 'PM' : 'AM';
  return `${hours % 12 || 12}:${String(minutes).padStart(2, '0')} ${suffix}`;
}

/** 2026-10-13 -> Tue, 13 Oct 2026 */
export function formatDay(date: string): string {
  return format(parseISO(date), 'EEE, d MMM yyyy');
}

/** Booking dates run from today to 14 days ahead, in IST. */
export function isBookableDay(date: string, now: Date = new Date()): boolean {
  return date >= istDate(0, now) && date <= istDate(14, now);
}

/**
 * Check if a booking date is within allowed range (today to 14 days ahead)
 */
export function isValidBookingDate(date: Date): boolean {
  const now = nowIST();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const fourteenDaysFromNow = new Date(today);
  fourteenDaysFromNow.setDate(fourteenDaysFromNow.getDate() + 14);

  const compareDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return compareDate >= today && compareDate <= fourteenDaysFromNow;
}
