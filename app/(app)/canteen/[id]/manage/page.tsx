'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { getAllMenuItems, toggleMenuItemAvailability, getCanteenSlots, createCanteenSlot } from '@/lib/db/canteen';
import { nowIST } from '@/lib/time';
import { format } from 'date-fns';

export default function ManagePage() {
  const { id } = useParams<{ id: string }>();
  const [items, setItems] = useState<any[]>([]);
  const [slots, setSlots] = useState<any[]>([]);
  const [error, setError] = useState('');
  const today = format(nowIST(), 'yyyy-MM-dd');

  const load = useCallback(async () => {
    try {
      setItems(await getAllMenuItems(id));
      setSlots(await getCanteenSlots(id, today));
    } catch (e: any) {
      setError(e.message);
    }
  }, [id, today]);

  useEffect(() => {
    load();
  }, [load]);

  const toggle = async (item: any) => {
    try {
      await toggleMenuItemAvailability(item.id, !item.available);
      await load();
    } catch (e: any) {
      setError(e.message);
    }
  };

  // Generate 15-minute slots for the rest of today's service window (08:00–20:00 IST)
  const generateSlots = async () => {
    setError('');
    try {
      const existing = new Set(slots.map((s) => s.start_time.slice(0, 5)));
      for (let m = 8 * 60; m < 20 * 60; m += 15) {
        const hm = (x: number) => `${String(Math.floor(x / 60)).padStart(2, '0')}:${String(x % 60).padStart(2, '0')}`;
        if (existing.has(hm(m))) continue;
        await createCanteenSlot(id, today, hm(m), hm(m + 15), 30);
      }
      await load();
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-slate-900">Manage canteen</h1>
        {error && <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-800">{error}</div>}

        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-3">Menu availability</h2>
          <div className="bg-white rounded-lg shadow divide-y divide-slate-100">
            {items.map((i) => (
              <div key={i.id} className="flex justify-between items-center p-4">
                <span className="text-slate-800">
                  {i.name} · ₹{i.price}
                </span>
                <button
                  onClick={() => toggle(i)}
                  className={`px-3 py-1 text-sm rounded-lg border ${
                    i.available
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-slate-100 text-slate-600 border-slate-300'
                  }`}
                >
                  {i.available ? 'Available' : 'Sold out'}
                </button>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold text-slate-900">Today&apos;s slots ({slots.length})</h2>
            <button onClick={generateSlots} className="px-3 py-1 text-sm bg-teal-700 text-white rounded-lg">
              Generate 15-min slots
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {slots.map((s) => (
              <span key={s.id} className="px-2 py-1 text-xs bg-white border border-slate-200 rounded">
                {s.start_time.slice(0, 5)}
              </span>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
