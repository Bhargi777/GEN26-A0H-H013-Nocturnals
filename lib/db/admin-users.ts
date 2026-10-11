// Administrator tools: list people and assign roles. The RPC re-checks that the caller is an administrator.
import { getSupabase } from '../supabase/browser';
import type { Role } from '../constants/roles';

export interface UserRow {
  id: string; full_name: string; email: string; role: Role;
  department_id: string | null; canteen_id: string | null; club_id: string | null;
}
export interface Option { id: string; name: string }

function fail(error: { message: string } | null): asserts error is null {
  if (error) throw new Error(error.message);
}

export async function listUsers(): Promise<UserRow[]> {
  const { data, error } = await getSupabase().from('profiles')
    .select('id, full_name, email, role, department_id, canteen_id, club_id').order('full_name').limit(500);
  fail(error);
  return (data ?? []) as UserRow[];
}

export async function listDepartmentOptions(): Promise<Option[]> {
  const { data, error } = await getSupabase().from('departments').select('id, name').order('name');
  fail(error);
  return data ?? [];
}

export async function listCanteenOptions(): Promise<Option[]> {
  const { data, error } = await getSupabase().from('canteens').select('id, name').order('name');
  fail(error);
  return data ?? [];
}

export async function listClubOptions(): Promise<Option[]> {
  const { data, error } = await getSupabase().from('clubs').select('id, name').order('name');
  fail(error);
  return data ?? [];
}

export async function assignRole(userId: string, role: Role, departmentId: string | null, canteenId: string | null, clubId: string | null): Promise<void> {
  const { error } = await getSupabase().rpc('admin_set_profile', { p_user: userId, p_role: role, p_department: departmentId, p_canteen: canteenId, p_club: clubId });
  fail(error);
}
