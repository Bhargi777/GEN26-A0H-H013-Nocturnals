"use client";

import { Button, ButtonLink } from "@/components/service-requests/button";

export default function ServiceRequestsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div role="alert" className="mx-auto max-w-xl rounded-lg border border-slate-200 bg-white p-6">
      <h1 className="text-base font-semibold text-slate-900">This page could not be loaded</h1>
      <p className="mt-2 text-sm text-slate-600">
        {error.message || "Something went wrong while loading service requests."} Try again, and
        if it keeps failing, contact the admin office.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <Button onClick={reset}>Try again</Button>
        <ButtonLink href="/service-requests" variant="secondary">
          Back to my tickets
        </ButtonLink>
      </div>
    </div>
  );
}
