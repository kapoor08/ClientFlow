import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

/**
 * Auth endpoints (sign-in, sign-up, password reset): 10 requests per 10 seconds per IP.
 * Prevents brute-force and credential stuffing attacks.
 */
export const authRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "10 s"),
  prefix: "rl:auth",
  analytics: false,
});

/**
 * General API endpoints: 120 requests per minute per IP.
 * Prevents API abuse and excessive scraping.
 */
export const apiRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(120, "60 s"),
  prefix: "rl:api",
  analytics: false,
});

/**
 * Per-email sign-in lockout: 5 failed attempts per 15 minutes.
 * Complements the IP limiter - a distributed credential-stuffing attack that
 * cycles IPs still gets stopped per-target-account.
 *
 * Counter is incremented from the auth hook on every sign-in attempt and is
 * not reset on success - under threshold the limit naturally expires after
 * the 15-minute window.
 */
export const signInLockout = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "15 m"),
  prefix: "rl:signin:email",
  analytics: false,
});

export function lockoutKey(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Per-API-key quota: 1,000 requests per minute, per key.
 *
 * The IP-based `apiRatelimit` above is one bucket per source IP; that's the
 * right shape for browser traffic but the wrong shape for a server-to-server
 * integration where one customer's backend may send all calls from a small
 * pool of IPs. This bucket keys off the API key itself so a single noisy
 * integration doesn't impact other tenants on the same egress IP.
 *
 * The limit is intentionally higher than the IP-based bucket - integrations
 * legitimately burst (sync jobs, daily exports). When this trips it returns
 * a 429 with the API key's prefix so the operator can see which key was
 * throttled in their logs.
 */
export const apiKeyRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(1000, "60 s"),
  prefix: "rl:api:key",
  analytics: true,
});

/**
 * Best-effort monthly usage counter per API key. Increments on every v1 call
 * and is read by the API-key list UI to surface "X / 1,000,000 calls this
 * month". Does NOT throttle - the per-minute limiter above handles abuse.
 *
 * Stored in Redis with a 32-day TTL keyed on `usage:apikey:<id>:<YYYY-MM>`,
 * so old months age out without us having to clean them up.
 */
export async function incrementApiKeyMonthlyUsage(keyId: string): Promise<void> {
  const month = new Date().toISOString().slice(0, 7); // "YYYY-MM"
  const k = `usage:apikey:${keyId}:${month}`;
  // Pipeline: incr + set TTL on first hit. Subsequent hits incr without
  // resetting TTL (EXPIRE NX would also work but isn't supported by all
  // Upstash plans).
  const next = await redis.incr(k);
  if (next === 1) {
    await redis.expire(k, 32 * 24 * 3600);
  }
}

export async function getApiKeyMonthlyUsage(keyId: string): Promise<number> {
  const month = new Date().toISOString().slice(0, 7);
  const k = `usage:apikey:${keyId}:${month}`;
  const v = await redis.get<number>(k);
  return Number(v ?? 0);
}
