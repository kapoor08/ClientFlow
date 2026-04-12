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
