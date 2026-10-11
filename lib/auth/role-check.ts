/* eslint-disable @typescript-eslint/no-explicit-any -- legacy module: typed rewrite pending */
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '../types/database';

export async function getCurrentProfile() {
  const cookieStore = await cookies();

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {},
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return data as any;
}

export async function requireRole(...allowedRoles: string[]) {
  const profile = await getCurrentProfile();

  if (!profile || !allowedRoles.includes((profile as any)?.role)) {
    throw new Error('Unauthorized');
  }

  return profile;
}
