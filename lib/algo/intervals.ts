import { MinHeap } from "./heap";

/** A half-open span [start, end) in minutes from midnight, so back-to-back events do not overlap. */
export interface Span { start: number; end: number }

export const minutesOf = (time: string): number => Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));

export const overlaps = (a: Span, b: Span): boolean => a.start < b.end && b.start < a.end;

/**
 * Every span in `existing` that overlaps `candidate`.
 * `existing` must already be sorted by start; a binary search finds where to stop,
 * because spans starting at or after the candidate's end cannot overlap it.
 */
export function findOverlaps<T extends Span>(candidate: Span, existingSortedByStart: T[]): T[] {
  let low = 0;
  let high = existingSortedByStart.length;
  while (low < high) {
    const middle = (low + high) >> 1;
    if (existingSortedByStart[middle].start < candidate.end) low = middle + 1; else high = middle;
  }
  const found: T[] = [];
  for (let index = 0; index < low; index += 1) if (overlaps(candidate, existingSortedByStart[index])) found.push(existingSortedByStart[index]);
  return found;
}

/** Merge touching or overlapping spans into the smallest set that covers the same time. */
export function mergeSpans(spans: Span[]): Span[] {
  const sorted = [...spans].sort((a, b) => a.start - b.start);
  const merged: Span[] = [];
  for (const span of sorted) {
    const last = merged[merged.length - 1];
    if (last && span.start <= last.end) last.end = Math.max(last.end, span.end);
    else merged.push({ ...span });
  }
  return merged;
}

export interface Placed<T> { item: T; lane: number }

/**
 * Interval partitioning: give each item the lowest free lane so that no two items in a lane overlap,
 * using the fewest lanes possible. A min-heap of lane end times makes it O(n log n).
 */
export function assignLanes<T extends Span>(items: T[]): { placed: Placed<T>[]; laneCount: number } {
  const sorted = [...items].sort((a, b) => a.start - b.start || a.end - b.end);
  const freeAt = new MinHeap<{ lane: number; end: number }>((a, b) => a.end - b.end || a.lane - b.lane);
  let laneCount = 0;
  const placed: Placed<T>[] = [];
  for (const item of sorted) {
    const earliest = freeAt.peek();
    let lane: number;
    if (earliest && earliest.end <= item.start) lane = (freeAt.pop() as { lane: number; end: number }).lane;
    else { lane = laneCount; laneCount += 1; }
    freeAt.push({ lane, end: item.end });
    placed.push({ item, lane });
  }
  return { placed, laneCount };
}
