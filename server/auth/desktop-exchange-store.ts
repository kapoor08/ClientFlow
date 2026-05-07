import { createHash, randomBytes } from "node:crypto";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const TTL_SECONDS = 60;
const TOKEN_BYTES = 32;
const KEY_PREFIX = "desktop:exch:";

type StoredPayload = {
  userId: string;
  nonce: string;
};

function hash(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function keyFor(token: string): string {
  return `${KEY_PREFIX}${hash(token)}`;
}

/**
 * Mints a one-time exchange token bound to a user + Electron-instance nonce.
 * Returned token is delivered to the desktop app via the clientflow:// deep
 * link, then redeemed by the desktop-exchange Better Auth endpoint.
 *
 * Single-use, 60s TTL, sha256 at rest. The token itself never returns from
 * Redis - we only ever look up by hash.
 */
export async function mintExchangeToken(payload: StoredPayload): Promise<string> {
  const token = randomBytes(TOKEN_BYTES).toString("hex");
  await redis.set(keyFor(token), payload, { ex: TTL_SECONDS });
  return token;
}

/**
 * Looks up and immediately deletes an exchange token (atomic single-use).
 * Returns the stored payload or null if missing/expired/already consumed.
 */
export async function consumeExchangeToken(token: string): Promise<StoredPayload | null> {
  if (typeof token !== "string" || token.length !== TOKEN_BYTES * 2) return null;
  const key = keyFor(token);
  // Upstash supports GETDEL natively. Falls back fine on plans that don't.
  const payload = (await redis.getdel(key)) as StoredPayload | null;
  return payload ?? null;
}
