"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { triage } from "@/lib/ai/triage";
import type { TicketCategory, TicketPriority } from "./_stubs/constants";
import {
  findSimilarTickets,
  followTicket,
  getBuilding,
  getCurrentProfile,
  type SimilarTicket,
} from "./_stubs/db";

export type TriageSuggestion = {
  category: TicketCategory;
  priority: TicketPriority;
  confidence: number;
  source: "model" | "rules";
};

/** Runs triage on the server so the model API key never reaches the browser. */
export async function suggestTriageAction(input: {
  title: string;
  description: string;
  buildingId: string;
}): Promise<TriageSuggestion | null> {
  const profile = await getCurrentProfile();
  if (!profile) return null;
  if (`${input.title} ${input.description}`.trim().length < 10) return null;

  const building = input.buildingId ? await getBuilding(input.buildingId) : null;
  const result = await triage({
    title: String(input.title),
    description: String(input.description),
    buildingName: building?.name ?? "",
  });
  return {
    category: result.category,
    priority: result.priority,
    confidence: result.confidence,
    source: result.source,
  };
}

/** Open tickets in the same building that look like the one being reported. */
export async function findSimilarAction(input: {
  buildingId: string;
  title: string;
  description: string;
}): Promise<SimilarTicket[]> {
  const profile = await getCurrentProfile();
  if (!profile || !input.buildingId) return [];
  const text = `${input.title} ${input.description}`.trim().slice(0, 2000);
  if (text.length < 10) return [];
  return findSimilarTickets(input.buildingId, text);
}

const followSchema = z.object({ ticketId: z.string().min(1), code: z.string().min(1) });

/** "I have this issue too": follow an existing ticket instead of opening a new one. */
export async function followTicketAction(input: {
  ticketId: string;
  code: string;
}): Promise<{ error: string }> {
  const parsed = followSchema.safeParse(input);
  if (!parsed.success) return { error: "That ticket could not be found. Refresh and try again." };
  const profile = await getCurrentProfile();
  if (!profile) return { error: "Your session has ended. Sign in again to follow this ticket." };

  const result = await followTicket(parsed.data.ticketId, profile.id);
  if (!result.ok) {
    return { error: `Could not follow ${parsed.data.code}: ${result.error}` };
  }
  redirect(`/service-requests/${encodeURIComponent(parsed.data.code)}?followed=1`);
}
