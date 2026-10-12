import Link from "next/link";
import type { ReactNode } from "react";
import { AuthGate } from "./auth-gate";
import { ThemeToggle } from "@/components/layout/theme-provider";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-screen">
    <header className="flex items-center justify-between gap-3 bg-accent px-4 py-4 text-on-accent md:px-8"><Link href="/sign-in" className="text-title text-on-accent">ourAmrita</Link><ThemeToggle /></header>
    <div className="px-4 py-8">
      <main className="mx-auto max-w-md rounded-card border bg-surface p-6"><AuthGate>{children}</AuthGate></main>
      {process.env.NEXT_PUBLIC_APK_URL && <p className="mx-auto mt-4 max-w-md text-center text-secondary">On Android? <a href={process.env.NEXT_PUBLIC_APK_URL} download className="text-link">Download the ourAmrita app</a></p>}
    </div>
  </div>;
}
