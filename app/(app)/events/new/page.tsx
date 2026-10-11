'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { createEventRequest, getClubsForUser } from '@/lib/db/events';
import { nowIST, isValidCanteenSlot } from '@/lib/time';
import { format, addDays, isBefore, differenceInHours } from 'date-fns';

const supabase = createClient<any>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
) as any;

export default function NewEventPage() {
  const router = useRouter();
  const [clubs, setClubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [token, setToken] = useState('');

  const [formData, setFormData] = useState({
    club_id: '',
    event_name: '',
    theme: '',
    description: '',
    proposed_date: '',
    start_time: '',
    end_time: '',
    hall_id: '',
    attendees: '',
    budget: '',
    category: 'cultural',
    poster_url: '',
  });

  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return router.push('/sign-in');

        // Check if user is club president
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (profile?.role !== 'club_president') {
          return router.push('/dashboard');
        }

        const userClubs = await getClubsForUser(user.id);
        setClubs(userClubs);
      } catch (e: any) {
        setError(e.message);
      }
    })();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate date: ≥7 days from now
      const proposedDate = new Date(formData.proposed_date);
      const sevenDaysFromNow = addDays(nowIST(), 7);
      if (isBefore(proposedDate, sevenDaysFromNow)) {
        setError('Event must be at least 7 days from now');
        setLoading(false);
        return;
      }

      // Validate time: 07:00–23:00 IST
      const [startHour, startMin] = formData.start_time.split(':').map(Number);
      const [endHour, endMin] = formData.end_time.split(':').map(Number);
      if (startHour < 7 || endHour > 23) {
        setError('Event time must be between 07:00 and 23:00 IST');
        setLoading(false);
        return;
      }

      // Validate duration: ≤8 hours
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;
      const durationHours = (endMinutes - startMinutes) / 60;
      if (durationHours > 8 || durationHours <= 0) {
        setError('Event duration must be between 0 and 8 hours');
        setLoading(false);
        return;
      }

      // Create event request
      const eventRequest = await createEventRequest({
        club_id: formData.club_id,
        event_name: formData.event_name,
        theme: formData.theme,
        description: formData.description,
        proposed_date: formData.proposed_date,
        start_time: formData.start_time,
        end_time: formData.end_time,
        hall_id: formData.hall_id || null,
        attendees: parseInt(formData.attendees) || 0,
        budget: parseFloat(formData.budget) || 0,
        category: formData.category,
        poster_url: formData.poster_url || null,
      });

      setToken(eventRequest.token || '');
      setSubmitted(true);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-lg shadow p-8 text-center space-y-4">
            <p className="text-sm text-emerald-600 font-semibold">Request submitted</p>
            <p className="text-4xl font-bold text-teal-700">{token}</p>
            <p className="text-slate-600 text-sm">Your event reference number</p>
            <div className="pt-4 space-y-2">
              <button
                onClick={() => router.push('/events/mine')}
                className="w-full py-2 bg-teal-700 text-white rounded-lg"
              >
                View my events
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                className="w-full py-2 bg-slate-200 text-slate-700 rounded-lg"
              >
                Back to dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 mb-6">Request event approval</h1>
        {error && <div className="mb-4 p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-800">{error}</div>}

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-8 space-y-6">
          {/* Club selection */}
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">Your club</label>
            <select
              required
              value={formData.club_id}
              onChange={(e) => setFormData({ ...formData, club_id: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            >
              <option value="">Select club</option>
              {clubs.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Event details */}
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">Event name</label>
            <input
              type="text"
              required
              value={formData.event_name}
              onChange={(e) => setFormData({ ...formData, event_name: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              placeholder="e.g., Annual Fest 2026"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">Theme</label>
            <input
              type="text"
              required
              value={formData.theme}
              onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              placeholder="e.g., Celebration of creativity"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg h-24"
              placeholder="Event details and activities planned"
            />
          </div>

          {/* Date and time */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">Date (≥7 days)</label>
              <input
                type="date"
                required
                value={formData.proposed_date}
                onChange={(e) => setFormData({ ...formData, proposed_date: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                min={format(addDays(nowIST(), 7), 'yyyy-MM-dd')}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">Start time</label>
              <input
                type="time"
                required
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">End time</label>
              <input
                type="time"
                required
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          {/* Hall and attendees */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">Expected attendees</label>
              <input
                type="number"
                value={formData.attendees}
                onChange={(e) => setFormData({ ...formData, attendees: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                placeholder="e.g., 200"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">Budget estimate (₹)</label>
              <input
                type="number"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                placeholder="e.g., 50000"
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            >
              <option value="cultural">Cultural</option>
              <option value="technical">Technical</option>
              <option value="sports">Sports</option>
              <option value="academic">Academic</option>
              <option value="social">Social</option>
              <option value="other">Other</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-teal-700 text-white rounded-lg font-semibold disabled:opacity-50"
          >
            {loading ? 'Submitting...' : 'Submit event request'}
          </button>
        </form>
      </div>
    </div>
  );
}
