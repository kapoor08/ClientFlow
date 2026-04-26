import "server-only";

import { logger } from "@/server/observability/logger";

/**
 * Cloudflare Turnstile token verifier.
 *
 * Production posts the user's `cf-turnstile-response` token to siteverify and
 * returns whether the challenge passed. If TURNSTILE_SECRET_KEY isn't set
 * (typical in dev), verification is skipped - we treat that as "challenge
 * disabled" rather than failing closed, so local development isn't blocked.
 */

const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const TIMEOUT_MS = 5_000;

export const isTurnstileConfigured = Boolean(process.env.TURNSTILE_SECRET_KEY);

export async function verifyTurnstileToken(
  token: string | undefined | null,
  remoteIp?: string | null,
): Promise<{ ok: boolean; reason?: string }> {
  // Soft-fail when not configured - keeps local dev unblocked.
  if (!isTurnstileConfigured) return { ok: true };

  if (!token || typeof token !== "string") {
    return { ok: false, reason: "missing_token" };
  }

  const body = new URLSearchParams();
  body.set("secret", process.env.TURNSTILE_SECRET_KEY!);
  body.set("response", token);
  if (remoteIp) body.set("remoteip", remoteIp);

  try {
    const res = await fetch(SITEVERIFY_URL, {
      method: "POST",
      body,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const data = (await res.json()) as { success: boolean; "error-codes"?: string[] };
    if (!data.success) {
      return {
        ok: false,
        reason: data["error-codes"]?.join(",") ?? "verification_failed",
      };
    }
    return { ok: true };
  } catch (err) {
    logger.error("turnstile.verify_failed", err);
    // Network failure to Cloudflare - fail closed; legitimate users can retry.
    return { ok: false, reason: "siteverify_unreachable" };
  }
}
