"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { previewAdapter, type FrontendAdapter } from "@/app/(app)/ui/preview-adapter";
import type { Notification, Profile } from "@/app/(app)/ui/preview-contract";
import { ToastProvider } from "@/components/ui/toast";

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

export function FrontendProvider({ children, adapter = previewAdapter }: { children: ReactNode; adapter?: FrontendAdapter }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string>();
  const refresh = useCallback(async () => {
    setError(undefined);
    try {
      const session = await adapter.getSession();
      const items = session ? await adapter.getNotifications(session) : [];
      setProfile(session); setNotifications(items);
    } catch { setError("Account details could not be loaded. Try again."); }
    finally { setReady(true); }
  }, [adapter]);
  useEffect(() => { void refresh(); }, [refresh]);

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
