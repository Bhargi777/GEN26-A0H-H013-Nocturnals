"use client";

import { useEffect, useRef } from "react";
import { useToast } from "@/components/ui";

/** Shows one toast when a page opens after an action, such as a new ticket. */
export function FlashToast({ message, tone = "success" }: { message: string; tone?: "success" | "error" }) {
  const toast = useToast();
  const shown = useRef(false);
  useEffect(() => {
    if (shown.current) return;
    shown.current = true;
    toast({ message, tone });
  }, [message, tone, toast]);
  return null;
}
