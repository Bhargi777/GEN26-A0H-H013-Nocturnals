"use server";

import { triage } from "@/lib/ai/triage";
import type { TicketCategory, TicketPriority } from "./_stubs/constants";
import { getBuilding, getCurrentProfile } from "./_stubs/db";

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
