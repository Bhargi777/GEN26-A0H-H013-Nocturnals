import Link from "next/link";
import type { ReactNode } from "react";
import { AuthGate } from "./auth-gate";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-screen px-4 py-8">
    <header className="mx-auto mb-8 max-w-md"><Link href="/dashboard" className="font-semibold">CampusConnect</Link></header>
    <main className="mx-auto max-w-md rounded-card border bg-surface p-6"><AuthGate>{children}</AuthGate></main>
  </div>;
}
