import type { Metadata } from "next";
import { Suspense, type ReactNode } from "react";
import "./globals.css";
import { FrontendProvider } from "@/components/layout/frontend-provider";


export const metadata: Metadata = {
  title: { default: "CampusConnect", template: "%s | CampusConnect" },
  description: "Campus services: requests, rooms, events and canteen",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-background font-sans text-body text-primary antialiased">
        <Suspense fallback={<p role="status" className="p-4 text-secondary">Loading…</p>}><FrontendProvider>{children}</FrontendProvider></Suspense>
      </body>
    </html>
  );
}
