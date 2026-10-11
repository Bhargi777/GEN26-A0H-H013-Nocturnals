'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { getCanteenSlots, getSlotItemTotals } from '@/lib/db/canteen';
import { nowIST } from '@/lib/time';
import { format } from 'date-fns';

const supabase = createClient<any>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
) as any;

export default function KitchenPage() {
  const { id } = useParams<{ id: string }>();
  const [slots, setSlots] = useState<any[]>([]);
  const [totals, setTotals] = useState<Record<string, { itemName: string; quantity: number }[]>>({});
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const today = format(nowIST(), 'yyyy-MM-dd');
      const nowHM = format(nowIST(), 'HH:mm');
      const s = (await getCanteenSlots(id, today)).filter((x) => x.end_time.slice(0, 5) >= nowHM);
      setSlots(s);
      const entries = await Promise.all(s.map(async (x) => [x.id, await getSlotItemTotals(x.id)] as const));
      setTotals(Object.fromEntries(entries));
    } catch (e: any) {
      setError(e.message);
    }
  }, [id]);

  useEffect(() => {
    load();
    const ch = supabase
      .channel(`kitchen-${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `canteen_id=eq.${id}` }, load)
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [id, load]);

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 mb-6">Kitchen: items to prepare</h1>
        {error && <div className="mb-4 p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-800">{error}</div>}
        <div className="grid md:grid-cols-2 gap-4">
          {slots.map((s) => (
            <div key={s.id} className="bg-white rounded-lg shadow p-5">
              <p className="font-semibold text-slate-900 mb-3">
                {s.start_time.slice(0, 5)}–{s.end_time.slice(0, 5)}
              </p>
              {(totals[s.id] || []).length === 0 ? (
                <p className="text-sm text-slate-500">No orders</p>
              ) : (
                <ul className="space-y-1">
                  {totals[s.id].map((t) => (
                    <li key={t.itemName} className="flex justify-between text-slate-800">
                      <span>{t.itemName}</span>
                      <span className="font-semibold">×{t.quantity}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
          {slots.length === 0 && <p className="text-slate-500">No upcoming slots today</p>}
        </div>
      </div>
    </div>
  );
}
