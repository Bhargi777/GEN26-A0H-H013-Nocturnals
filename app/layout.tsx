import type { Metadata, Viewport } from "next";
import { Suspense, type ReactNode } from "react";
import "./globals.css";
import { PwaProvider } from "@/components/pwa/pwa-provider";
import { FrontendProvider } from "@/components/layout/frontend-provider";


export const metadata: Metadata = {
  title: { default: "ourAmrita", template: "%s | ourAmrita" },
  description: "Campus services: requests, rooms, events and canteen",
  applicationName: "ourAmrita",
  appleWebApp: { capable: true, title: "ourAmrita", statusBarStyle: "default" },
  icons: { icon: "/icons/amrita.svg", apple: "/apple-touch-icon.png" },
};

export const viewport: Viewport = { themeColor: "#A9244A", viewportFit: "cover", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-background font-sans text-body text-primary antialiased">
        <Suspense fallback={<p role="status" className="p-4 text-secondary">Loading…</p>}><FrontendProvider>{children}</FrontendProvider></Suspense><PwaProvider />
      </body>
    </html>
  );
}
