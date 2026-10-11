"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { FrontendAdapter } from "@/app/(app)/ui/preview-adapter";
import { supabaseAdapter } from "@/lib/frontend/supabase-adapter";
import type { Notification, Profile } from "@/app/(app)/ui/preview-contract";
import { ToastProvider } from "@/components/ui/toast";
import { useLiveSync } from "@/components/layout/live-sync";

interface FrontendState {
  adapter: FrontendAdapter;
  profile: Profile | null;
  ready: boolean;
  error?: string;
  notifications: Notification[];
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
  markRead: (id?: string) => Promise<void>;
}
const FrontendContext = createContext<FrontendState | null>(null);

export function FrontendProvider({ children, adapter = supabaseAdapter }: { children: ReactNode; adapter?: FrontendAdapter }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string>();
  const fetchSession = useCallback(async () => {
    const session = await adapter.getSession();
    const items = session ? await adapter.getNotifications(session) : [];
    return { session, items };
  }, [adapter]);
  const refresh = useCallback(async () => {
    setError(undefined);
    try {
      const { session, items } = await fetchSession();
      setProfile(session); setNotifications(items);
    } catch { setError("Account details could not be loaded. Try again."); }
    finally { setReady(true); }
  }, [fetchSession]);
  useEffect(() => {
    let cancelled = false;
    fetchSession()
      .then(({ session, items }) => { if (!cancelled) { setProfile(session); setNotifications(items); } })
      .catch(() => { if (!cancelled) setError("Account details could not be loaded. Try again."); })
      .finally(() => { if (!cancelled) setReady(true); });
    return () => { cancelled = true; };
  }, [fetchSession]);
  const reloadNotifications = useCallback(() => {
    if (profile) void adapter.getNotifications(profile).then(setNotifications).catch(() => undefined);
  }, [adapter, profile]);
  // Realtime plus resume/poll catch-up for every page; notifications reload on the same signal.
  useLiveSync(profile?.id, reloadNotifications);

  async function signOut() {
    await adapter.signOut();
    setProfile(null); setNotifications([]);
  }
  async function markRead(id?: string) {
    if (id) await adapter.markNotificationRead(id); else await adapter.markAllNotificationsRead();
    if (profile) setNotifications(await adapter.getNotifications(profile));
  }
  return <FrontendContext.Provider value={{ adapter, profile, notifications, ready, error, refresh, signOut, markRead }}><ToastProvider>{children}</ToastProvider></FrontendContext.Provider>;
}

export function useFrontend() {
  const context = useContext(FrontendContext);
  if (!context) throw new Error("useFrontend requires FrontendProvider.");
  return context;
}
