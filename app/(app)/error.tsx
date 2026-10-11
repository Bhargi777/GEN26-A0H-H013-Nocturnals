"use client";

import { RouteError } from "@/components/ui/route-error";

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <RouteError error={error} reset={reset} what="Something went wrong while loading this page." />;
}
