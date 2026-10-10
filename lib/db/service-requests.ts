import { createClient } from '../supabase/server';
import {
  ServiceTicket,
  EventLog,
  CreateTicketInput,
  TransitionTicketInput,
  RateTicketInput,
  ReassignTicketDepartmentInput,
  CreateTicketSchema,
  TransitionTicketSchema,
  RateTicketSchema,
  ReassignTicketDepartmentSchema
} from '../types';

export async function createTicket(input: CreateTicketInput): Promise<ServiceTicket> {
  const validated = CreateTicketSchema.parse(input);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('service_tickets')
    .insert({
      requester_id: user.id,
      title: validated.title,
      description: validated.description,
      category: validated.category,
      priority: validated.priority,
      building_id: validated.building_id,
      room_id: validated.room_id,
      location_note: validated.location_note,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as ServiceTicket;
}

export async function getTicket(id: string): Promise<ServiceTicket | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('service_tickets')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // not found
    throw new Error(error.message);
  }
  return data as ServiceTicket;
}

export async function listMyTickets(): Promise<ServiceTicket[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('service_tickets')
    .select('*')
    .eq('requester_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data as ServiceTicket[];
}

export async function listDepartmentTickets(filters?: Record<string, unknown>): Promise<ServiceTicket[]> {
  const supabase = await createClient();
  let query = supabase.from('service_tickets').select('*');
  
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      query = query.eq(key, value);
    });
  }

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data as ServiceTicket[];
}

export async function assignTicket(ticketId: string, assigneeId: string): Promise<ServiceTicket> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('service_tickets')
    .update({ assigned_to: assigneeId })
    .eq('id', ticketId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as ServiceTicket;
}

export async function transitionTicket(input: TransitionTicketInput): Promise<ServiceTicket> {
  const validated = TransitionTicketSchema.parse(input);
  const supabase = await createClient();
  const { data, error } = await supabase
    .rpc('transition_ticket', {
      p_ticket_id: validated.ticket_id,
      p_to_status: validated.to_status,
      p_note: validated.note || null,
      p_assigned_to: validated.assigned_to || null,
    });

  if (error) throw new Error(error.message);
  return data as ServiceTicket;
}

export async function followTicket(ticketId: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('ticket_followers')
    .insert({ ticket_id: ticketId, user_id: user.id });

  if (error) throw new Error(error.message);
}

export async function rateTicket(input: RateTicketInput): Promise<ServiceTicket> {
  const validated = RateTicketSchema.parse(input);
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('service_tickets')
    .update({ rating: validated.rating, feedback: validated.feedback })
    .eq('id', validated.ticket_id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as ServiceTicket;
}

export async function getTicketEvents(ticketId: string): Promise<EventLog[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('entity_type', 'ticket')
    .eq('entity_id', ticketId)
    .order('created_at', { ascending: true });

  if (error) throw new Error(error.message);
  return data as EventLog[];
}

export async function uploadTicketPhoto(ticketId: string, file: File): Promise<string> {
  const supabase = await createClient();
  const fileExt = file.name.split('.').pop();
  const filePath = `${ticketId}/${crypto.randomUUID()}.${fileExt}`;
  
  const { error: uploadError } = await supabase.storage
    .from('ticket-photos')
    .upload(filePath, file);
    
  if (uploadError) throw new Error(uploadError.message);
  
  const { data, error: updateError } = await supabase
    .from('service_tickets')
    .update({ photo_path: filePath })
    .eq('id', ticketId)
    .select()
    .single();
    
  if (updateError) throw new Error(updateError.message);
  return (data as ServiceTicket).photo_path!;
}

export async function getPhotoUrl(path: string): Promise<string> {
  const supabase = await createClient();
  const { data } = await supabase.storage.from('ticket-photos').createSignedUrl(path, 3600);
  if (!data?.signedUrl) throw new Error('Could not get photo url');
  return data.signedUrl;
}

export async function reassignTicketDepartment(input: ReassignTicketDepartmentInput): Promise<ServiceTicket> {
  const validated = ReassignTicketDepartmentSchema.parse(input);
  const supabase = await createClient();
  const { data, error } = await supabase
    .rpc('reassign_ticket_department', {
      p_ticket_id: validated.ticket_id,
      p_new_department_id: validated.new_department_id,
      p_note: validated.note || null,
    });

  if (error) throw new Error(error.message);
  return data as ServiceTicket;
}
