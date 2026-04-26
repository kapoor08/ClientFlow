import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Resend webhooks are delivered via Svix. Each request carries three headers:
 *
 *   svix-id         - unique message ID
 *   svix-timestamp  - UNIX seconds
 *   svix-signature  - space-separated list of `v1,<base64-hmac>` entries
 *
 * The HMAC is computed over `<svix-id>.<svix-timestamp>.<raw-body>` using the
 * base64-decoded portion of the webhook secret (which is stored with a
 * `whsec_` prefix). We verify manually to avoid pulling in the full `svix` SDK
 * for one endpoint.
 *
 * Reference: https://docs.svix.com/receiving/verifying-payloads/how-manual
 */

const TOLERANCE_SECONDS = 5 * 60;

export type VerifyResult = { ok: true; event: ResendWebhookEvent } | { ok: false; reason: string };

export type ResendWebhookEvent = {
  type: string;
  created_at?: string;
  data?: {
    email_id?: string;
    from?: string;
    to?: string | string[];
    subject?: string;
    bounce?: { type?: string; subType?: string; message?: string };
    complaint?: { type?: string };
    [key: string]: unknown;
  };
};

export function verifyResendWebhook(
  rawBody: string,
  headers: {
    id: string | null;
    timestamp: string | null;
    signature: string | null;
  },
  secret: string | undefined,
): VerifyResult {
  if (!secret) return { ok: false, reason: "secret_not_configured" };
  if (!headers.id || !headers.timestamp || !headers.signature) {
    return { ok: false, reason: "missing_svix_headers" };
  }

  const tsSeconds = Number.parseInt(headers.timestamp, 10);
  if (!Number.isFinite(tsSeconds)) {
    return { ok: false, reason: "bad_timestamp" };
  }
  const age = Math.abs(Math.floor(Date.now() / 1000) - tsSeconds);
  if (age > TOLERANCE_SECONDS) {
    return { ok: false, reason: "stale_or_future_timestamp" };
  }

  const keyB64 = secret.startsWith("whsec_") ? secret.slice(6) : secret;
  let keyBuf: Buffer;
  try {
    keyBuf = Buffer.from(keyB64, "base64");
  } catch {
    return { ok: false, reason: "bad_secret_encoding" };
  }

  const signedPayload = `${headers.id}.${headers.timestamp}.${rawBody}`;
  const expected = createHmac("sha256", keyBuf).update(signedPayload).digest();

  // svix-signature can contain multiple space-separated "vN,<sig>" entries.
  // A match on any v1 entry is sufficient.
  const candidates = headers.signature.split(" ");
  const matched = candidates.some((entry) => {
    const [version, b64] = entry.split(",");
    if (version !== "v1" || !b64) return false;
    let provided: Buffer;
    try {
      provided = Buffer.from(b64, "base64");
    } catch {
      return false;
    }
    if (provided.length !== expected.length) return false;
    try {
      return timingSafeEqual(provided, expected);
    } catch {
      return false;
    }
  });

  if (!matched) return { ok: false, reason: "signature_mismatch" };

  let event: ResendWebhookEvent;
  try {
    event = JSON.parse(rawBody) as ResendWebhookEvent;
  } catch {
    return { ok: false, reason: "bad_json" };
  }
  return { ok: true, event };
}

export function extractRecipientEmails(event: ResendWebhookEvent): string[] {
  const to = event.data?.to;
  if (!to) return [];
  const list = Array.isArray(to) ? to : [to];
  return list
    .map((s) => (typeof s === "string" ? s.trim().toLowerCase() : ""))
    .filter((s) => s.length > 0 && s.includes("@"));
}
