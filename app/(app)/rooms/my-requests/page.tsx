'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { RoomBooking, Room, Period } from '@/lib/types/database';
import { getMyRoomBookings } from '@/lib/db/rooms';

const supabase = createClient<any>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
) as any;

export default function MyRoomRequestsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<any[]>([]);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const loadBookings = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/sign-in');
          return;
        }

        const bookingData = await getMyRoomBookings(user.id);

        // Fetch room and period details for each booking
        const enrichedBookings = await Promise.all(
          bookingData.map(async (booking) => {
            const { data: room } = await supabase
              .from('rooms')
              .select('*')
              .eq('id', booking.room_id)
              .single();

            const { data: period } = await supabase
              .from('periods')
              .select('*')
              .eq('id', booking.period_id)
              .single();

            return { ...booking, room, period };
          })
        );

        setBookings(enrichedBookings);
        setLoading(false);
      } catch (err: any) {
        setError(err.message);
        setLoading(false);
      }
    };

    loadBookings();
  }, [router]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-50 text-green-700 border border-green-200';
      case 'REJECTED':
        return 'bg-red-50 text-red-700 border border-red-200';
      case 'PENDING':
        return 'bg-yellow-50 text-yellow-700 border border-yellow-200';
      default:
        return 'bg-slate-50 text-slate-700 border border-slate-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-slate-200 rounded"></div>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-slate-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900">My Booking Requests</h1>
          <button
            onClick={() => router.push('/rooms')}
            className="bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2 px-4 rounded-lg transition"
          >
            New Request
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {bookings.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-slate-500 text-lg">No booking requests yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div key={booking.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">
                      {booking.room?.name} ({booking.room?.code})
                    </h3>
                    <p className="text-sm text-slate-500">
                      {new Date(booking.date).toLocaleDateString()} • {booking.period?.label} ({booking.period?.start_time} - {booking.period?.end_time})
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}>
                    {booking.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                  <div>
                    <p className="text-slate-600">Faculty</p>
                    <p className="font-medium text-slate-900">{booking.faculty_name}</p>
                  </div>
                  <div>
                    <p className="text-slate-600">Attendees</p>
                    <p className="font-medium text-slate-900">{booking.attendees}</p>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-slate-600 text-sm mb-1">Reason</p>
                  <p className="text-slate-800">{booking.reason}</p>
                </div>

                {booking.decision_note && (
                  <div className="p-3 bg-slate-50 rounded text-sm">
                    <p className="text-slate-600 font-medium mb-1">Decision Note</p>
                    <p className="text-slate-800">{booking.decision_note}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
