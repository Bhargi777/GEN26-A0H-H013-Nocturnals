"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { CATEGORY_DEPARTMENT } from "@/lib/ai/routing";
import { triage } from "@/lib/ai/triage";
import { TICKET_CATEGORIES, TICKET_STATUSES, type TicketStatus } from "@/lib/constants";
import { getCurrentProfile } from "@/lib/db/shared";
import {
  createTicket,
  followTicket,
  rateTicket,
  reassignTicketDepartment,
  transitionTicket,
  uploadTicketPhoto,
} from "@/lib/db/service-requests";
import type { TicketCategory, TicketPriority } from "./_lib/labels";
import {
  findSimilarTickets,
  getBuilding,
  listDepartments,
  saveTriageAndRouting,
  type SimilarTicket,
} from "./_lib/queries";
import { onAvTicketChange } from "./_lib/reservation-hook";
import { newTicketSchema, photoError, type NewTicketInput } from "./_lib/schema";

const errorMessage = (error: unknown) => (error instanceof Error ? error.message : String(error));

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

  try {
    await followTicket(parsed.data.ticketId);
  } catch (error) {
    // Following twice hits the primary key; the user is already following.
    if (!/duplicate key/i.test(errorMessage(error))) {
      return { error: `Could not follow ${parsed.data.code}: ${errorMessage(error)}. Try again.` };
    }
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

  let ticket;
  try {
    ticket = await createTicket({
      title: input.title,
      description: input.description,
      category: input.category,
      priority: input.priority,
      building_id: input.buildingId,
      room_id: input.roomId,
      location_note: input.locationNote ?? "",
    });
  } catch (error) {
    return { error: `The report could not be saved: ${errorMessage(error)}. Try again in a moment.` };
  }

  const departments = await listDepartments();
  const department = departments.find((d) => d.code === CATEGORY_DEPARTMENT[input.category]);
  try {
    await saveTriageAndRouting(ticket.id, {
      departmentId: department?.id ?? null,
      aiSuggestedCategory: input.aiSuggestedCategory ?? null,
      aiSuggestedPriority: input.aiSuggestedPriority ?? null,
      aiConfidence: input.aiConfidence ?? null,
    });
  } catch (error) {
    console.warn(`service-requests: could not route ${ticket.code}:`, errorMessage(error));
  }

  let photoFailed = false;
  if (hasPhoto) {
    try {
      await uploadTicketPhoto(ticket.id, photo);
    } catch (error) {
      console.warn(`service-requests: photo upload failed for ${ticket.code}:`, errorMessage(error));
      photoFailed = true;
    }
  }

  if (input.category === TICKET_CATEGORIES.AV_EQUIPMENT) {
    // TODO(reservation): room link hook for AV tickets.
    onAvTicketChange({ ticketId: ticket.id, roomId: input.roomId, change: "opened" });
  }

  redirect(
    `/service-requests/${encodeURIComponent(ticket.code)}?created=1${photoFailed ? "&photo=failed" : ""}`,
  );
}

export type ActionResult = { ok: true } | { ok: false; error: string };

const refused = (error: unknown): ActionResult => ({
  ok: false,
  error: `The update was refused: ${errorMessage(error)}. Refresh the page to see the ticket's current status, then try again.`,
});

function refresh(code: string) {
  revalidatePath(`/service-requests/${code}`);
  revalidatePath("/service-requests");
  revalidatePath("/service-requests/queue");
}

/**
 * Every status change goes through transitionTicket. The database checks the
 * role and the allowed transition; its message is passed on when it refuses.
 */
async function runTransition(
  code: string,
  input: { ticketId: string; toStatus: TicketStatus; note?: string | null; assignedTo?: string | null },
): Promise<ActionResult> {
  const profile = await getCurrentProfile();
  if (!profile) return { ok: false, error: "Your session has ended. Sign in again and retry." };
  try {
    await transitionTicket({
      ticket_id: input.ticketId,
      to_status: input.toStatus,
      note: input.note ?? null,
      assigned_to: input.assignedTo ?? null,
    });
  } catch (error) {
    return refused(error);
  }
  refresh(code);
  return { ok: true };
}

const ticketRef = { ticketId: z.string().min(1), code: z.string().min(1) };

