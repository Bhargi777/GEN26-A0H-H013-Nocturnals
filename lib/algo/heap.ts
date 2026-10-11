/** Binary min-heap. push and pop are O(log n), peek is O(1). */
export class MinHeap<T> {
  private items: T[] = [];

  constructor(private readonly compare: (a: T, b: T) => number) {}

  get size(): number { return this.items.length; }

  peek(): T | undefined { return this.items[0]; }

  push(value: T): void {
    this.items.push(value);
    let child = this.items.length - 1;
    while (child > 0) {
      const parent = (child - 1) >> 1;
      if (this.compare(this.items[child], this.items[parent]) >= 0) break;
      [this.items[child], this.items[parent]] = [this.items[parent], this.items[child]];
      child = parent;
    }
  }

  pop(): T | undefined {
    const top = this.items[0];
    const last = this.items.pop();
    if (this.items.length > 0 && last !== undefined) {
      this.items[0] = last;
      let parent = 0;
      for (;;) {
        const left = parent * 2 + 1;
        const right = left + 1;
        let smallest = parent;
        if (left < this.items.length && this.compare(this.items[left], this.items[smallest]) < 0) smallest = left;
        if (right < this.items.length && this.compare(this.items[right], this.items[smallest]) < 0) smallest = right;
        if (smallest === parent) break;
        [this.items[parent], this.items[smallest]] = [this.items[smallest], this.items[parent]];
        parent = smallest;
      }
    }
    return top;
  }
}

/** The `k` smallest items in order, in O(n log k): a bounded max-heap instead of sorting everything. */
export function smallestK<T>(items: Iterable<T>, k: number, compare: (a: T, b: T) => number): T[] {
  if (k <= 0) return [];
  const worstFirst = new MinHeap<T>((a, b) => compare(b, a));
  for (const item of items) {
    if (worstFirst.size < k) worstFirst.push(item);
    else if (compare(item, worstFirst.peek() as T) < 0) { worstFirst.pop(); worstFirst.push(item); }
  }
  const out: T[] = [];
  while (worstFirst.size) out.push(worstFirst.pop() as T);
  return out.reverse();
}

/** All items in ascending order using a heap (heap sort by repeated pop). */
export function drainSorted<T>(items: Iterable<T>, compare: (a: T, b: T) => number): T[] {
  const heap = new MinHeap<T>(compare);
  for (const item of items) heap.push(item);
  const out: T[] = [];
  while (heap.size) out.push(heap.pop() as T);
  return out;
}
