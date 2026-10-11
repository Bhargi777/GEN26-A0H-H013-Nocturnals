/** Month grid helpers. All dates are yyyy-MM-dd strings and are handled in UTC so the machine's timezone never shifts a day. */

export interface GridDay { date: string; inMonth: boolean }

const pad = (n: number) => String(n).padStart(2, '0');
export const toKey = (d: Date) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;

/** Six weeks starting on Sunday that cover the month, so the grid never changes height. */
export function monthGrid(year: number, month: number): GridDay[] {
  const first = new Date(Date.UTC(year, month - 1, 1));
  const start = new Date(first);
  start.setUTCDate(1 - first.getUTCDay());
  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(start);
    day.setUTCDate(start.getUTCDate() + index);
    return { date: toKey(day), inMonth: day.getUTCMonth() === month - 1 };
  });
}

export function shiftMonth(year: number, month: number, by: number): { year: number; month: number } {
  const moved = new Date(Date.UTC(year, month - 1 + by, 1));
  return { year: moved.getUTCFullYear(), month: moved.getUTCMonth() + 1 };
}

/** Group items by their date key in one pass: O(n). */
export function groupByDate<T extends { event_date: string }>(items: T[]): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const list = map.get(item.event_date);
    if (list) list.push(item); else map.set(item.event_date, [item]);
  }
  return map;
}
