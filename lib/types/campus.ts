// Row shapes returned by the rooms, events, canteen and dashboard queries.
// The database client is untyped, so these describe what each select() asks for.

export type RoomBookingStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
export type SlotState = "CLASS" | "BOOKED" | "PENDING" | "FREE";
export type OrderStatusValue = "PLACED" | "PAID" | "READY" | "COLLECTED" | "FORFEITED" | "LATE_WALKIN";
export type EventStatusValue = "SUBMITTED" | "CHANGES_REQUESTED" | "PENDING_DIRECTOR" | "APPROVED" | "REJECTED" | "CALENDARED";

export interface BlockRow { id: string; code: string; name: string; owner_department_id: string }
export interface FloorRow { id: string; block_id: string; level: number; label: string }
export interface RoomRow { id: string; floor_id: string; code: string; name: string; kind: string; capacity: number | null; bookable: boolean }
export interface PeriodRow { id: string; label: string; start_time: string; end_time: string }
export interface SlotStatusRow { period_id: string; state: SlotState }

export interface RoomBookingRow {
  id: string; code: string; room_id: string; date: string; period_id: string; requested_by: string;
  reason: string; faculty_name: string; attendees: number; status: RoomBookingStatus;
  decision_note: string | null; created_at: string;
  room?: { name: string; code: string; capacity: number | null } | null;
  period?: { label: string; start_time: string; end_time: string } | null;
  requester?: { full_name: string } | null;
}

export interface CanteenRow { id: string; code: string; name: string; location: string }
export interface MenuItemRow { id: string; canteen_id: string; name: string; price: number; category: string; veg: boolean; available: boolean }
export interface CanteenSlotRow { id: string; canteen_id: string; slot_date: string; start_time: string; end_time: string; capacity: number }
export interface OrderRow {
  id: string; code: string; token: string; canteen_id: string; user_id: string; slot_id: string;
  status: OrderStatusValue; total: number; created_at: string;
  slot?: { slot_date: string; start_time: string; end_time: string } | null;
  order_items?: { quantity: number; unit_price: number; item: { name: string } | null }[];
}

export interface DashboardTicket { id: string; code: string; title: string; status: string; created_at: string; requester_id: string; assigned_department_id: string | null }
export interface DashboardBooking { id: string; code: string; status: RoomBookingStatus; created_at: string; date: string; room: { name: string } | null }
export interface DashboardEvent { id: string; code: string; title: string; status: EventStatusValue; created_at: string }
export interface DashboardOrder { id: string; code: string; token: string; status: OrderStatusValue; total: number; created_at: string }
export interface DashboardData {
  tickets: DashboardTicket[];
  bookings: DashboardBooking[];
  events: DashboardEvent[];
  orders: DashboardOrder[];
  unavailableItems: number;
}
