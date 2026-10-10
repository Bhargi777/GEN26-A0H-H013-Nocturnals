"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { CATEGORY_DEPARTMENT } from "@/lib/ai/routing";
import { triage } from "@/lib/ai/triage";
import { onAvTicketChange } from "./_lib/reservation-hook";
import { newTicketSchema, photoError, type NewTicketInput } from "./_lib/schema";
import type { TicketCategory, TicketPriority } from "./_stubs/constants";
import {
  createTicket,
  findSimilarTickets,
  followTicket,
  getBuilding,
  getCurrentProfile,
  listDepartments,
  uploadTicketPhoto,
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

export type CreateTicketState = {
  error?: string;
  fieldErrors?: Partial<Record<keyof NewTicketInput | "photo", string>>;
};

const TEXT_FIELDS = [
  "title",
  "description",
  "buildingId",
  "roomId",
  "locationNote",
  "category",
  "priority",
  "aiSuggestedCategory",
  "aiSuggestedPriority",
  "aiConfidence",
] as const;

/** Creates the ticket, uploads the photo and opens the new ticket page. */
export async function createTicketAction(formData: FormData): Promise<CreateTicketState> {
  const profile = await getCurrentProfile();
  if (!profile) return { error: "Your session has ended. Sign in again to report an issue." };

  // Missing text becomes "" so required fields get their own message; an empty
  // AI field stays undefined so a blank confidence is not read as 0.
  const raw = Object.fromEntries(
    TEXT_FIELDS.map((field) => {
      const value = formData.get(field)?.toString() ?? "";
      return [field, field.startsWith("ai") && value === "" ? undefined : value];
    }),
  );
  const parsed = newTicketSchema.safeParse(raw);
  const fieldErrors: CreateTicketState["fieldErrors"] = {};
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as keyof NewTicketInput;
      fieldErrors[field] ??= issue.message;
    }
  }

  const photo = formData.get("photo");
  const hasPhoto = photo instanceof File && photo.size > 0;
  const photoProblem = hasPhoto ? photoError(photo) : null;
  if (photoProblem) fieldErrors.photo = photoProblem;

  if (!parsed.success || photoProblem) {
    return { error: "Some details need fixing before the report can be sent.", fieldErrors };
  }
  const input = parsed.data;

  let photoPath: string | null = null;
  if (hasPhoto) {
    const upload = await uploadTicketPhoto(profile.id, photo);
    if (!upload.ok) {
      return {
        error: `The photo could not be uploaded (${upload.error}). Try again, or submit without a photo.`,
      };
    }
    photoPath = upload.data;
  }

  const departments = await listDepartments();
  const department = departments.find((d) => d.code === CATEGORY_DEPARTMENT[input.category]);

  const created = await createTicket(profile.id, {
    title: input.title,
    description: input.description,
    category: input.category,
    priority: input.priority,
    buildingId: input.buildingId,
    roomId: input.roomId,
    locationNote: input.locationNote,
    photoPath,
    assignedDepartmentId: department?.id ?? null,
    aiSuggestedCategory: input.aiSuggestedCategory ?? null,
    aiSuggestedPriority: input.aiSuggestedPriority ?? null,
    aiConfidence: input.aiConfidence ?? null,
  });
  if (!created.ok) {
    return { error: `The report could not be saved: ${created.error}. Try again in a moment.` };
  }

  if (input.category === "AV_EQUIPMENT") {
    // TODO(reservation): room link hook for AV tickets.
    onAvTicketChange({ ticketId: created.data.id, roomId: input.roomId, change: "opened" });
  }

  redirect(`/service-requests/${encodeURIComponent(created.data.code)}?created=1`);
}
