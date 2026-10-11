"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Button, buttonStyles } from "./button";
import { Card } from "./card";

/** Shared body for error.tsx boundaries: say what failed, offer a retry and a way out. */
export function RouteError({ error, reset, what, backHref = "/dashboard", backLabel = "Go to dashboard" }: {
  error: Error & { digest?: string };
  reset: () => void;
  what: string;
  backHref?: string;
  backLabel?: string;
}) {
  useEffect(() => { console.error(error); }, [error]);
  return <Card role="alert" className="space-y-3">
    <h1>This page could not be loaded</h1>
    <p className="text-secondary">{what} Try again, and if it keeps failing, contact the campus help desk.{error.digest && <span className="block">Reference: {error.digest}</span>}</p>
    <div className="flex flex-wrap gap-3">
      <Button onClick={reset}>Try again</Button>
      <Link href={backHref} className={buttonStyles("secondary")}>{backLabel}</Link>
    </div>
  </Card>;
}
