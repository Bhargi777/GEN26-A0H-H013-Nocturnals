import { timingSafeEqual } from "node:crypto";
import webpush from "web-push";

interface Subscription { endpoint: string; p256dh: string; auth: string }
interface Payload { subscriptions?: Subscription[]; title?: string; body?: string; link?: string; tag?: string }

const equal = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));

/**
 * Called by the database trigger (pg_net) for every new notification.
 * The shared secret proves the call comes from the database; the subscriptions arrive in the body,
 * so this route needs no database access and no service key.
 */
export async function POST(request: Request) {
  const secret = process.env.PUSH_WEBHOOK_SECRET;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!secret || !publicKey || !privateKey) return new Response("Push is not configured.", { status: 503 });
  if (!equal(request.headers.get("x-push-secret") ?? "", secret)) return new Response("Forbidden", { status: 403 });

  let payload: Payload;
  try { payload = (await request.json()) as Payload; } catch { return new Response("Bad request", { status: 400 }); }
  const subscriptions = (payload.subscriptions ?? []).slice(0, 20);
  if (!subscriptions.length) return Response.json({ sent: 0 });

  webpush.setVapidDetails(process.env.VAPID_SUBJECT ?? "mailto:admin@example.com", publicKey, privateKey);
  const message = JSON.stringify({
    title: String(payload.title ?? "ourAmrita").slice(0, 120),
    body: String(payload.body ?? "").slice(0, 240),
    link: typeof payload.link === "string" && payload.link.startsWith("/") ? payload.link : "/notifications",
    tag: payload.tag,
  });

  const results = await Promise.allSettled(subscriptions.map((sub) =>
    webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, message, { TTL: 3600, urgency: "high" })));
  const gone = results.flatMap((result, index) => result.status === "rejected" && [404, 410].includes((result.reason as { statusCode?: number }).statusCode ?? 0) ? [subscriptions[index].endpoint] : []);
  return Response.json({ sent: results.filter((result) => result.status === "fulfilled").length, gone });
}
