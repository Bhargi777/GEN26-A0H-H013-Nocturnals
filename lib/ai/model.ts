import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { TRIAGE_SYSTEM_PROMPT, buildTriageUserMessage } from "./prompt";
import { modelOutputSchema, type TriageInput } from "./schema";

/** The single LLM provider for triage. Swap the provider by replacing this file. */
export const DEFAULT_TRIAGE_MODEL = "claude-opus-5-5";

export function hasModelKey(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export async function classifyWithModel(
  input: TriageInput,
  options: { signal: AbortSignal; timeoutMs: number },
): Promise<unknown> {
  if (typeof window !== "undefined") {
    throw new Error("Triage must run on the server so the API key stays private");
  }
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");

  const client = new Anthropic({ apiKey, maxRetries: 0, timeout: options.timeoutMs });
  const response = await client.beta.messages.parse(
    {
      model: process.env.TRIAGE_MODEL || DEFAULT_TRIAGE_MODEL,
      max_tokens: 1024,
      // On a safety decline the API retries on its recommended fallback model.
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "low", format: betaZodOutputFormat(modelOutputSchema) },
      system: TRIAGE_SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildTriageUserMessage(input) }],
    },
    { signal: options.signal },
  );

  if (response.stop_reason !== "end_turn") {
    throw new Error(`Triage model stopped with ${response.stop_reason}`);
  }
  return response.parsed_output;
}
