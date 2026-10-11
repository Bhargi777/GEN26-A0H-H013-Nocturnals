"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui";

interface InstallEvent extends Event { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> }

const DISMISSED_KEY = "ouramrita.install.dismissed";
const PREVIOUS_DISMISSED_KEY = "myamrita.install.dismissed";
const LEGACY_DISMISSED_KEY = "campusconnect.install.dismissed";
const apkUrl = process.env.NEXT_PUBLIC_APK_URL;

/** Registers the service worker and offers to install the app on phones. */
export function PwaProvider() {
  const [installEvent, setInstallEvent] = useState<InstallEvent>();
  const [open, setOpen] = useState(false);
  const [ios, setIos] = useState(false);
  const [android, setAndroid] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) void navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
    let dismissed = false;
    try {
      dismissed = localStorage.getItem(DISMISSED_KEY) === "1"
        || localStorage.getItem(PREVIOUS_DISMISSED_KEY) === "1"
        || localStorage.getItem(LEGACY_DISMISSED_KEY) === "1";
      if (dismissed) localStorage.setItem(DISMISSED_KEY, "1");
    } catch { /* private mode: ask again */ }
    const agent = navigator.userAgent;
    const phone = /Android|iPhone|iPad|iPod/i.test(agent);
    const isIos = /iPhone|iPad|iPod/i.test(agent);
    const timer = setTimeout(() => { setIos(isIos); setAndroid(/Android/i.test(agent)); if (phone && !standalone && !dismissed) setOpen(true); }, 0);
    const onPrompt = (event: Event) => { event.preventDefault(); setInstallEvent(event as InstallEvent); };
    const onInstalled = () => setOpen(false);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => { clearTimeout(timer); window.removeEventListener("beforeinstallprompt", onPrompt); window.removeEventListener("appinstalled", onInstalled); };
  }, []);

  function dismiss() {
    setOpen(false);
    try { localStorage.setItem(DISMISSED_KEY, "1"); } catch { /* ignore */ }
  }

  if (!open) return null;
  return <section aria-label="Install the app" className="fixed inset-x-0 bottom-0 z-40 space-y-3 border-t bg-surface p-4 pb-[max(16px,env(safe-area-inset-bottom))]">
    <div><p className="font-semibold">Install ourAmrita</p>
      <p className="text-secondary">{ios ? "Tap Share, then Add to Home Screen, to get the app and notifications." : "Get the app on your phone for quick access and notifications."}</p></div>
    <div className="flex flex-wrap gap-3">
      {installEvent && <Button onClick={async () => { await installEvent.prompt(); const choice = await installEvent.userChoice; if (choice.outcome === "accepted") setOpen(false); }}>Install app</Button>}
      {android && apkUrl && <a href={apkUrl} download className="inline-flex min-h-11 items-center justify-center rounded-control border border-accent px-4 py-2 font-medium text-accent">Download APK</a>}
      <Button variant="secondary" onClick={dismiss}>Not now</Button>
    </div>
  </section>;
}
