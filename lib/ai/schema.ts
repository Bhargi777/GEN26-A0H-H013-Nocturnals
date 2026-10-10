import { z } from "zod";
import {
  DEPARTMENT_CODES,
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
} from "@/app/(app)/service-requests/_stubs/constants";

/** The only fields triage ever sees. No name, email or roll number. */
export const triageInputSchema = z.object({
  title: z.string().trim().max(200),
  description: z.string().trim().max(4000),
  buildingName: z.string().trim().max(120),
});
export type TriageInput = z.infer<typeof triageInputSchema>;

/** What the model must return. Anything outside these lists is rejected. */
export const modelOutputSchema = z.object({
  category: z.enum(TICKET_CATEGORIES),
  priority: z.enum(TICKET_PRIORITIES),
  departmentCode: z.enum(DEPARTMENT_CODES),
  confidence: z.number().min(0).max(1),
});
export type ModelOutput = z.infer<typeof modelOutputSchema>;

export const triageResultSchema = modelOutputSchema.extend({
  source: z.enum(["model", "rules"]),
});
export type TriageResult = z.infer<typeof triageResultSchema>;
