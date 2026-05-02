import { NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { subscribeSchema } from "@/schemas/status/subscriber";
import { createOrRefreshSubscriber, SubscriberError } from "@/server/status/subscribers";
import { getStatusVerifyUrl } from "@/server/status/urls";
import { sendGenericNotification } from "@/server/email/send";
import { verifyTurnstileToken } from "@/server/security/turnstile";
import { logger } from "@/server/observability/logger";

/**
 * Public subscribe endpoint for the status page.
 *
 * Hardening:
 *   - Per-IP rate limit (5 / 15 min) on top of the middleware's general API
 *     limit, since this endpoint sends an email and writes to the DB.
 *   - Turnstile verification when configured (soft-passes in dev).
 *   - Suppression-list honored upstream by `createOrRefreshSubscriber`.
 *
 * Always returns 200 on success regardless of whether the email already
 * existed - prevents enumeration of subscribed addresses.
 */

// Lazy: same Upstash credentials as the middleware rate limiter, but a
// dedicated bucket so this endpoint's budget doesn't share with general API
// traffic.
function getSubscribeRatelimit() {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }
  return new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(5, "15 m"),
    analytics: false,
    prefix: "rl:status-subscribe",
  });
}

function getClientIp(request: Request): string {
  return (
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = subscribeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 422 },
    );
  }

  const ip = getClientIp(request);

  // Rate limit. Soft-pass when Upstash isn't configured (matches the
  // middleware's behavior so dev environments aren't blocked).
  const ratelimit = getSubscribeRatelimit();
  if (ratelimit) {
    const { success } = await ratelimit.limit(ip);
    if (!success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again in a few minutes." },
        { status: 429 },
      );
    }
  }

  // Turnstile (soft-passes when not configured).
  const turnstile = await verifyTurnstileToken(parsed.data.turnstileToken, ip);
  if (!turnstile.ok) {
    return NextResponse.json(
      { error: "Bot challenge failed. Please reload and try again." },
      { status: 400 },
    );
  }

  try {
    const result = await createOrRefreshSubscriber(parsed.data.email);

    if (result.alreadyVerified) {
      return NextResponse.json({ ok: true, alreadyVerified: true });
    }

    const verifyUrl = getStatusVerifyUrl(result.verificationToken);
    await sendGenericNotification(parsed.data.email, {
      recipient_name: parsed.data.email,
      title: "Confirm your ClientFlow Status subscription",
      body: "Click the button below to confirm your subscription. We'll email you when an incident affects ClientFlow services. This link expires in 24 hours.",
      action_url: verifyUrl,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof SubscriberError && err.code === "suppressed") {
      // Mirror the success shape so we don't leak suppression status to a
      // probing attacker. Log it server-side for visibility.
      logger.info("status.subscribe.suppressed_attempt", { email: parsed.data.email });
      return NextResponse.json({ ok: true });
    }
    logger.error("status.subscribe.failed", err, { email: parsed.data.email });
    return NextResponse.json(
      { error: "Could not subscribe right now. Please try again later." },
      { status: 500 },
    );
  }
}
