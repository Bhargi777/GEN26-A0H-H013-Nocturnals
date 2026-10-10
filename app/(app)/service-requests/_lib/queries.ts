// Reads this module needs that lib/db does not offer yet. Writes go through
// lib/db, except saveTriageAndRouting (see BLOCKERS in goals/03).
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import type { TicketCategory, TicketPriority, TicketStatus } from "@/lib/constants";
import type { Building, Department, Room } from "@/lib/types";

export type Person = { id: string; full_name: string };

export type SimilarTicket = {
  id: string;
  code: string;
  title: string;
  status: TicketStatus;
  created_at: string;
  similarity: number;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Functions and columns not described in lib/types/database.ts. */
async function untypedClient(): Promise<SupabaseClient> {
  return (await createClient()) as unknown as SupabaseClient;
}

export async function listBuildings(): Promise<Building[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("buildings").select("id, name, code").order("name");
  if (error) throw new Error(error.message);
  return data as Building[];
}

export async function getBuilding(id: string): Promise<Building | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("buildings").select("id, name, code").eq("id", id).maybeSingle();
  return (data as Building | null) ?? null;
}

export async function listRooms(): Promise<Room[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("rooms").select("id, building_id, name, floor").order("name");
  if (error) throw new Error(error.message);
  return data as Room[];
}

export async function listDepartments(): Promise<Department[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("departments").select("id, name, code").order("name");
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

export async function getPeople(ids: string[]): Promise<Map<string, string>> {
  const unique = [...new Set(ids.filter(Boolean))];
  if (unique.length === 0) return new Map();
  const supabase = await createClient();
  const { data, error } = await supabase.from("profiles").select("id, full_name").in("id", unique);
  if (error) throw new Error(error.message);
  return new Map((data as Person[]).map((person) => [person.id, person.full_name]));
}

/** Detail links use the ticket code; notifications from the database use its id. */
export async function resolveTicketId(codeOrId: string): Promise<string | null> {
  if (UUID.test(codeOrId)) return codeOrId;
  const supabase = await createClient();
  const { data } = await supabase.from("service_tickets").select("id").eq("code", codeOrId).maybeSingle();
  return (data as { id: string } | null)?.id ?? null;
}

export async function getFollowers(
  ticketId: string,
  viewerId: string,
): Promise<{ count: number; following: boolean }> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("ticket_followers").select("user_id").eq("ticket_id", ticketId);
  if (error) throw new Error(error.message);
  const rows = data as { user_id: string }[];
  return { count: rows.length, following: rows.some((row) => row.user_id === viewerId) };
}

export async function findSimilarTickets(buildingId: string, text: string): Promise<SimilarTicket[]> {
  const supabase = await untypedClient();
  const { data, error } = await supabase.rpc("find_similar_tickets", {
    p_building_id: buildingId,
    p_text: text,
  });
  if (error) throw new Error(error.message);
  return data as SimilarTicket[];
}

/**
 * TODO(dev1): createTicket in lib/db does not accept these columns yet. Until
 * it does, the requester fills them in right after creating the ticket, which
 * RLS allows for their own ticket's non-status columns.
 */
export async function saveTriageAndRouting(
  ticketId: string,
  values: {
    departmentId: string | null;
    aiSuggestedCategory: TicketCategory | null;
    aiSuggestedPriority: TicketPriority | null;
    aiConfidence: number | null;
  },
): Promise<void> {
  const supabase = await untypedClient();
  const { error } = await supabase
    .from("service_tickets")
    .update({
      assigned_department_id: values.departmentId,
      ai_suggested_category: values.aiSuggestedCategory,
      ai_suggested_priority: values.aiSuggestedPriority,
      ai_confidence: values.aiConfidence,
    })
    .eq("id", ticketId);
  if (error) throw new Error(error.message);
}
