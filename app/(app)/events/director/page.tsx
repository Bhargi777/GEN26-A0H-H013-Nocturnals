'use client';
/* eslint-disable @typescript-eslint/no-explicit-any -- legacy module: typed rewrite pending */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabase } from '@/lib/supabase/browser';
import { getEventRequestsForDirector, directorApproveEventRequest, directorRejectEventRequest } from '@/lib/db/events';

const supabase = getSupabase();

const statusBadge: Record<string, string> = {
  SUBMITTED: 'bg-status-amber-light text-status-amber-dark border-status-amber-dark',
  CHANGES_REQUESTED: 'bg-status-amber-light text-status-amber-dark border-status-amber-dark',
  PENDING_DIRECTOR: 'bg-status-blue-light text-status-blue-dark border-status-blue-dark',
  APPROVED: 'bg-status-green-light text-status-green-dark border-status-green-dark',
  REJECTED: 'bg-status-red-light text-status-red-dark border-status-red-dark',
  CALENDARED: 'bg-status-green-light text-status-green-dark border-status-green-dark',
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
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-primary mb-6">Event approvals (Campus director)</h1>
        {error && <div className="mb-4 p-4 bg-status-red-light border border-status-red-dark rounded-card text-status-red-dark">{error}</div>}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-border">
          {(['PENDING_DIRECTOR', 'APPROVED', 'REJECTED'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 font-semibold border-b-2 ${
                activeTab === tab
                  ? 'border-accent text-accent'
                  : 'border-transparent text-secondary hover:text-primary'
              }`}
            >
              {tab.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        {/* Events grid */}
        <div className="grid md:grid-cols-2 gap-4">
          {filtered.length === 0 && <p className="text-secondary col-span-full">No events in this category</p>}
          {filtered.map((e) => (
            <div key={e.id} className="bg-surface rounded-card border p-5 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-lg font-semibold text-primary">{e.event_name}</p>
                  <p className="text-sm text-secondary">{e.theme}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs border whitespace-nowrap ${statusBadge[e.status]}`}>
                  {e.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm text-secondary">
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
                <p className="text-sm text-secondary">
                  <span className="font-semibold">Description:</span> {e.description}
                </p>
              )}

              {/* OSA feedback */}
              {e.decision_note && (
                <p className="text-sm bg-status-blue-light border border-status-blue-dark p-2 rounded text-status-blue-dark">
                  <span className="font-semibold">OSA feedback:</span> {e.decision_note}
                </p>
              )}

              {/* Actions */}
              {activeTab === 'PENDING_DIRECTOR' && (
                <div className="flex gap-2 pt-3">
                  <button
                    disabled={busy}
                    onClick={() => handleApprove(e.id)}
                    className="flex-1 py-2 bg-status-green-dark text-surface rounded-card text-sm font-semibold disabled:opacity-50"
                  >
                    Approve
                  </button>
                  <button
                    disabled={busy}
                    onClick={() => setReasonModal({ id: e.id, reason: '' })}
                    className="flex-1 py-2 bg-status-red-dark text-surface rounded-card text-sm font-semibold disabled:opacity-50"
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
          <div className="bg-surface rounded-card border p-6 max-w-sm w-full space-y-4">
            <h2 className="text-lg font-semibold text-primary">Reject event</h2>
            <textarea
              value={reasonModal.reason}
              onChange={(e) => setReasonModal({ ...reasonModal, reason: e.target.value })}
              placeholder="Reason for rejection"
              className="w-full h-24 px-3 py-2 border border-border rounded-card"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setReasonModal(null)}
                className="flex-1 py-2 bg-border text-secondary rounded-card"
              >
                Cancel
              </button>
              <button
                disabled={busy}
                onClick={() => handleReject(reasonModal.id, reasonModal.reason)}
                className="flex-1 py-2 bg-status-red-dark text-surface rounded-card disabled:opacity-50"
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
