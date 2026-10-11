"use client";

import { useEffect, useState } from "react";
import { Button, Card, FieldError } from "@/components/ui";
import { useFrontend } from "@/components/layout/frontend-provider";
import { getSupabase } from "@/lib/supabase/browser";

const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function keyBytes(base64: string): Uint8Array<ArrayBuffer> {
  const padded = base64.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob(padded);
  const bytes = new Uint8Array(new ArrayBuffer(raw.length));
  for (let index = 0; index < raw.length; index += 1) bytes[index] = raw.charCodeAt(index);
  return bytes;
}

type State = "unsupported" | "blocked" | "off" | "on";

/** Turn phone notifications on or off, and send yourself a test. */
export function PushOptIn() {
  const { profile } = useFrontend();
  const [state, setState] = useState<State>("off");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!vapidKey || !("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) { if (!cancelled) setState("unsupported"); return; }
      if (Notification.permission === "denied") { if (!cancelled) setState("blocked"); return; }
      const registration = await navigator.serviceWorker.ready;
      const existing = await registration.pushManager.getSubscription();
      if (!cancelled) setState(existing ? "on" : "off");
    })().catch(() => { if (!cancelled) setState("unsupported"); });
    return () => { cancelled = true; };
  }, []);

  async function enable() {
    if (!profile || !vapidKey || busy) return;
    setBusy(true); setError(undefined); setMessage(undefined);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") { setState(permission === "denied" ? "blocked" : "off"); setError("Notifications were not allowed. Allow them in your browser or phone settings, then try again."); return; }
      const registration = await navigator.serviceWorker.ready;
      const subscription = (await registration.pushManager.getSubscription()) ?? await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(vapidKey) });
      const json = subscription.toJSON();
      const { error: saveError } = await getSupabase().from("push_subscriptions").upsert(
        { user_id: profile.id, endpoint: subscription.endpoint, p256dh: json.keys?.p256dh, auth: json.keys?.auth }, { onConflict: "endpoint" });
      if (saveError) throw new Error(saveError.message);
      setState("on"); setMessage("Phone notifications are on for this device.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Notifications could not be turned on. Try again."); }
    finally { setBusy(false); }
  }

  async function disable() {
    if (busy) return;
    setBusy(true); setError(undefined); setMessage(undefined);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await getSupabase().from("push_subscriptions").delete().eq("endpoint", subscription.endpoint);
        await subscription.unsubscribe();
      }
      setState("off"); setMessage("Phone notifications are off for this device.");
    } catch { setError("Notifications could not be turned off. Try again."); }
    finally { setBusy(false); }
  }

  async function sendTest() {
    if (busy) return;
    setBusy(true); setError(undefined); setMessage(undefined);
    const { error: rpcError } = await getSupabase().rpc("send_test_notification");
    if (rpcError) setError(rpcError.message); else setMessage("Test sent. It should appear in your notification centre within a few seconds.");
    setBusy(false);
  }

  return <Card className="space-y-3" role="region" aria-label="Phone notifications">
    <div><h2>Phone notifications</h2>
      <p className="text-secondary">Get room decisions, event updates and “order ready” alerts in your phone’s notification centre, even when the app is closed.</p></div>
    {state === "unsupported" && <p className="text-secondary">This browser does not support push notifications. On iPhone, add the app to your Home Screen first, then open it from there.</p>}
    {state === "blocked" && <p className="text-secondary">Notifications are blocked for this site. Allow them in your browser or phone settings, then reload.</p>}
    <div className="flex flex-wrap gap-3">
      {state === "off" && <Button loading={busy} onClick={() => void enable()}>Turn on notifications</Button>}
      {state === "on" && <><Button variant="secondary" loading={busy} onClick={() => void disable()}>Turn off</Button><Button loading={busy} onClick={() => void sendTest()}>Send me a test notification</Button></>}
    </div>
    <div aria-live="polite">{message && <p role="status" className="text-status-green-dark">{message}</p>}<FieldError>{error}</FieldError></div>
  </Card>;
}
