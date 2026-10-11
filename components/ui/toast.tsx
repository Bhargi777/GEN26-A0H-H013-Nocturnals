"use client";

import { createContext, useCallback, useContext, useId, useRef, useState, type ReactNode } from "react";
import { X } from "lucide-react";

export interface ToastMessage { message: string; tone?: "success" | "error" }
interface ToastEntry extends ToastMessage { id: string }
const ToastContext = createContext<((message: ToastMessage) => void) | null>(null);

export function Toast({ message, tone = "success", onDismiss }: ToastMessage & { onDismiss: () => void }) {
  return <div role={tone === "error" ? "alert" : "status"} className={`flex items-start gap-3 rounded-card border p-4 ${tone === "error" ? "border-status-red-dark bg-status-red-light text-status-red-dark" : "border-status-green-dark bg-status-green-light text-status-green-dark"}`}>
    <p className="min-w-0 flex-1 break-words">{message}</p>
    <button type="button" aria-label="Dismiss notification" className="rounded-control p-1" onClick={onDismiss}><X size={16} aria-hidden="true" /></button>
  </div>;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<ToastEntry[]>([]);
  const prefix = useId();
  const counter = useRef(0);
  const notify = useCallback((message: ToastMessage) => {
    const id = `${prefix}-${++counter.current}`;
    setMessages((previous) => [...previous.slice(-2), { ...message, id }]);
  }, [prefix]);
  // No corner popups. Successes are announced to screen readers only; a failure stays as a slim banner at the top until dismissed.
  const errors = messages.filter((message) => message.tone === "error").slice(-1);
  const announcements = messages.filter((message) => message.tone !== "error").slice(-1);
  return <ToastContext.Provider value={notify}>
    {errors.length > 0 && <div role="region" aria-label="Problems" className="sticky top-0 z-50 mx-auto w-full max-w-screen-xl p-2">
      {errors.map((message) => <Toast key={message.id} {...message} onDismiss={() => setMessages((previous) => previous.filter((item) => item.id !== message.id))} />)}
    </div>}
    {children}
    <div role="status" aria-live="polite" className="sr-only">{announcements.map((message) => <p key={message.id}>{message.message}</p>)}</div>
  </ToastContext.Provider>;
}

export function useToast() {
  const notify = useContext(ToastContext);
  if (!notify) throw new Error("useToast requires ToastProvider.");
  return notify;
}
