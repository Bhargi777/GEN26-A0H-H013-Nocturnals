"use client";

import Link from "next/link";
import { Button, Card, buttonStyles } from "@/components/ui";

export default function ServiceRequestsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <Card role="alert" className="space-y-3">
      <h1>This page could not be loaded</h1>
      <p className="text-secondary">
        The service request data could not be loaded. Try again, and if it keeps failing, contact
        the admin office.
        {error.digest && <span className="block">Reference: {error.digest}</span>}
      </p>
      <div className="flex flex-wrap gap-3">
        <Button onClick={reset}>Try again</Button>
        <Link href="/service-requests" className={buttonStyles("secondary")}>
          Back to my tickets
        </Link>
      </div>
    </Card>
  );
}
