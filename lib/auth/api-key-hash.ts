import { createHash } from "crypto";

/**
 * SHA-256 hash of a raw API key, as stored in `apiKeys.keyHash`. Pure and free
 * of server-only/DB deps so it can be imported and unit-tested directly.
 */
export function hashApiKey(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}
