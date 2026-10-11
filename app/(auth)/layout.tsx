import Link from "next/link";
import type { ReactNode } from "react";
import { AuthGate } from "./auth-gate";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-screen">
    <header className="bg-accent px-4 py-4 text-surface md:px-8"><Link href="/sign-in" className="text-title text-surface">CampusConnect Portal</Link></header>
    <div className="px-4 py-8">
      <main className="mx-auto max-w-md rounded-card border bg-surface p-6"><AuthGate>{children}</AuthGate></main>
    </div>
  </div>;
}
