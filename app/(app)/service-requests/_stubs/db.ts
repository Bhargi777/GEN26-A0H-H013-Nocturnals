// TEMPORARY STUB for Dev 1's `lib/db/service-requests.ts`, coded against the
// data contract in goals/00-team-rules.md section 5. Swap the imports to the
// real module once it lands on main, then delete this file.
import type {
  DepartmentCode,
  Role,
  TicketCategory,
  TicketPriority,
  TicketStatus,
} from "./constants";
import { createClient } from "./supabase";

export const TICKET_PHOTO_BUCKET = "ticket-photos";

export type Result<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export type Profile = {
  id: string;
  full_name: string;
  email: string;
  role: Role;
  department_id: string | null;
};

export type Building = { id: string; name: string; code: string };
export type Room = {
  id: string;
  building_id: string;
  name: string;
  floor: number | null;
};
export type Department = { id: string; name: string; code: DepartmentCode };
export type Person = { id: string; full_name: string };

export type TicketRow = {
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
  location_note: string | null;
  assigned_department_id: string | null;
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
};

export type TicketListItem = TicketRow & {
  building_name: string;
  room_name: string | null;
  department_name: string | null;
};

export type TicketEvent = {
  id: string;
  actor_name: string | null;
  action: string;
  from_status: TicketStatus | null;
  to_status: TicketStatus | null;
  note: string | null;
  created_at: string;
};

export type TicketDetail = TicketListItem & {
  requester: Person | null;
  assignee: Person | null;
  events: TicketEvent[];
  followers_count: number;
  is_following: boolean;
};

export type SimilarTicket = {
  id: string;
  code: string;
  title: string;
  status: TicketStatus;
  created_at: string;
  similarity: number;
};

export type NewTicket = {
  title: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  buildingId: string;
  roomId: string | null;
  locationNote: string | null;
  photoPath: string | null;
  assignedDepartmentId: string | null;
  aiSuggestedCategory: TicketCategory | null;
  aiSuggestedPriority: TicketPriority | null;
  aiConfidence: number | null;
};

export type TicketFilters = {
  status?: TicketStatus;
  category?: TicketCategory;
  priority?: TicketPriority;
  buildingId?: string;
};

export type TransitionInput = {
  ticketId: string;
  toStatus: TicketStatus;
  note?: string | null;
  assignedTo?: string | null;
  departmentId?: string | null;
  rating?: number | null;
  feedback?: string | null;
};

type JoinedTicket = TicketRow & {
  building: { name: string } | null;
  room: { name: string } | null;
  department: { name: string } | null;
};

const TICKET_LIST_SELECT =
  "*, building:buildings(name), room:rooms(name), department:departments!assigned_department_id(name)";

function flattenTicket(row: JoinedTicket): TicketListItem {
  const { building, room, department, ...ticket } = row;
  return {
    ...ticket,
    building_name: building?.name ?? "",
    room_name: room?.name ?? null,
    department_name: department?.name ?? null,
  };
}

export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, department_id")
    .eq("id", user.id)
    .single();
  return (data as Profile | null) ?? null;
}

export async function listBuildings(): Promise<Building[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("buildings")
    .select("id, name, code")
    .order("name");
  if (error) throw new Error(error.message);
  return data as Building[];
}

export async function getBuilding(id: string): Promise<Building | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("buildings")
    .select("id, name, code")
    .eq("id", id)
    .maybeSingle();
  return (data as Building | null) ?? null;
}

export async function listRooms(): Promise<Room[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("rooms")
    .select("id, building_id, name, floor")
    .order("name");
  if (error) throw new Error(error.message);
  return data as Room[];
}

export async function listDepartments(): Promise<Department[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("departments")
    .select("id, name, code")
    .order("name");
  if (error) throw new Error(error.message);
  return data as Department[];
}

export async function listTechnicians(departmentId: string): Promise<Person[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("role", "technician")
    .eq("department_id", departmentId)
    .order("full_name");
  if (error) throw new Error(error.message);
  return data as Person[];
}

export async function uploadTicketPhoto(
  userId: string,
  file: File,
): Promise<Result<string>> {
  const supabase = await createClient();
  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${userId}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage
    .from(TICKET_PHOTO_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: path };
}

export async function getPhotoUrl(path: string): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase.storage
    .from(TICKET_PHOTO_BUCKET)
    .createSignedUrl(path, 60 * 60);
  return data?.signedUrl ?? null;
}

