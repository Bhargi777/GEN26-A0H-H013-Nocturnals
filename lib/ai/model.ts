import Anthropic from "@anthropic-ai/sdk";
import { TRIAGE_SYSTEM_PROMPT, buildTriageUserMessage } from "./prompt";
import type { TriageInput } from "./schema";

/** The single LLM provider for triage. Swap the provider by replacing this file. */
export const DEFAULT_TRIAGE_MODEL = "claude-opus-5-5";

/**
 * Request fields newer than the pinned SDK's types. The API reads them as sent:
 * low effort keeps a one-line classification fast, and on a safety decline
 * the API retries on its recommended fallback model.
 */
type TriageRequest = Anthropic.MessageCreateParamsNonStreaming & {
  output_config: { effort: "low" };
  fallbacks: "default";
};

export function hasModelKey(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

/** Reads the JSON object out of the model's reply, with or without a code fence. */
export function parseModelJson(text: string): unknown {
  const trimmed = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  return JSON.parse(trimmed);
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
  const request: TriageRequest = {
    model: process.env.TRIAGE_MODEL || DEFAULT_TRIAGE_MODEL,
    max_tokens: 2048,
    system: TRIAGE_SYSTEM_PROMPT,
    messages: [{ role: "user", content: buildTriageUserMessage(input) }],
    output_config: { effort: "low" },
    fallbacks: "default",
  };
  const response = await client.messages.create(request, {
    signal: options.signal,
    headers: { "anthropic-beta": "server-side-fallback-2026-07-01" },
  });

  // "refusal" and other newer stop reasons are not in the pinned SDK's types.
  const stopReason: string | null = response.stop_reason;
  if (stopReason !== "end_turn") throw new Error(`Triage model stopped with ${stopReason}`);

  const text = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("");
  return parseModelJson(text);
}
