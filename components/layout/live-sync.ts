"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase/browser";

/** Tables whose changes should refresh whatever the user is looking at. RLS limits which rows arrive. */
const LIVE_TABLES = ["room_bookings", "event_requests", "orders", "service_tickets", "class_cancellations", "notifications"];
const EVENT = "campus:changed";
const POLL_MS = 20_000;

/**
 * One realtime channel for the signed-in user. A change, the app coming back to the foreground, the network
 * returning, or a slow poll (for phones whose socket was dropped in the background) fires `campus:changed`
 * and refreshes server components. Pages listen with `useLiveRefresh`.
 */
export function useLiveSync(userId: string | undefined, onChange: () => void) {
  const router = useRouter();
  const callback = useRef(onChange);
  useEffect(() => { callback.current = onChange; }, [onChange]);

  useEffect(() => {
    if (!userId) return;
    const supabase = getSupabase();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const bump = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        window.dispatchEvent(new Event(EVENT));
        callback.current();
        router.refresh();
      }, 300);
    };
    let channel = supabase.channel(`live-${userId}`);
    for (const table of LIVE_TABLES) channel = channel.on("postgres_changes", { event: "*", schema: "public", table }, bump);
    channel.subscribe();

    const onVisible = () => { if (document.visibilityState === "visible") bump(); };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("online", bump);
    window.addEventListener("pageshow", bump);
    const poll = setInterval(() => { if (document.visibilityState === "visible") bump(); }, POLL_MS);
    return () => {
      clearTimeout(timer); clearInterval(poll);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("online", bump);
      window.removeEventListener("pageshow", bump);
      void supabase.removeChannel(channel);
    };
  }, [userId, router]);
}

/** Re-runs `load` whenever live data may have changed (realtime, app resumed, network back, poll). */
export function useLiveRefresh(load: () => unknown) {
  const latest = useRef(load);
  useEffect(() => { latest.current = load; }, [load]);
  useEffect(() => {
    const run = () => { void latest.current(); };
    window.addEventListener(EVENT, run);
    return () => window.removeEventListener(EVENT, run);
  }, []);
}
