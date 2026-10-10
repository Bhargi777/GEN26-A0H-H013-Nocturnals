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

export interface Room {
  id: string;
  building_id: string;
  name: string;
  floor: string;
}

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  roll_no: string | null;
  role: Role;
  department_id: string | null;
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
  entity_type: 'ticket' | 'admin_request';
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
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
      buildings: {
        Row: Building;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
      rooms: {
        Row: Room;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
      profiles: {
        Row: Profile;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
      service_tickets: {
        Row: ServiceTicket;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
      ticket_followers: {
        Row: TicketFollower;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
      admin_requests: {
        Row: AdminRequest;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
      events: {
        Row: EventLog;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
      notifications: {
        Row: Notification;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
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
      entity_type_enum: 'ticket' | 'admin_request';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}