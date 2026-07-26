import { createHmac } from "crypto";

/**
 * HMAC-SHA256 of the raw request body with the webhook's secret (hex digest).
 * The wire header is `X-ClientFlow-Signature: sha256=<this>`. Pure + dep-light
 * so it can be unit-tested directly.
 */
export function signWebhookPayload(secret: string, body: string): string {
  return createHmac("sha256", secret).update(body).digest("hex");
}
