import { describe, expect, it } from "vitest";
import { MinHeap, drainSorted, smallestK } from "./heap";
import { assignLanes, findOverlaps, mergeSpans, minutesOf, overlaps } from "./intervals";

describe("MinHeap", () => {
  it("pops in ascending order", () => {
    const heap = new MinHeap<number>((a, b) => a - b);
    [5, 1, 9, 3, 7, 2].forEach((n) => heap.push(n));
    const out: number[] = [];
    while (heap.size) out.push(heap.pop() as number);
    expect(out).toEqual([1, 2, 3, 5, 7, 9]);
    expect(heap.pop()).toBeUndefined();
  });
  it("keeps the k smallest without sorting everything", () => {
    const data = [40, 10, 30, 20, 50, 5, 15];
    expect(smallestK(data, 3, (a, b) => a - b)).toEqual([5, 10, 15]);
    expect(smallestK(data, 0, (a, b) => a - b)).toEqual([]);
    expect(smallestK(data, 99, (a, b) => a - b)).toEqual([5, 10, 15, 20, 30, 40, 50]);
  });
  it("matches Array.sort on varied input", () => {
    const data = Array.from({ length: 200 }, (_, i) => (i * 7919) % 1009);
    expect(drainSorted(data, (a, b) => a - b)).toEqual([...data].sort((a, b) => a - b));
  });
});

describe("intervals", () => {
  const span = (a: string, b: string) => ({ start: minutesOf(a), end: minutesOf(b) });
  it("treats back-to-back spans as not overlapping", () => {
    expect(overlaps(span("10:00", "12:00"), span("12:00", "13:00"))).toBe(false);
    expect(overlaps(span("10:00", "12:01"), span("12:00", "13:00"))).toBe(true);
  });
  it("finds only the spans that clash with the candidate", () => {
    const existing = [span("08:00", "09:00"), span("09:30", "11:00"), span("10:00", "10:30"), span("13:00", "14:00")].sort((a, b) => a.start - b.start);
    expect(findOverlaps(span("10:15", "12:00"), existing)).toEqual([span("09:30", "11:00"), span("10:00", "10:30")]);
    expect(findOverlaps(span("11:00", "13:00"), existing)).toEqual([]);
    expect(findOverlaps(span("07:00", "07:30"), [])).toEqual([]);
  });
  it("merges overlapping and touching spans", () => {
    expect(mergeSpans([span("09:00", "10:00"), span("10:00", "11:00"), span("13:00", "14:00"), span("09:30", "09:45")])).toEqual([span("09:00", "11:00"), span("13:00", "14:00")]);
  });
  it("uses the fewest lanes and never overlaps within a lane", () => {
    const items = [span("09:00", "11:00"), span("09:30", "10:30"), span("10:30", "12:00"), span("11:00", "12:00"), span("09:45", "10:15")];
    const { placed, laneCount } = assignLanes(items);
    expect(laneCount).toBe(3);
    for (const a of placed) for (const b of placed) if (a !== b && a.lane === b.lane) expect(overlaps(a.item, b.item)).toBe(false);
  });
});
