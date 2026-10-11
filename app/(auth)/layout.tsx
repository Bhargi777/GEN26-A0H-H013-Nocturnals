import Link from "next/link";
import type { ReactNode } from "react";
import { AuthGate } from "./auth-gate";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-screen">
    <header className="bg-accent px-4 py-4 text-surface md:px-8"><Link href="/sign-in" className="text-title text-surface">CampusConnect Portal</Link></header>
    <div className="px-4 py-8">
      <main className="mx-auto max-w-md rounded-card border bg-surface p-6"><AuthGate>{children}</AuthGate></main>
      {process.env.NEXT_PUBLIC_APK_URL && <p className="mx-auto mt-4 max-w-md text-center text-secondary">On Android? <a href={process.env.NEXT_PUBLIC_APK_URL} download className="text-link">Download the CampusConnect app</a></p>}
    </div>
  </div>;
}
