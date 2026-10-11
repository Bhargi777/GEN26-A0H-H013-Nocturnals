// Certificate requests (bonafide, NOC). Creation and decisions are RPCs; reads are RLS-filtered selects.
import { getSupabase } from '../supabase/browser';
import type { CertificateEvent, CertificateRow, CertificateType } from '../types/campus';

function fail(error: { message: string } | null): asserts error is null {
  if (error) throw new Error(error.message);
}

const COLUMNS = 'id, code, type, purpose, status, decision_note, created_at, decided_at, requester_id, requester:requester_id(full_name, roll_no, department:department_id(name))';

export async function createCertificateRequest(type: CertificateType, purpose: string): Promise<CertificateRow> {
  const { data, error } = await getSupabase().rpc('create_admin_request', { p_type: type, p_purpose: purpose, p_details: {} });
  fail(error);
  return data as CertificateRow;
}

export async function listCertificates(filter?: { requesterId?: string }): Promise<CertificateRow[]> {
  let query = getSupabase().from('admin_requests').select(COLUMNS).order('created_at', { ascending: false }).limit(200);
  if (filter?.requesterId) query = query.eq('requester_id', filter.requesterId);
  const { data, error } = await query;
  fail(error);
  return (data ?? []) as unknown as CertificateRow[];
}

export async function getCertificate(id: string): Promise<CertificateRow | null> {
  const { data, error } = await getSupabase().from('admin_requests').select(COLUMNS).eq('id', id).maybeSingle();
  fail(error);
  return data as unknown as CertificateRow | null;
}

export async function getCertificateTimeline(id: string): Promise<CertificateEvent[]> {
  const { data, error } = await getSupabase().from('events')
    .select('id, action, from_status, to_status, note, created_at, actor:actor_id(full_name)')
    .eq('entity_type', 'admin_request').eq('entity_id', id).order('created_at');
  fail(error);
  return (data ?? []) as unknown as CertificateEvent[];
}

export async function decideCertificate(id: string, decision: 'FORWARD' | 'APPROVE' | 'REJECT', note: string): Promise<void> {
  const { error } = await getSupabase().rpc('decide_admin_request', { p_request_id: id, p_decision: decision, p_note: note });
  fail(error);
}

export const CERTIFICATE_LABEL: Record<CertificateType, string> = { BONAFIDE: 'Bonafide certificate', NOC: 'No objection certificate' };
