import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Suspense, type ReactNode } from "react";
import "./globals.css";
import { PwaProvider } from "@/components/pwa/pwa-provider";
import { FrontendProvider } from "@/components/layout/frontend-provider";
import { ThemeProvider } from "@/components/layout/theme-provider";


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
    <html lang="en" suppressHydrationWarning>
      <Script id="theme-init" strategy="beforeInteractive">{`(() => {
        try {
          const saved = localStorage.getItem("ouramrita-theme");
          document.documentElement.dataset.theme = saved === "light" || saved === "dark"
            ? saved
            : matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
        } catch {
          document.documentElement.dataset.theme = matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
        }
      })();`}</Script>
      <body className="bg-background font-sans text-body text-primary antialiased">
        <ThemeProvider>
          <Suspense fallback={<p role="status" className="p-4 text-secondary">Loading…</p>}><FrontendProvider>{children}</FrontendProvider></Suspense><PwaProvider />
        </ThemeProvider>
      </body>
    </html>
  );
}
