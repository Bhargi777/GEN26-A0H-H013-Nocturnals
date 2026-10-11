import { Role, TicketStatus, TicketCategory, TicketPriority, AdminRequestStatus, AdminRequestType } from '../constants';

export interface Department {
  id: string;
  name: string;
  code: string;
}

export interface Building {
  id: string;
  name: string;
  code: string;
}

export interface Block {
  id: string;
  code: string;
  name: string;
  owner_department_id: string;
  created_at: string;
}

export interface Floor {
  id: string;
  block_id: string;
  level: number;
  label: string;
  grid_cols: number;
  grid_rows: number;
  created_at: string;
}

export interface Period {
  id: string;
  label: string;
  start_time: string;
  end_time: string;
  created_at: string;
}

export interface Room {
  id: string;
  floor_id?: string;
  building_id?: string;
  name: string;
  floor?: string;
  code?: string;
  kind?: 'classroom' | 'lab' | 'hall' | 'corridor' | 'stairs' | 'washroom' | 'lift';
  capacity?: number;
  equipment?: string[];
  grid_x?: number;
  grid_y?: number;
  grid_w?: number;
  grid_h?: number;
  bookable?: boolean;
  created_at?: string;
}

export interface TimetableEntry {
  id: string;
  room_id: string;
  weekday: number;
  period_id: string;
  course: string;
  section: string;
  faculty_name: string;
  created_at: string;
}

export interface ClassCancellation {
  id: string;
  timetable_entry_id: string;
  date: string;
  cancelled_by: string;
  reason?: string;
  created_at: string;
}

export interface RoomBooking {
  id: string;
  code: string;
  room_id: string;
  date: string;
  period_id: string;
  requested_by: string;
  reason: string;
  faculty_name: string;
  attendees: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  decided_by?: string;
  decision_note?: string;
  created_at: string;
  updated_at: string;
}

export interface Club {
  id: string;
  code: string;
  name: string;
  created_at: string;
}

export type EventRequestStatus = 'SUBMITTED' | 'CHANGES_REQUESTED' | 'PENDING_DIRECTOR' | 'APPROVED' | 'REJECTED' | 'CALENDARED';

export interface EventRequest {
  id: string;
  token?: string;
  club_id: string;
  requested_by: string;
  event_name: string;
  theme: string;
  description?: string;
  proposed_date: string;
  start_time: string;
  end_time: string;
  hall_id?: string | null;
  attendees?: number;
  budget?: number;
  category?: string;
  poster_url?: string | null;
  status: EventRequestStatus;
  decision_note?: string;
  created_at: string;
  updated_at?: string;
}

export interface Canteen {
  id: string;
  code: string;
  name: string;
  location: string;
  created_at: string;
}

export interface MenuItem {
  id: string;
  canteen_id: string;
  name: string;
  price: number;
  category: string;
  veg: boolean;
  available: boolean;
  prep_minutes?: number;
  created_at: string;
}

export interface CanteenSlot {
  id: string;
  canteen_id: string;
  slot_date: string;
  start_time: string;
  end_time: string;
  capacity: number;
  created_at: string;
}

export type OrderStatus = 'PLACED' | 'PAID' | 'COLLECTED' | 'FORFEITED' | 'LATE_WALKIN';

export interface Order {
  id: string;
  code: string;
  token: string;
  canteen_id: string;
  user_id: string;
  slot_id: string;
  status: OrderStatus;
  total: number;
  created_at: string;
  updated_at: string;
  paid_at?: string;
  collected_at?: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  item_id: string;
  quantity: number;
  unit_price: number;
}

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  roll_no: string | null;
  role: Role;
  department_id: string | null;
  section?: string;
  club_id?: string;
  created_at: string;
}

export interface ServiceTicket {
  id: string;
  code: string;
  requester_id: string;
  title: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  building_id: string;
  room_id: string | null;
  location_note: string;
  assigned_department_id: string;
  assigned_to: string | null;
  ai_suggested_category: TicketCategory | null;
  ai_suggested_priority: TicketPriority | null;
  ai_confidence: number | null;
  duplicate_of: string | null;
  photo_path: string | null;
  rating: number | null;
  feedback: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  closed_at: string | null;
}

