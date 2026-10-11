'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { Block, Floor, Room, Period } from '@/lib/types/database';
import { getBlocksByDepartment, getFloorsByBlock, getRoomsByFloor, getPeriods, checkRoomAvailability } from '@/lib/db/rooms';
import { nowIST, isValidBookingDate } from '@/lib/time';

const supabase = createClient<any>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
) as any;

export default function RoomBookingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [selectedBlock, setSelectedBlock] = useState<string>('');
  const [floors, setFloors] = useState<Floor[]>([]);
  const [selectedFloor, setSelectedFloor] = useState<string>('');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<string>('');
  const [periods, setPeriods] = useState<Period[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');
  const [bookingDate, setBookingDate] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [facultyName, setFacultyName] = useState<string>('');
  const [attendees, setAttendees] = useState<number>(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>('');
  const [profile, setProfile] = useState<any>(null);

  // Load user profile and departments
  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/sign-in');
          return;
        }

        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (!profileData) throw new Error('Profile not found');
        setProfile(profileData);

        // Load blocks for this user's department (CR role)
        if (profileData.department_id) {
          const blockData = await getBlocksByDepartment(profileData.department_id);
          setBlocks(blockData);
        }

        const periodData = await getPeriods();
        setPeriods(periodData);

        setLoading(false);
      } catch (err: any) {
        setError(err.message);
        setLoading(false);
      }
    };

    loadData();
  }, [router]);

  // Load floors when block is selected
  useEffect(() => {
    if (selectedBlock) {
      const loadFloors = async () => {
        try {
          const floorData = await getFloorsByBlock(selectedBlock);
          setFloors(floorData);
          setSelectedFloor('');
          setRooms([]);
        } catch (err: any) {
          setError(err.message);
        }
      };
      loadFloors();
    }
  }, [selectedBlock]);

  // Load rooms when floor is selected
  useEffect(() => {
    if (selectedFloor) {
      const loadRooms = async () => {
        try {
          const roomData = await getRoomsByFloor(selectedFloor);
          setRooms(roomData.filter((r) => r.bookable));
          setSelectedRoom('');
        } catch (err: any) {
          setError(err.message);
        }
      };
      loadRooms();
    }
  }, [selectedFloor]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      if (!selectedRoom || !bookingDate || !selectedPeriod) {
        throw new Error('Please fill in all required fields');
      }

      const bookDate = new Date(bookingDate);
      if (!isValidBookingDate(bookDate)) {
        throw new Error('Booking date must be within 14 days from today');
      }

      // Check availability
      const available = await checkRoomAvailability(selectedRoom, bookingDate, selectedPeriod);
      if (!available) {
        throw new Error('Room is not available for this date and period');
      }

      const { createRoomBooking } = await import('@/lib/db/rooms');
      const booking = await createRoomBooking(
        selectedRoom,
        bookingDate,
        selectedPeriod,
        profile.id,
        reason,
        facultyName,
        attendees
      );

      router.push(`/rooms/my-requests`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <div className="max-w-2xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-slate-200 rounded"></div>
            <div className="h-64 bg-slate-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 mb-8">Request Room Booking</h1>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
          {/* Block Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Block *
            </label>
            <select
              value={selectedBlock}
              onChange={(e) => setSelectedBlock(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
            >
              <option value="">Select a block</option>
              {blocks.map((block) => (
                <option key={block.id} value={block.id}>
                  {block.name} ({block.code})
                </option>
              ))}
            </select>
          </div>

          {/* Floor Selection */}
          {selectedBlock && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Floor *
              </label>
              <select
                value={selectedFloor}
                onChange={(e) => setSelectedFloor(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
              >
                <option value="">Select a floor</option>
                {floors.map((floor) => (
                  <option key={floor.id} value={floor.id}>
                    {floor.label} (Level {floor.level})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Room Selection */}
          {selectedFloor && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Room *
              </label>
              <select
                value={selectedRoom}
                onChange={(e) => setSelectedRoom(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
              >
                <option value="">Select a room</option>
                {rooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.name} ({room.code}) - Capacity: {room.capacity}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Date Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Booking Date *
            </label>
            <input
              type="date"
              value={bookingDate}
              onChange={(e) => setBookingDate(e.target.value)}
              required
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
            />
          </div>

          {/* Period Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Time Period *
            </label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
            >
              <option value="">Select a period</option>
              {periods.map((period) => (
                <option key={period.id} value={period.id}>
                  {period.label} ({period.start_time} - {period.end_time})
                </option>
              ))}
            </select>
          </div>

          {/* Faculty Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Faculty Name *
            </label>
            <input
              type="text"
              value={facultyName}
              onChange={(e) => setFacultyName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
              placeholder="e.g., Dr. John Smith"
            />
          </div>

          {/* Attendees */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Expected Attendees *
            </label>
            <input
              type="number"
              value={attendees}
              onChange={(e) => setAttendees(parseInt(e.target.value))}
              min="1"
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
            />
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Reason for Booking *
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              rows={4}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
              placeholder="e.g., Workshop, guest lecture, department meeting"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-teal-600 hover:bg-teal-700 disabled:bg-slate-400 text-white font-semibold py-2 rounded-lg transition"
          >
            {submitting ? 'Submitting...' : 'Submit Booking Request'}
          </button>
        </form>
      </div>
    </div>
  );
}
