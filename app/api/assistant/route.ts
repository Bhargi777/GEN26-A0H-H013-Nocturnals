import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { answerOffline, answerWithClaude, type AssistantProfile } from "@/lib/ai/assistant/engine";
import { createClient } from "@/lib/supabase/server";

const body = z.object({
  message: z.string().trim().min(1, "Type a question.").max(500, "Keep questions under 500 characters."),
  history: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(2000) })).max(12).default([]),
});

/** The assistant runs with the caller's own session, so every lookup is limited by row-level security. */
export async function POST(request: Request) {
  const parsed = body.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });

  const supabase = (await createClient()) as unknown as SupabaseClient;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Sign in to use the assistant." }, { status: 401 });
  const { data: profile } = await supabase.from("profiles").select("id, full_name, role").eq("id", user.id).maybeSingle();
  if (!profile) return Response.json({ error: "Your profile could not be loaded." }, { status: 403 });

  const { data: allowed } = await supabase.rpc("assistant_hit");
  if (allowed !== true) return Response.json({ error: "You are asking a lot quickly. Wait a minute and try again." }, { status: 429 });

  try {
    const reply = process.env.ANTHROPIC_API_KEY
      ? await answerWithClaude(supabase, profile as AssistantProfile, parsed.data.message, parsed.data.history).catch(() => answerOffline(supabase, profile as AssistantProfile, parsed.data.message))
      : await answerOffline(supabase, profile as AssistantProfile, parsed.data.message);
    return Response.json(reply);
  } catch {
    return Response.json({ error: "The assistant could not answer right now. Try again." }, { status: 500 });
  }
}
