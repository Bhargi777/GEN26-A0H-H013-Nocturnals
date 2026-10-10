import { classifyWithModel, hasModelKey } from "./model";
import { triageByRules } from "./rules";
import {
  modelOutputSchema,
  triageInputSchema,
  triageResultSchema,
  type TriageInput,
  type TriageResult,
} from "./schema";

export const TRIAGE_TIMEOUT_MS = 4000;

export type Classifier = (
  input: TriageInput,
  options: { signal: AbortSignal; timeoutMs: number },
) => Promise<unknown>;

/**
 * Suggests a category, priority and department for a complaint.
 *
 * Server only: call it from a server action or route handler so the API key
 * never reaches the browser. Uses the model when a key is set and falls back
 * to keyword rules on a missing key, timeout, error or invalid output.
 */
export async function triage(
  raw: TriageInput,
  options: { classify?: Classifier; timeoutMs?: number } = {},
): Promise<TriageResult> {
  const input = triageInputSchema.parse({
    title: raw.title.slice(0, 200),
    description: raw.description.slice(0, 4000),
    buildingName: raw.buildingName.slice(0, 120),
  });

  const classify = options.classify ?? (hasModelKey() ? classifyWithModel : undefined);
  if (!classify) return triageResultSchema.parse(triageByRules(input));

  const timeoutMs = options.timeoutMs ?? TRIAGE_TIMEOUT_MS;
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(new Error(`Triage model timed out after ${timeoutMs} ms`));
    }, timeoutMs);
  });

  try {
    const output = await Promise.race([
      classify(input, { signal: controller.signal, timeoutMs }),
      timeout,
    ]);
    const parsed = modelOutputSchema.safeParse(output);
    if (parsed.success) return triageResultSchema.parse({ ...parsed.data, source: "model" });
    console.warn("triage: model output rejected, using rules", parsed.error.issues);
  } catch (error) {
    console.warn("triage: model unavailable, using rules:", (error as Error).message);
  } finally {
    clearTimeout(timer);
  }
  return triageResultSchema.parse(triageByRules(input));
}
