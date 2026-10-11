'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { Canteen, MenuItem, CanteenSlot } from '@/lib/types/database';
import { getCanteens, getMenuItems, getCanteenSlots, createOrder } from '@/lib/db/canteen';
import { nowIST } from '@/lib/time';
import { format } from 'date-fns';

const supabase = createClient<any>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
) as any;

// Slot must start >= 15 min from now and end <= 60 min from now (IST, server-derived clock helpers)
function slotSelectable(slot: CanteenSlot): boolean {
  const now = nowIST();
  const [sh, sm] = slot.start_time.split(':').map(Number);
  const [eh, em] = slot.end_time.split(':').map(Number);
  const start = new Date(now);
  start.setHours(sh, sm, 0, 0);
  const end = new Date(now);
  end.setHours(eh, em, 0, 0);
  const minsToStart = (start.getTime() - now.getTime()) / 60000;
  const minsToEnd = (end.getTime() - now.getTime()) / 60000;
  return minsToStart >= 15 && minsToEnd <= 60;
}

export default function CanteenPage() {
  const router = useRouter();
  const [userId, setUserId] = useState('');
  const [canteens, setCanteens] = useState<Canteen[]>([]);
  const [canteenId, setCanteenId] = useState('');
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [slots, setSlots] = useState<CanteenSlot[]>([]);
  const [slotId, setSlotId] = useState('');
  const [cart, setCart] = useState<Record<string, number>>({});
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push('/sign-in');
      setUserId(user.id);
      try {
        const c = await getCanteens();
        setCanteens(c);
        if (c[0]) setCanteenId(c[0].id);
      } catch (e: any) {
        setError(e.message);
      }
    })();
  }, [router]);

  useEffect(() => {
    if (!canteenId) return;
    setCart({});
    setSlotId('');
    (async () => {
      try {
        setMenu(await getMenuItems(canteenId, true));
        setSlots(await getCanteenSlots(canteenId, format(nowIST(), 'yyyy-MM-dd')));
      } catch (e: any) {
        setError(e.message);
      }
    })();
  }, [canteenId]);

  const total = menu.reduce((s, m) => s + (cart[m.id] || 0) * m.price, 0);
  const itemCount = Object.values(cart).reduce((a, b) => a + b, 0);

  const adjust = (id: string, d: number) =>
    setCart((c) => {
      const n = Math.max(0, (c[id] || 0) + d);
      const next = { ...c, [id]: n };
      if (n === 0) delete next[id];
      return next;
    });

  const checkout = async () => {
    setError('');
    const slot = slots.find((s) => s.id === slotId);
    if (!slot || !slotSelectable(slot)) {
      setError('Selected pickup slot is no longer valid. Pick another.');
      return;
    }
    setSubmitting(true);
    try {
      const items = Object.entries(cart).map(([itemId, quantity]) => ({ itemId, quantity }));
      const res = await createOrder(canteenId, userId, slotId, items, total);
      setToken(res.token);
      setCart({});
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (token) {
    return (
      <div className="min-h-screen bg-slate-50 p-8 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow p-10 text-center max-w-sm w-full">
          <p className="text-slate-600 mb-2">Your pickup token</p>
          <p className="text-5xl font-bold text-teal-700 mb-4">{token}</p>
          <p className="text-sm text-slate-600 mb-6">
            Pay at the counter before your slot ends or the order is forfeited.
          </p>
          <button
            onClick={() => router.push('/canteen/orders')}
            className="w-full bg-teal-700 text-white font-semibold py-2 rounded-lg"
          >
            View my orders
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-slate-900">Canteen</h1>
          <button
            onClick={() => router.push('/canteen/orders')}
            className="text-sm text-teal-700 underline"
          >
            My orders
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-800">{error}</div>
        )}

        <div className="flex gap-2 mb-6">
          {canteens.map((c) => (
            <button
              key={c.id}
              onClick={() => setCanteenId(c.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium border ${
                canteenId === c.id
                  ? 'bg-teal-700 text-white border-teal-700'
                  : 'bg-white text-slate-700 border-slate-300'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-3">
            {menu.length === 0 && (
              <div className="bg-white rounded-lg shadow p-6 text-slate-500">No items available</div>
            )}
            {menu.map((m) => (
              <div key={m.id} className="bg-white rounded-lg shadow p-4 flex justify-between items-center">
                <div>
                  <p className="font-medium text-slate-900">
                    {m.name}{' '}
                    <span className={m.veg ? 'text-emerald-700 text-xs' : 'text-rose-700 text-xs'}>
                      {m.veg ? 'VEG' : 'NON-VEG'}
                    </span>
                  </p>
                  <p className="text-sm text-slate-600">₹{m.price}</p>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => adjust(m.id, -1)} className="w-8 h-8 border border-slate-300 rounded-lg">
                    −
                  </button>
                  <span className="w-6 text-center">{cart[m.id] || 0}</span>
                  <button onClick={() => adjust(m.id, 1)} className="w-8 h-8 border border-slate-300 rounded-lg">
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-lg shadow p-5 h-fit space-y-4">
            <h2 className="font-semibold text-slate-900">Pickup slot</h2>
            <div className="grid grid-cols-2 gap-2">
              {slots.map((s) => {
                const ok = slotSelectable(s);
                return (
                  <button
                    key={s.id}
                    disabled={!ok}
                    onClick={() => setSlotId(s.id)}
                    className={`px-2 py-2 text-sm rounded-lg border ${
                      slotId === s.id
                        ? 'bg-teal-700 text-white border-teal-700'
                        : 'border-slate-300 text-slate-700'
                    } disabled:opacity-40`}
                  >
                    {s.start_time.slice(0, 5)}–{s.end_time.slice(0, 5)}
                  </button>
                );
              })}
              {slots.length === 0 && <p className="text-sm text-slate-500 col-span-2">No slots today</p>}
            </div>
            <div className="border-t border-slate-200 pt-3 flex justify-between font-semibold">
              <span>Total</span>
              <span>₹{total}</span>
            </div>
            <button
              onClick={checkout}
              disabled={submitting || itemCount === 0 || !slotId}
              className="w-full bg-teal-700 text-white font-semibold py-2 rounded-lg disabled:bg-slate-400"
            >
              {submitting ? 'Placing...' : 'Place order'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
