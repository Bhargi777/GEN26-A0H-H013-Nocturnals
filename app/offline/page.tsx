import type { Metadata } from "next";

export const metadata: Metadata = { title: "You are offline" };

export default function OfflinePage() {
  return <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-4 p-6">
    <p className="font-semibold text-accent">CampusConnect</p>
    <h1>You are offline</h1>
    <p className="text-secondary">Rooms, orders and requests need a connection so they are always up to date. Check your Wi-Fi or mobile data and try again.</p>
    <a href="/dashboard" className="inline-flex min-h-11 items-center justify-center rounded-control border border-accent bg-accent px-4 py-2 font-medium text-surface">Try again</a>
  </main>;
}
