'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { getOrdersForCanteen } from '@/lib/db/canteen';
import { nowIST } from '@/lib/time';
import { format } from 'date-fns';

const supabase = createClient<any>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
) as any;

// Public token board: PAID orders are ready for pickup
export default function DisplayPage() {
  const { id } = useParams<{ id: string }>();
  const [ready, setReady] = useState<string[]>([]);

  const load = useCallback(async () => {
    try {
      const orders = await getOrdersForCanteen(id, format(nowIST(), 'yyyy-MM-dd'));
      setReady(orders.filter((o) => o.status === 'PAID').map((o) => o.token));
    } catch {
      /* display board stays on last known state */
    }
  }, [id]);

  useEffect(() => {
    load();
    const ch = supabase
      .channel(`display-${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `canteen_id=eq.${id}` }, load)
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [id, load]);

  return (
    <div className="min-h-screen bg-slate-900 p-10">
      <h1 className="text-4xl font-bold text-white mb-8">Ready for pickup</h1>
      <div className="grid grid-cols-3 md:grid-cols-5 gap-6">
        {ready.map((t) => (
          <div key={t} className="bg-teal-700 rounded-lg p-6 text-center text-4xl font-bold text-white">
            {t}
          </div>
        ))}
      </div>
      {ready.length === 0 && <p className="text-slate-400 text-xl">No orders ready</p>}
    </div>
  );
}
