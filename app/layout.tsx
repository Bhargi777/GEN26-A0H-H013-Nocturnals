import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { FrontendProvider } from "@/components/layout/frontend-provider";


export const metadata: Metadata = {
  title: { default: "CampusConnect", template: "%s | CampusConnect" },
  description: "Campus service requests and administrative certificates",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-background font-sans text-body text-primary antialiased">
        <FrontendProvider>{children}</FrontendProvider>
      </body>
    </html>
  );
}