export interface TicketFollower {
  ticket_id: string;
  user_id: string;
  created_at: string;
}

export interface AdminRequest {
  id: string;
  code: string;
  requester_id: string;
  type: AdminRequestType;
  purpose: string;
  details: Record<string, unknown>;
  status: AdminRequestStatus;
  current_reviewer_role: Role;
  decided_by: string | null;
  decision_note: string | null;
  document_path: string | null;
  created_at: string;
  updated_at: string;
  decided_at: string | null;
}

export interface EventLog {
  id: string;
  entity_type: 'ticket' | 'admin_request' | 'room_booking' | 'event_request' | 'canteen_order';
  entity_id: string;
  actor_id: string;
  action: string;
  from_status: string | null;
  to_status: string | null;
  note: string | null;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  link: string;
  read_at: string | null;
  created_at: string;
}

// Database schema for Supabase client typing
export interface Database {
  __InternalSupabase: {
    PostgrestVersion: '12';
  };
  public: {
    Tables: {
      departments: {
        Row: Department;
        Insert: any;
        Update: any;
      };
      buildings: {
        Row: Building;
        Insert: any;
        Update: any;
      };
      rooms: {
        Row: Room;
        Insert: any;
        Update: any;
      };
      profiles: {
        Row: Profile;
        Insert: any;
        Update: any;
      };
      service_tickets: {
        Row: ServiceTicket;
        Insert: any;
        Update: any;
      };
      ticket_followers: {
        Row: TicketFollower;
        Insert: any;
        Update: any;
      };
      admin_requests: {
        Row: AdminRequest;
        Insert: any;
        Update: any;
      };
      events: {
        Row: EventLog;
        Insert: any;
        Update: any;
      };
      notifications: {
        Row: Notification;
        Insert: any;
        Update: any;
      };
      blocks: {
        Row: Block;
        Insert: any;
        Update: any;
      };
      floors: {
        Row: Floor;
        Insert: any;
        Update: any;
      };
      periods: {
        Row: Period;
        Insert: any;
        Update: any;
      };
      timetable_entries: {
        Row: TimetableEntry;
        Insert: any;
        Update: any;
      };
      class_cancellations: {
        Row: ClassCancellation;
        Insert: any;
        Update: any;
      };
      room_bookings: {
        Row: RoomBooking;
        Insert: any;
        Update: any;
      };
      clubs: {
        Row: Club;
        Insert: any;
        Update: any;
      };
      event_requests: {
        Row: EventRequest;
        Insert: any;
        Update: any;
      };
      canteens: {
        Row: Canteen;
        Insert: any;
        Update: any;
      };
      menu_items: {
        Row: MenuItem;
        Insert: any;
        Update: any;
      };
      canteen_slots: {
        Row: CanteenSlot;
        Insert: any;
        Update: any;
      };
      orders: {
        Row: Order;
        Insert: any;
        Update: any;
      };
      order_items: {
        Row: OrderItem;
        Insert: any;
        Update: any;
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      transition_ticket: {
        Args: { p_ticket_id: string; p_to_status: string; p_note: string | null; p_assigned_to: string | null };
        Returns: ServiceTicket;
      };
      decide_admin_request: {
        Args: { p_request_id: string; p_decision: string; p_note: string | null };
        Returns: AdminRequest;
      };
      reassign_ticket_department: {
        Args: { p_ticket_id: string; p_new_department_id: string; p_note: string | null };
        Returns: ServiceTicket;
      };
      handle_new_user: {
        Args: Record<string, never>;
        Returns: unknown;
      };
      handle_updated_at: {
        Args: Record<string, never>;
        Returns: unknown;
      };
      block_direct_status_update: {
        Args: Record<string, never>;
        Returns: unknown;
      };
    };
    Enums: {
      user_role: Role;
      ticket_status: TicketStatus;
      ticket_category: TicketCategory;
      ticket_priority: TicketPriority;
      admin_request_type: AdminRequestType;
      admin_request_status: AdminRequestStatus;
      entity_type_enum: 'ticket' | 'admin_request' | 'room_booking' | 'event_request' | 'canteen_order';
      event_request_status: EventRequestStatus;
      order_status: OrderStatus;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}