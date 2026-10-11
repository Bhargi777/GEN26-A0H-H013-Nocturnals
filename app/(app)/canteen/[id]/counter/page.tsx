'use client';

import { useState } from 'react';
import { getOrderByToken, markOrderPaid, markOrderCollected } from '@/lib/db/canteen';

export default function CounterPage() {
  const [token, setToken] = useState('');
  const [order, setOrder] = useState<any>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const search = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setOrder(null);
    try {
      setOrder(await getOrderByToken(token.trim().toUpperCase()));
    } catch {
      setError('No order found for that token');
    }
  };

  const act = async (fn: (id: string) => Promise<any>) => {
    setBusy(true);
    setError('');
    try {
      await fn(order.id);
      setOrder(await getOrderByToken(order.token));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-md mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 mb-6">Counter</h1>
        <form onSubmit={search} className="flex gap-2 mb-6">
          <input
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Token, e.g. C047"
            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg"
          />
          <button className="px-4 py-2 bg-teal-700 text-white rounded-lg">Find</button>
        </form>
        {error && <div className="mb-4 p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-800">{error}</div>}
        {order && (
          <div className="bg-white rounded-lg shadow p-6 space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-3xl font-bold text-teal-700">{order.token}</p>
              <span className="px-2 py-0.5 rounded-full text-xs border border-slate-200">{order.status}</span>
            </div>
            <p className="text-slate-800">Total: ₹{order.total}</p>
            <p className="text-sm text-slate-600">{order.order_items?.length || 0} item(s)</p>
            {order.status === 'PLACED' && (
              <button
                disabled={busy}
                onClick={() => act(markOrderPaid)}
                className="w-full py-2 bg-teal-700 text-white rounded-lg disabled:opacity-50"
              >
                Mark paid
              </button>
            )}
            {order.status === 'PAID' && (
              <button
                disabled={busy}
                onClick={() => act(markOrderCollected)}
                className="w-full py-2 bg-teal-700 text-white rounded-lg disabled:opacity-50"
              >
                Mark collected
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
