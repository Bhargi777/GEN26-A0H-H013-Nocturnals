// IST (Asia/Kolkata) timezone utilities
// All scheduling logic must use IST, never browser clock

import { format, parseISO } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

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
 * Validate canteen slot window:
 * - start must be >= 15 minutes from now
 * - end must be <= 60 minutes from now
 * All times in IST
 */
export function isValidCanteenSlot(slotStart: Date, slotEnd: Date): boolean {
  const now = nowIST();
  const fifteenMinutesFromNow = new Date(now.getTime() + 15 * 60 * 1000);
  const sixtyMinutesFromNow = new Date(now.getTime() + 60 * 60 * 1000);

  return slotStart >= fifteenMinutesFromNow && slotEnd <= sixtyMinutesFromNow;
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
