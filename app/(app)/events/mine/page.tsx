'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { getMyEventRequests, resubmitEventRequest } from '@/lib/db/events';

const supabase = createClient<any>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
) as any;

const statusBadge: Record<string, string> = {
  SUBMITTED: 'bg-amber-50 text-amber-800 border-amber-200',
  CHANGES_REQUESTED: 'bg-amber-50 text-amber-800 border-amber-200',
  PENDING_DIRECTOR: 'bg-sky-50 text-sky-800 border-sky-200',
  APPROVED: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  REJECTED: 'bg-rose-50 text-rose-800 border-rose-200',
  CALENDARED: 'bg-emerald-50 text-emerald-800 border-emerald-200',
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
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-slate-900">My events</h1>
          <button onClick={() => router.push('/events/new')} className="text-sm text-teal-700 underline">
            Request new event
          </button>
        </div>
        {error && <div className="mb-4 p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-800">{error}</div>}
        <div className="space-y-3">
          {events.length === 0 && (
            <div className="bg-white rounded-lg shadow p-8 text-center text-slate-500">No events yet</div>
          )}
          {events.map((e) => (
            <div key={e.id} className="bg-white rounded-lg shadow p-5">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-lg font-semibold text-slate-900">{e.event_name}</p>
                  <p className="text-sm text-slate-600">{e.theme}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {e.proposed_date} · {e.start_time}–{e.end_time}
                  </p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs border ${statusBadge[e.status]}`}>{e.status}</span>
              </div>

              {/* Expandable details */}
              {expandedId === e.id && (
                <div className="mt-4 pt-4 border-t border-slate-200 space-y-3 text-sm">
                  <p>
                    <span className="font-semibold text-slate-700">Attendees:</span> {e.attendees}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-700">Budget:</span> ₹{e.budget}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-700">Category:</span> {e.category}
                  </p>
                  {e.description && (
                    <p>
                      <span className="font-semibold text-slate-700">Description:</span> {e.description}
                    </p>
                  )}
                  {e.decision_note && (
                    <p className="bg-amber-50 border border-amber-200 p-2 rounded text-amber-800">
                      <span className="font-semibold">Feedback:</span> {e.decision_note}
                    </p>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => setExpandedId(expandedId === e.id ? null : e.id)}
                  className="text-sm text-teal-700 underline"
                >
                  {expandedId === e.id ? 'Hide' : 'Show'} details
                </button>
                {e.status === 'CHANGES_REQUESTED' && (
                  <button
                    disabled={resubmitting === e.id}
                    onClick={() => handleResubmit(e.id)}
                    className="text-sm text-teal-700 underline disabled:opacity-50"
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
