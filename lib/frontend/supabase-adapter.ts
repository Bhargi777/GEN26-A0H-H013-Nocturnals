"use client";

import type { AuthResult, FrontendAdapter } from "@/app/(app)/ui/preview-adapter";
import type { Notification, Profile } from "@/app/(app)/ui/preview-contract";
import { getSupabase } from "@/lib/supabase/browser";

// One browser client carries the cookie session, so every query below runs under RLS.
const db = getSupabase;

function friendly(message: string): string {
  if (/invalid login credentials/i.test(message)) return "Email or password is incorrect.";
  if (/email not confirmed/i.test(message)) return "Confirm your email address, then sign in.";
  if (/domain not allowed|database error saving new user/i.test(message)) return "Use your campus email address to register.";
  if (/already registered/i.test(message)) return "An account with this email already exists. Sign in instead.";
  return message;
}

export const supabaseAdapter: FrontendAdapter = {
  async getSession() {
    const { data: { user } } = await db().auth.getUser();
    if (!user) return null;
    const { data, error } = await db().from("profiles").select("id, full_name, email, role, department_id, canteen_id, club_id").eq("id", user.id).maybeSingle();
    if (error) throw new Error(error.message);
    return (data as Profile | null) ?? null;
  },
  async signIn({ email, password }): Promise<AuthResult> {
    const { error } = await db().auth.signInWithPassword({ email, password });
    return error ? { error: friendly(error.message) } : {};
  },
  async signUp({ fullName, email, password }): Promise<AuthResult> {
    const { data, error } = await db().auth.signUp({ email, password, options: { data: { full_name: fullName } } });
    if (error) return { error: friendly(error.message) };
    return data.session ? {} : { message: "Account created. Check your campus email to confirm it, then sign in." };
  },
  async signOut() {
    const { error } = await db().auth.signOut();
    if (error) throw new Error(error.message);
  },
  async getNotifications(profile) {
    const { data, error } = await db().from("notifications").select("id, user_id, title, body, link, read_at, created_at")
      .eq("user_id", profile.id).order("created_at", { ascending: false }).limit(100);
    if (error) throw new Error(error.message);
    return (data ?? []) as Notification[];
  },
  async markNotificationRead(id) {
    const { error } = await db().from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id);
    if (error) throw new Error("Notification could not be updated. Try again.");
  },
  async markAllNotificationsRead() {
    const { error } = await db().from("notifications").update({ read_at: new Date().toISOString() }).is("read_at", null);
    if (error) throw new Error("Notifications could not be updated. Try again.");
  },
  subscribeNotifications(profile, onChange) {
    const channel = db().channel(`notifications-${profile.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${profile.id}` }, onChange)
      .subscribe();
    return () => { void db().removeChannel(channel); };
  },
};
