"use client";

import { RouteError } from "@/components/ui/route-error";

export default function AuthError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <RouteError error={error} reset={reset} what="The sign-in page could not be loaded." backHref="/sign-in" backLabel="Back to sign in" />;
}
