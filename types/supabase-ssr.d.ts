declare module '@supabase/ssr' {
  import { SupabaseClient } from '@supabase/supabase-js';
  
  export interface CookieOptions {
    name: string;
    value: string;
    options?: {
      path?: string;
      maxAge?: number;
      domain?: string;
      secure?: boolean;
      httpOnly?: boolean;
      sameSite?: 'lax' | 'strict' | 'none';
    };
  }
  
  export interface CookieMethods {
    getAll(): Array<{ name: string; value: string }>;
    setAll(cookies: CookieOptions[]): void;
  }
  
  export function createServerClient<Database = Record<string, unknown>>(
    supabaseUrl: string,
    supabaseKey: string,
    options: {
      cookies: CookieMethods;
    }
  ): SupabaseClient<Database>;
  
  export function createBrowserClient<Database = Record<string, unknown>>(
    supabaseUrl: string,
    supabaseKey: string,
    options?: {
      cookies?: CookieMethods;
    }
  ): SupabaseClient<Database>;
}