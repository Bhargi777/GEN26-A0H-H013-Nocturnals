import { z } from "zod";
import { CATEGORY_VALUES, PRIORITY_VALUES } from "../_lib/labels";

export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
export const ALLOWED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => (value ? value : null));

export const newTicketSchema = z.object({
  title: z
    .string()
    .trim()
    .min(5, "Write a short title of at least 5 characters.")
    .max(120, "Keep the title under 120 characters."),
  description: z
    .string()
    .trim()
    .min(10, "Describe the problem in at least 10 characters.")
    .max(2000, "Keep the description under 2000 characters."),
  buildingId: z.string().min(1, "Choose the building where the problem is."),
  roomId: optionalText(64),
  locationNote: optionalText(200),
  category: z.enum(CATEGORY_VALUES, { message: "Choose a category." }),
  priority: z.enum(PRIORITY_VALUES, { message: "Choose a priority." }),
  aiSuggestedCategory: z.enum(CATEGORY_VALUES).optional().catch(undefined),
  aiSuggestedPriority: z.enum(PRIORITY_VALUES).optional().catch(undefined),
  aiConfidence: z.coerce.number().min(0).max(1).optional().catch(undefined),
});

export type NewTicketInput = z.infer<typeof newTicketSchema>;

/** Returns an error message for an unacceptable photo, or null when it is fine. */
export function photoError(file: File): string | null {
  if (!(ALLOWED_PHOTO_TYPES as readonly string[]).includes(file.type)) {
    return "Upload the photo as a JPG, PNG or WebP image.";
  }
  if (file.size > MAX_PHOTO_BYTES) {
    return "The photo is larger than 5 MB. Upload a smaller image.";
  }
  return null;
}
