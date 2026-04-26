import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Unsubscribe link tokens are HMAC-signed email addresses. No expiry - CAN-SPAM
 * requires the mechanism to keep working, and the only risk of a leaked link is
 * that someone gets unsubscribed against their will, which they can undo with
 * one click. The HMAC key is `BETTER_AUTH_SECRET` so rotating it invalidates
 * every outstanding link (acceptable - users would just click a fresh email).
 */

function getSecret(): string {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret) {
    throw new Error("BETTER_AUTH_SECRET is required for unsubscribe-token signing.");
  }
  return secret;
}

function sign(email: string): Buffer {
  return createHmac("sha256", getSecret()).update(email.toLowerCase()).digest();
}

function b64url(buf: Buffer | string): string {
  return (typeof buf === "string" ? Buffer.from(buf) : buf).toString("base64url");
}

export function createUnsubscribeToken(email: string): string {
  const emailPart = b64url(email.toLowerCase());
  const sigPart = b64url(sign(email));
  return `${emailPart}.${sigPart}`;
}

export function verifyUnsubscribeToken(token: string): string | null {
  const [emailPart, sigPart] = token.split(".");
  if (!emailPart || !sigPart) return null;

  let email: string;
  try {
    email = Buffer.from(emailPart, "base64url").toString("utf-8");
  } catch {
    return null;
  }
  if (!email || email.length > 320) return null;

  const expected = sign(email);
  let provided: Buffer;
  try {
    provided = Buffer.from(sigPart, "base64url");
  } catch {
    return null;
  }

  if (expected.length !== provided.length) return null;
  if (!timingSafeEqual(expected, provided)) return null;
  return email.toLowerCase();
}

export function getUnsubscribeUrl(email: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "https://client-flow.in";
  const token = encodeURIComponent(createUnsubscribeToken(email));
  return `${base}/unsubscribe?token=${token}`;
}
