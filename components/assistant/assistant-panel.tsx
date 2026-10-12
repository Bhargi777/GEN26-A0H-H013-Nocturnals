"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { MessageCircleQuestion, Send, X } from "lucide-react";
import { Button, FieldError } from "@/components/ui";
import { keepDialogFocus } from "@/components/ui/dialog-focus";
import { useFrontend } from "@/components/layout/frontend-provider";
import { requestRoomBooking } from "@/lib/db/rooms";
import { formatDay } from "@/lib/time";
import type { AssistantReply, RoomProposal } from "@/lib/ai/assistant/engine";

interface Turn { role: "user" | "assistant"; content: string; reply?: AssistantReply }

const SUGGESTIONS: Record<string, string[]> = {
  faculty: ["Book a room for 40 people on Tuesday period 3", "Show my room requests", "What events are on this week?"],
  cr: ["Book a room for 30 people tomorrow period 5", "Show my room requests", "How far ahead can I book a room?"],
  student: ["Where is my order?", "When does the canteen forfeit my order?", "What events are on this week?"],
  club_president: ["How do I request an event?", "What events are on this week?", "Show my service requests"],
};
const DEFAULT_SUGGESTIONS = ["What events are on this week?", "How do I turn on phone notifications?", "How does service request priority work?"];

function ProposalCard({ proposal, profileName, onDone }: { proposal: RoomProposal; profileName: string; onDone: (text: string) => void }) {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [done, setDone] = useState(false);
  async function confirm() {
    if (reason.trim().length < 5) { setError("Add a reason of at least 5 characters."); return; }
    setBusy(true); setError(undefined);
    try {
      const booking = await requestRoomBooking({ roomId: proposal.roomId, date: proposal.date, periodId: proposal.periodId, attendees: proposal.attendees, reason: reason.trim(), facultyName: profileName });
      setDone(true); onDone(`Request ${booking.code} sent to the department for approval.`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "The request could not be sent."); }
    finally { setBusy(false); }
  }
  if (done) return null;
  return <div className="space-y-2 rounded-control border border-accent bg-accent-light p-3">
    <p className="font-medium text-accent">Confirm room request</p>
    <p>{proposal.roomName} · {formatDay(proposal.date)} · {proposal.periodLabel} · {proposal.attendees} people</p>
    <label className="block space-y-1"><span className="block font-medium">Reason</span>
      <input className="control min-h-11" value={reason} maxLength={300} onChange={(event) => { setReason(event.target.value); setError(undefined); }} placeholder="e.g. Extra class before the test" /></label>
    <FieldError>{error}</FieldError>
    <Button size="sm" loading={busy} onClick={() => void confirm()}>Send request</Button>
  </div>;
}

/** Answers campus questions and proposes actions for the user to confirm. */
export function AssistantPanel() {
  const { profile } = useFrontend();
  const [open, setOpen] = useState(false);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const dialog = useRef<HTMLDialogElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const id = useId();

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); setOpen((value) => !value); } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open && !element.open) element.showModal();
    if (!open && element.open) element.close();
  }, [open]);
  useEffect(() => { list.current?.scrollTo({ top: list.current.scrollHeight }); }, [turns]);

  if (!profile) return null;
  const suggestions = SUGGESTIONS[profile.role] ?? DEFAULT_SUGGESTIONS;

  async function ask(question: string) {
    const message = question.trim();
    if (!message || busy) return;
    setText(""); setError(undefined); setBusy(true);
    const history = turns.map((turn) => ({ role: turn.role, content: turn.content }));
    setTurns((current) => [...current, { role: "user", content: message }]);
    try {
      const response = await fetch("/api/assistant", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message, history }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "The assistant could not answer.");
      const reply = data as AssistantReply;
      setTurns((current) => [...current, { role: "assistant", content: reply.reply, reply }]);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "The assistant could not answer."); }
    finally { setBusy(false); }
  }

  return <>
    <button ref={trigger} type="button" onClick={() => setOpen(true)} aria-haspopup="dialog" aria-controls={id} className="inline-flex min-h-11 items-center gap-2 rounded-control border border-surface px-3 py-2 font-medium text-surface hover:bg-accent-hover">
      <MessageCircleQuestion size={18} aria-hidden="true" /><span className="hidden sm:inline">Ask</span><span className="sr-only sm:hidden">Ask ourAmrita</span>
    </button>
    <dialog ref={dialog} id={id} aria-labelledby={`${id}-title`} onKeyDown={keepDialogFocus} onClose={() => { setOpen(false); trigger.current?.focus(); }} onCancel={(event) => { event.preventDefault(); setOpen(false); }}
      className="m-0 ml-auto h-dvh max-h-none w-full max-w-md rounded-none border-l bg-surface p-0 text-primary backdrop:bg-primary/40">
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between gap-3 bg-accent px-4 py-3 text-surface">
          <h2 id={`${id}-title`} className="text-surface">Ask ourAmrita</h2>
          <button type="button" aria-label="Close assistant" onClick={() => setOpen(false)} className="rounded-control p-2 hover:bg-accent-hover"><X size={18} aria-hidden="true" /></button>
        </div>
        <div ref={list} className="flex-1 space-y-3 overflow-y-auto p-4" aria-live="polite">
          {turns.length === 0 && <div className="space-y-3">
            <p className="text-secondary">Ask about rules, your orders and requests, or what is on. I can also find a room and prepare the request for you to confirm.</p>
            <ul className="space-y-2">{suggestions.map((suggestion) => <li key={suggestion}><button type="button" onClick={() => void ask(suggestion)} className="w-full rounded-control border bg-background px-3 py-2 text-left hover:bg-accent-light">{suggestion}</button></li>)}</ul>
          </div>}
          {turns.map((turn, index) => <div key={index} className={turn.role === "user" ? "ml-8 rounded-card bg-accent px-3 py-2 text-surface" : "mr-8 space-y-2 rounded-card border bg-background px-3 py-2"}>
            <p className="whitespace-pre-line break-words">{turn.content}</p>
            {turn.reply?.sources.length ? <p className="text-secondary">From: {[...new Set(turn.reply.sources)].join(" · ")}</p> : null}
            {turn.reply?.links.length ? <p className="flex flex-wrap gap-3">{turn.reply.links.map((link) => <Link key={link.href} href={link.href} onClick={() => setOpen(false)} className="text-link">{link.label}</Link>)}</p> : null}
            {turn.reply?.proposal && <ProposalCard proposal={turn.reply.proposal} profileName={profile.full_name} onDone={(textDone) => setTurns((current) => [...current, { role: "assistant", content: textDone }])} />}
            {turn.reply?.mode === "offline" && index === turns.length - 1 && <p className="text-secondary">Offline mode: answers come from campus help and your data.</p>}
          </div>)}
          {busy && <p role="status" className="text-secondary">Thinking…</p>}
          <FieldError>{error}</FieldError>
        </div>
        <form className="flex gap-2 border-t p-3 pb-[max(12px,env(safe-area-inset-bottom))]" onSubmit={(event) => { event.preventDefault(); void ask(text); }}>
          <label htmlFor={`${id}-input`} className="sr-only">Your question</label>
          <input id={`${id}-input`} className="control min-h-11 flex-1" value={text} maxLength={500} autoFocus placeholder="Ask a question" onChange={(event) => setText(event.target.value)} />
          <Button type="submit" aria-label="Send" loading={busy} disabled={!text.trim()}><Send size={16} aria-hidden="true" /></Button>
        </form>
      </div>
    </dialog>
  </>;
}