const confirmFixedSchema = z.object({
  ...ticketRef,
  category: z.string(),
  roomId: z.string().nullable(),
  rating: z.coerce.number().int().min(1, "Choose a rating from 1 to 5.").max(5, "Choose a rating from 1 to 5."),
  feedback: z.string().trim().max(1000, "Keep the feedback under 1000 characters.").optional(),
});

/** Requester confirms the fix: RESOLVED to CLOSED, then the rating through rateTicket. */
export async function confirmFixedAction(
  input: z.input<typeof confirmFixedSchema>,
): Promise<ActionResult> {
  const parsed = confirmFixedSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const { ticketId, code, rating, feedback, category, roomId } = parsed.data;

  const closed = await runTransition(code, { ticketId, toStatus: TICKET_STATUSES.CLOSED });
  if (!closed.ok) return closed;

  if (category === TICKET_CATEGORIES.AV_EQUIPMENT) {
    // TODO(reservation): room link hook for AV tickets.
    onAvTicketChange({ ticketId, roomId, change: "closed" });
  }

  try {
    await rateTicket({ ticket_id: ticketId, rating, feedback: feedback || null });
  } catch (error) {
    return {
      ok: false,
      error: `The ticket is closed, but the rating was not saved: ${errorMessage(error)}. Contact the admin office to add it.`,
    };
  }
  refresh(code);
  return { ok: true };
}

const stillBrokenSchema = z.object({
  ...ticketRef,
  note: z
    .string()
    .trim()
    .min(5, "Say what is still wrong in at least 5 characters.")
    .max(1000, "Keep the note under 1000 characters."),
});

/** Requester reports the fix did not work: RESOLVED to REOPENED with a note. */
export async function stillBrokenAction(
  input: z.input<typeof stillBrokenSchema>,
): Promise<ActionResult> {
  const parsed = stillBrokenSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const { ticketId, code, note } = parsed.data;
  return runTransition(code, { ticketId, toStatus: TICKET_STATUSES.REOPENED, note });
}

const assignSchema = z.object({
  ...ticketRef,
  technicianId: z.string().min(1, "Choose a technician."),
});

/** Dept admin assigns (or re-assigns) a technician in their department. */
export async function assignTicketAction(
  input: z.input<typeof assignSchema>,
): Promise<ActionResult> {
  const parsed = assignSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const { ticketId, code, technicianId } = parsed.data;
  return runTransition(code, {
    ticketId,
    toStatus: TICKET_STATUSES.ASSIGNED,
    assignedTo: technicianId,
  });
}

const moveSchema = z.object({
  ...ticketRef,
  departmentId: z.string().min(1, "Choose the department to send it to."),
  note: z
    .string()
    .trim()
    .min(5, "Explain why it belongs to that department in at least 5 characters.")
    .max(1000, "Keep the note under 1000 characters."),
});

/** Dept admin sends the ticket to another department with a note (reassign_ticket_department). */
export async function moveToDepartmentAction(
  input: z.input<typeof moveSchema>,
): Promise<ActionResult> {
  const parsed = moveSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const { ticketId, code, departmentId, note } = parsed.data;
  try {
    await reassignTicketDepartment({ ticket_id: ticketId, new_department_id: departmentId, note });
  } catch (error) {
    return refused(error);
  }
  refresh(code);
  // The ticket now belongs to another department, so this admin may no longer see it.
  redirect(`/service-requests/queue?moved=${encodeURIComponent(code)}`);
}

const startSchema = z.object(ticketRef);

/** Technician starts work: ASSIGNED to IN_PROGRESS. */
export async function startWorkAction(input: z.input<typeof startSchema>): Promise<ActionResult> {
  const parsed = startSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "That ticket could not be found. Refresh and try again." };
  const { ticketId, code } = parsed.data;
  return runTransition(code, { ticketId, toStatus: TICKET_STATUSES.IN_PROGRESS });
}

const resolveSchema = z.object({
  ...ticketRef,
  note: z
    .string()
    .trim()
    .min(5, "Describe what was fixed in at least 5 characters.")
    .max(1000, "Keep the resolution note under 1000 characters."),
});

/** Technician resolves the ticket: IN_PROGRESS to RESOLVED with a resolution note. */
export async function resolveTicketAction(
  input: z.input<typeof resolveSchema>,
): Promise<ActionResult> {
  const parsed = resolveSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const { ticketId, code, note } = parsed.data;
  return runTransition(code, { ticketId, toStatus: TICKET_STATUSES.RESOLVED, note });
}