export async function createTicket(
  requesterId: string,
  input: NewTicket,
): Promise<Result<{ id: string; code: string }>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("service_tickets")
    .insert({
      requester_id: requesterId,
      title: input.title,
      description: input.description,
      category: input.category,
      priority: input.priority,
      building_id: input.buildingId,
      room_id: input.roomId,
      location_note: input.locationNote,
      photo_path: input.photoPath,
      assigned_department_id: input.assignedDepartmentId,
      ai_suggested_category: input.aiSuggestedCategory,
      ai_suggested_priority: input.aiSuggestedPriority,
      ai_confidence: input.aiConfidence,
    })
    .select("id, code")
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as { id: string; code: string } };
}

export async function listMyTickets(
  requesterId: string,
  filters: TicketFilters,
): Promise<TicketListItem[]> {
  const supabase = await createClient();
  let query = supabase
    .from("service_tickets")
    .select(TICKET_LIST_SELECT)
    .eq("requester_id", requesterId);
  if (filters.status) query = query.eq("status", filters.status);
  if (filters.category) query = query.eq("category", filters.category);
  const { data, error } = await query
    .order("updated_at", { ascending: false })
    .limit(200);
  if (error) throw new Error(error.message);
  return (data as JoinedTicket[]).map(flattenTicket);
}

export async function listDepartmentQueue(
  departmentId: string,
  filters: TicketFilters,
): Promise<TicketListItem[]> {
  const supabase = await createClient();
  let query = supabase
    .from("service_tickets")
    .select(TICKET_LIST_SELECT)
    .eq("assigned_department_id", departmentId);
  if (filters.status) query = query.eq("status", filters.status);
  if (filters.category) query = query.eq("category", filters.category);
  if (filters.priority) query = query.eq("priority", filters.priority);
  if (filters.buildingId) query = query.eq("building_id", filters.buildingId);
  const { data, error } = await query
    .order("created_at", { ascending: true })
    .limit(500);
  if (error) throw new Error(error.message);
  return (data as JoinedTicket[]).map(flattenTicket);
}

export async function getTicketByCode(
  code: string,
  viewerId: string,
): Promise<TicketDetail | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("service_tickets")
    .select(
      `${TICKET_LIST_SELECT}, requester:profiles!requester_id(id, full_name), assignee:profiles!assigned_to(id, full_name)`,
    )
    .eq("code", code)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  const row = data as JoinedTicket & {
    requester: Person | null;
    assignee: Person | null;
  };
  const { requester, assignee, ...joined } = row;

  const [eventsResult, followersResult, followingResult] = await Promise.all([
    supabase
      .from("events")
      .select(
        "id, action, from_status, to_status, note, created_at, actor:profiles!actor_id(full_name)",
      )
      .eq("entity_type", "ticket")
      .eq("entity_id", row.id)
      .order("created_at", { ascending: true }),
    supabase
      .from("ticket_followers")
      .select("user_id", { count: "exact", head: true })
      .eq("ticket_id", row.id),
    supabase
      .from("ticket_followers")
      .select("user_id")
      .eq("ticket_id", row.id)
      .eq("user_id", viewerId)
      .maybeSingle(),
  ]);
  if (eventsResult.error) throw new Error(eventsResult.error.message);

  // Without generated DB types the select parser types embeds as arrays; this one is to-one.
  const events = (
    eventsResult.data as unknown as (Omit<TicketEvent, "actor_name"> & {
      actor: { full_name: string } | null;
    })[]
  ).map(({ actor, ...event }) => ({
    ...event,
    actor_name: actor?.full_name ?? null,
  }));

  return {
    ...flattenTicket(joined),
    requester,
    assignee,
    events,
    followers_count: followersResult.count ?? 0,
    is_following: Boolean(followingResult.data),
  };
}

/** The only way a ticket changes status. Wraps Dev 1's `transition_ticket` SQL function. */
export async function transitionTicket(input: TransitionInput): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("transition_ticket", {
    p_ticket_id: input.ticketId,
    p_to_status: input.toStatus,
    p_note: input.note ?? null,
    p_assigned_to: input.assignedTo ?? null,
    p_department_id: input.departmentId ?? null,
    p_rating: input.rating ?? null,
    p_feedback: input.feedback ?? null,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: undefined };
}

export async function findSimilarTickets(
  buildingId: string,
  text: string,
): Promise<SimilarTicket[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("find_similar_tickets", {
    p_building_id: buildingId,
    p_text: text,
  });
  if (error) throw new Error(error.message);
  return data as SimilarTicket[];
}

export async function followTicket(
  ticketId: string,
  userId: string,
): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("ticket_followers")
    .insert({ ticket_id: ticketId, user_id: userId });
  // 23505 = unique violation: the user already follows this ticket.
  if (error && error.code !== "23505") return { ok: false, error: error.message };
  return { ok: true, data: undefined };
}
