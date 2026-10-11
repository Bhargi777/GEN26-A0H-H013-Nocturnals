'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { getMyOrders } from '@/lib/db/canteen';

const supabase = createClient<any>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
) as any;

const badge: Record<string, string> = {
  PLACED: 'bg-amber-50 text-amber-800 border-amber-200',
  PAID: 'bg-sky-50 text-sky-800 border-sky-200',
  COLLECTED: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  FORFEITED: 'bg-rose-50 text-rose-800 border-rose-200',
  LATE_WALKIN: 'bg-slate-50 text-slate-700 border-slate-200',
};

export default function MyOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push('/sign-in');
      try {
        setOrders(await getMyOrders(user.id));
      } catch (e: any) {
        setError(e.message);
      }
    })();
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-slate-900">My Orders</h1>
          <button onClick={() => router.push('/canteen')} className="text-sm text-teal-700 underline">
            Back to menu
          </button>
        </div>
        {error && <div className="mb-4 p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-800">{error}</div>}
        <div className="space-y-3">
          {orders.length === 0 && (
            <div className="bg-white rounded-lg shadow p-8 text-center text-slate-500">No orders yet</div>
          )}
          {orders.map((o) => (
            <div key={o.id} className="bg-white rounded-lg shadow p-5 flex justify-between items-center">
              <div>
                <p className="text-2xl font-bold text-teal-700">{o.token}</p>
                <p className="text-sm text-slate-600">
                  ₹{o.total} · {o.order_items?.length || 0} item(s)
                </p>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-xs border ${badge[o.status]}`}>{o.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
