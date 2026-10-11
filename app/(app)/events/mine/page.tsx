'use client';
/* eslint-disable @typescript-eslint/no-explicit-any -- legacy module: typed rewrite pending */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabase } from '@/lib/supabase/browser';
import { getMyEventRequests, resubmitEventRequest } from '@/lib/db/events';

const supabase = getSupabase();

const statusBadge: Record<string, string> = {
  SUBMITTED: 'bg-status-amber-light text-status-amber-dark border-status-amber-dark',
  CHANGES_REQUESTED: 'bg-status-amber-light text-status-amber-dark border-status-amber-dark',
  PENDING_DIRECTOR: 'bg-status-blue-light text-status-blue-dark border-status-blue-dark',
  APPROVED: 'bg-status-green-light text-status-green-dark border-status-green-dark',
  REJECTED: 'bg-status-red-light text-status-red-dark border-status-red-dark',
  CALENDARED: 'bg-status-green-light text-status-green-dark border-status-green-dark',
};

export default function MyEventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [resubmitting, setResubmitting] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push('/sign-in');
      try {
        const myEvents = await getMyEventRequests(user.id);
        setEvents(myEvents);
      } catch (e: any) {
        setError(e.message);
      }
    })();
  }, [router]);

  const handleResubmit = async (id: string) => {
    setResubmitting(id);
    try {
      await resubmitEventRequest(id);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const updated = await getMyEventRequests(user.id);
        setEvents(updated);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setResubmitting(null);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-primary">My events</h1>
          <button onClick={() => router.push('/events/new')} className="text-sm text-accent underline">
            Request new event
          </button>
        </div>
        {error && <div className="mb-4 p-4 bg-status-red-light border border-status-red-dark rounded-card text-status-red-dark">{error}</div>}
        <div className="space-y-3">
          {events.length === 0 && (
            <div className="bg-surface rounded-card border p-8 text-center text-secondary">No events yet</div>
          )}
          {events.map((e) => (
            <div key={e.id} className="bg-surface rounded-card border p-5">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-lg font-semibold text-primary">{e.event_name}</p>
                  <p className="text-sm text-secondary">{e.theme}</p>
                  <p className="text-xs text-secondary mt-1">
                    {e.proposed_date} · {e.start_time}–{e.end_time}
                  </p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs border ${statusBadge[e.status]}`}>{e.status}</span>
              </div>

              {/* Expandable details */}
              {expandedId === e.id && (
                <div className="mt-4 pt-4 border-t border-border space-y-3 text-sm">
                  <p>
                    <span className="font-semibold text-secondary">Attendees:</span> {e.attendees}
                  </p>
                  <p>
                    <span className="font-semibold text-secondary">Budget:</span> ₹{e.budget}
                  </p>
                  <p>
                    <span className="font-semibold text-secondary">Category:</span> {e.category}
                  </p>
                  {e.description && (
                    <p>
                      <span className="font-semibold text-secondary">Description:</span> {e.description}
                    </p>
                  )}
                  {e.decision_note && (
                    <p className="bg-amber-50 border border-amber-200 p-2 rounded text-status-amber-dark">
                      <span className="font-semibold">Feedback:</span> {e.decision_note}
                    </p>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => setExpandedId(expandedId === e.id ? null : e.id)}
                  className="text-sm text-accent underline"
                >
                  {expandedId === e.id ? 'Hide' : 'Show'} details
                </button>
                {e.status === 'CHANGES_REQUESTED' && (
                  <button
                    disabled={resubmitting === e.id}
                    onClick={() => handleResubmit(e.id)}
                    className="text-sm text-accent underline disabled:opacity-50"
                  >
                    {resubmitting === e.id ? 'Resubmitting...' : 'Resubmit'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
