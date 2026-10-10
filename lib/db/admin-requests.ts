import { createClient } from '../supabase/server';
import {
  AdminRequest,
  EventLog,
  CreateAdminRequestInput,
  DecideAdminRequestInput,
  CreateAdminRequestSchema,
  DecideAdminRequestSchema
} from '../types';
import { Role } from '../constants';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../types/database';

function getSupabase(): Promise<SupabaseClient<Database>> {
  return createClient();
}

export async function createAdminRequest(input: CreateAdminRequestInput): Promise<AdminRequest> {
  const validated = CreateAdminRequestSchema.parse(input);
  const supabase = await getSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('admin_requests')
    .insert({
      requester_id: user.id,
      type: validated.type,
      purpose: validated.purpose,
      details: validated.details,
      status: validated.type === 'BONAFIDE' ? 'PENDING_OFFICE' : 'PENDING_DEPT',
      current_reviewer_role: validated.type === 'BONAFIDE' ? 'office_staff' : 'dept_admin',
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as AdminRequest;
}

export async function getAdminRequest(id: string): Promise<AdminRequest | null> {
  const supabase = await getSupabase();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('admin_requests')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(error.message);
  }
  return data as AdminRequest;
}

export async function listMyAdminRequests(): Promise<AdminRequest[]> {
  const supabase = await getSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('admin_requests')
    .select('*')
    .eq('requester_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data as AdminRequest[];
}

export async function listReviewQueue(role: Role): Promise<AdminRequest[]> {
  const supabase = await getSupabase();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('admin_requests')
    .select('*')
    .eq('current_reviewer_role', role)
    .in('status', ['PENDING_DEPT', 'PENDING_OFFICE'])
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data as AdminRequest[];
}

export async function decideAdminRequest(input: DecideAdminRequestInput): Promise<AdminRequest> {
  const validated = DecideAdminRequestSchema.parse(input);
  const supabase = await getSupabase();
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .rpc('decide_admin_request', {
      p_request_id: validated.request_id,
      p_decision: validated.decision,
      p_note: validated.note || null,
    });

  if (error) throw new Error(error.message);
  return data as AdminRequest;
}

export async function attachDocument(requestId: string, file: File): Promise<string> {
  const supabase = await getSupabase();
  const fileExt = file.name.split('.').pop();
  const filePath = `${requestId}/${crypto.randomUUID()}.${fileExt}`;
  
  const { error: uploadError } = await supabase.storage
    .from('admin-documents')
    .upload(filePath, file);
    
  if (uploadError) throw new Error(uploadError.message);
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error: updateError } = await (supabase as any)
    .from('admin_requests')
    .update({ document_path: filePath })
    .eq('id', requestId)
    .select()
    .single();
    
  if (updateError) throw new Error(updateError.message);
  return (data as AdminRequest).document_path!;
}

export async function getDocumentUrl(path: string): Promise<string> {
  const supabase = await getSupabase();
  const { data } = await supabase.storage.from('admin-documents').createSignedUrl(path, 3600);
  if (!data?.signedUrl) throw new Error('Could not get document url');
  return data.signedUrl;
}

export async function getAdminRequestEvents(requestId: string): Promise<EventLog[]> {
  const supabase = await getSupabase();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('events')
    .select('*')
    .eq('entity_type', 'admin_request')
    .eq('entity_id', requestId)
    .order('created_at', { ascending: true });

  if (error) throw new Error(error.message);
  return data as EventLog[];
}