'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { Block } from '@/lib/types/database';
import {
  getBlocksByDepartment,
  getRoomBookingsByDateAndBlock,
  approveRoomBooking,
  rejectRoomBooking,
} from '@/lib/db/rooms';
import { nowIST } from '@/lib/time';
import { format } from 'date-fns';

const supabase = createClient<any>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
) as any;

type Tab = 'pending' | 'conflicts' | 'decided';

export default function DeptRoomsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [blockId, setBlockId] = useState('');
  const [date, setDate] = useState(format(nowIST(), 'yyyy-MM-dd'));
  const [tab, setTab] = useState<Tab>('pending');
  const [bookings, setBookings] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push('/sign-in');
      const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (!p || !['dept_office', 'dept_head', 'admin'].includes(p.role)) {
        return router.push('/dashboard');
      }
      setProfile(p);
      try {
        const b = p.department_id ? await getBlocksByDepartment(p.department_id) : [];
        setBlocks(b);
        if (b[0]) setBlockId(b[0].id);
      } catch (e: any) {
        setError(e.message);
      }
    })();
  }, [router]);

  const load = useCallback(async () => {
    if (!blockId) return;
    try {
      setBookings(await getRoomBookingsByDateAndBlock(blockId, date));
    } catch (e: any) {
      setError(e.message);
    }
  }, [blockId, date]);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (id: string, kind: 'approve' | 'reject') => {
    setBusy(id);
    setError('');
    try {
      if (kind === 'approve') await approveRoomBooking(id, profile.id);
      else {
        const note = window.prompt('Reason for rejection?');
        if (!note) return;
        await rejectRoomBooking(id, profile.id, note);
      }
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy('');
    }
  };

  const pending = bookings.filter((b) => b.status === 'PENDING');
  const slotKey = (b: any) => `${b.room_id}|${b.period_id}`;
  const counts = pending.reduce((m: Record<string, number>, b) => {
    m[slotKey(b)] = (m[slotKey(b)] || 0) + 1;
    return m;
  }, {});
  const conflicts = pending.filter((b) => counts[slotKey(b)] > 1);
  const decided = bookings.filter((b) => b.status !== 'PENDING');
  const shown = tab === 'pending' ? pending : tab === 'conflicts' ? conflicts : decided;

  const badge: Record<string, string> = {
    PENDING: 'bg-amber-50 text-amber-800 border-amber-200',
    APPROVED: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    REJECTED: 'bg-rose-50 text-rose-800 border-rose-200',
    CANCELLED: 'bg-slate-50 text-slate-700 border-slate-200',
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 mb-6">Room Requests</h1>

        <div className="flex flex-wrap gap-4 mb-6">
          <select
            value={blockId}
            onChange={(e) => setBlockId(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg"
          >
            {blocks.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.code})
              </option>
            ))}
          </select>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg"
          />
        </div>

        <div className="flex gap-2 mb-6 border-b border-slate-200">
          {(['pending', 'conflicts', 'decided'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium capitalize border-b-2 ${
                tab === t ? 'border-teal-700 text-teal-700' : 'border-transparent text-slate-600'
              }`}
            >
              {t}
              {t === 'pending' && ` (${pending.length})`}
              {t === 'conflicts' && ` (${conflicts.length})`}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-4 p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-800">{error}</div>
        )}

        {shown.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-slate-500">Nothing here</div>
        ) : (
          <div className="space-y-3">
            {shown.map((b) => (
              <div key={b.id} className="bg-white rounded-lg shadow p-5 flex justify-between gap-4">
                <div>
                  <p className="font-semibold text-slate-900">
                    {b.room?.name} · {b.period?.label}
                  </p>
                  <p className="text-sm text-slate-600">
                    {b.faculty_name} · {b.attendees} attendees
                  </p>
                  <p className="text-sm text-slate-800 mt-1">{b.reason}</p>
                  {b.decision_note && (
                    <p className="text-xs text-slate-500 mt-1">Note: {b.decision_note}</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs border ${badge[b.status]}`}>
                    {b.status}
                  </span>
                  {b.status === 'PENDING' && (
                    <div className="flex gap-2">
                      <button
                        disabled={busy === b.id}
                        onClick={() => act(b.id, 'approve')}
                        className="px-3 py-1 text-sm bg-teal-700 text-white rounded-lg disabled:opacity-50"
                      >
                        Approve
                      </button>
                      <button
                        disabled={busy === b.id}
                        onClick={() => act(b.id, 'reject')}
                        className="px-3 py-1 text-sm border border-slate-300 rounded-lg disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
