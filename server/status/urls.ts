import "server-only";

import { createUnsubscribeToken } from "@/server/email/unsubscribe-token";

/**
 * Resolve the canonical base URL for the status subdomain.
 *
 * - Production: `https://status.client-flow.in`
 * - Dev / preview: falls back to `<NEXT_PUBLIC_APP_URL>/status` so links in
 *   verification emails work via the path-based access pattern.
 *
 * Override at deploy time by setting `NEXT_PUBLIC_STATUS_URL`.
 */
export function getStatusBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_STATUS_URL) {
    return process.env.NEXT_PUBLIC_STATUS_URL.replace(/\/$/, "");
  }
  if (process.env.VERCEL_ENV === "production") {
    return "https://status.client-flow.in";
  }
  const app = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "http://localhost:3000";
  return `${app}/status`;
}

export function getStatusVerifyUrl(token: string): string {
  return `${getStatusBaseUrl()}/verify?token=${encodeURIComponent(token)}`;
}

/**
 * Status subscriber unsubscribe URL. Reuses the existing HMAC-signed
 * unsubscribe-token utility so the same key (BETTER_AUTH_SECRET) verifies
 * both transactional and status-subscriber unsubscribe links.
 */
export function getStatusUnsubscribeUrl(email: string): string {
  const token = createUnsubscribeToken(email);
  return `${getStatusBaseUrl()}/unsubscribe?token=${encodeURIComponent(token)}`;
}
