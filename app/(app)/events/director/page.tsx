'use client';
/* eslint-disable @typescript-eslint/no-explicit-any -- legacy module: typed rewrite pending */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabase } from '@/lib/supabase/browser';
import { getEventRequestsForDirector, directorApproveEventRequest, directorRejectEventRequest } from '@/lib/db/events';

const supabase = getSupabase();

const statusBadge: Record<string, string> = {
  SUBMITTED: 'bg-amber-50 text-amber-800 border-amber-200',
  CHANGES_REQUESTED: 'bg-amber-50 text-amber-800 border-amber-200',
  PENDING_DIRECTOR: 'bg-sky-50 text-sky-800 border-sky-200',
  APPROVED: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  REJECTED: 'bg-rose-50 text-rose-800 border-rose-200',
  CALENDARED: 'bg-emerald-50 text-emerald-800 border-emerald-200',
};

export default function DirectorEventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'PENDING_DIRECTOR' | 'APPROVED' | 'REJECTED'>('PENDING_DIRECTOR');
  const [reasonModal, setReasonModal] = useState<{ id: string; reason: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const allEvents = await getEventRequestsForDirector();
      setEvents(allEvents);
    } catch (e: any) {
      setError(e.message);
    }
  }, []);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push('/sign-in');

      // Check if user is campus director
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role !== 'campus_director') {
        return router.push('/dashboard');
      }

      await load();
    })();

    const ch = supabase
      .channel('events-director')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'event_requests' }, load)
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [load, router]);

  const filtered = events.filter((e) => e.status === activeTab);

  const handleApprove = async (id: string) => {
    setBusy(true);
    try {
      await directorApproveEventRequest(id);
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const handleReject = async (id: string, reason: string) => {
    if (!reason.trim()) {
      setError('Please enter a reason for rejection');
      return;
    }
    setBusy(true);
    try {
      await directorRejectEventRequest(id, reason);
      setReasonModal(null);
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 mb-6">Event approvals (Campus director)</h1>
        {error && <div className="mb-4 p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-800">{error}</div>}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-slate-200">
          {(['PENDING_DIRECTOR', 'APPROVED', 'REJECTED'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 font-semibold border-b-2 ${
                activeTab === tab
                  ? 'border-teal-700 text-teal-700'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        {/* Events grid */}
        <div className="grid md:grid-cols-2 gap-4">
          {filtered.length === 0 && <p className="text-slate-500 col-span-full">No events in this category</p>}
          {filtered.map((e) => (
            <div key={e.id} className="bg-white rounded-lg shadow p-5 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-lg font-semibold text-slate-900">{e.event_name}</p>
                  <p className="text-sm text-slate-600">{e.theme}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs border whitespace-nowrap ${statusBadge[e.status]}`}>
                  {e.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm text-slate-600">
                <p>
                  <span className="font-semibold">Date:</span> {e.proposed_date}
                </p>
                <p>
                  <span className="font-semibold">Time:</span> {e.start_time}–{e.end_time}
                </p>
                <p>
                  <span className="font-semibold">Attendees:</span> {e.attendees}
                </p>
                <p>
                  <span className="font-semibold">Budget:</span> ₹{e.budget}
                </p>
              </div>

              {e.description && (
                <p className="text-sm text-slate-600">
                  <span className="font-semibold">Description:</span> {e.description}
                </p>
              )}

              {/* OSA feedback */}
              {e.decision_note && (
                <p className="text-sm bg-sky-50 border border-sky-200 p-2 rounded text-sky-800">
                  <span className="font-semibold">OSA feedback:</span> {e.decision_note}
                </p>
              )}

              {/* Actions */}
              {activeTab === 'PENDING_DIRECTOR' && (
                <div className="flex gap-2 pt-3">
                  <button
                    disabled={busy}
                    onClick={() => handleApprove(e.id)}
                    className="flex-1 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50"
                  >
                    Approve
                  </button>
                  <button
                    disabled={busy}
                    onClick={() => setReasonModal({ id: e.id, reason: '' })}
                    className="flex-1 py-2 bg-rose-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Reason modal */}
      {reasonModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow p-6 max-w-sm w-full space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">Reject event</h2>
            <textarea
              value={reasonModal.reason}
              onChange={(e) => setReasonModal({ ...reasonModal, reason: e.target.value })}
              placeholder="Reason for rejection"
              className="w-full h-24 px-3 py-2 border border-slate-300 rounded-lg"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setReasonModal(null)}
                className="flex-1 py-2 bg-slate-200 text-slate-700 rounded-lg"
              >
                Cancel
              </button>
              <button
                disabled={busy}
                onClick={() => handleReject(reasonModal.id, reasonModal.reason)}
                className="flex-1 py-2 bg-rose-600 text-white rounded-lg disabled:opacity-50"
              >
                {busy ? 'Rejecting...' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
