import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * OAuth state-token helpers.
 *
 * The state parameter we hand to Slack must:
 *  - Survive the round-trip through slack.com/oauth/v2/authorize.
 *  - Be unforgeable so an attacker can't trigger an install for someone
 *    else's organization by crafting a callback URL.
 *
 * We use an HMAC-signed payload (org ID + user ID + nonce + expiry) keyed
 * with BETTER_AUTH_SECRET. Stateless on the server side - no Redis row, no
 * cookie collision - the signature is the integrity check.
 */

const STATE_TTL_SECONDS = 10 * 60; // 10 minutes - more than enough for OAuth round-trip

type StatePayload = {
  org: string;
  user: string;
  exp: number;
  nonce: string;
};

function getStateSecret(): string {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret) throw new Error("BETTER_AUTH_SECRET is not configured.");
  return secret;
}

function base64url(buf: Buffer | string): string {
  const b = typeof buf === "string" ? Buffer.from(buf) : buf;
  return b.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64url(s: string): Buffer {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  return Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/") + pad, "base64");
}

export function signOAuthState(input: { organizationId: string; userId: string }): string {
  const payload: StatePayload = {
    org: input.organizationId,
    user: input.userId,
    exp: Math.floor(Date.now() / 1000) + STATE_TTL_SECONDS,
    nonce: base64url(Buffer.from(crypto.getRandomValues(new Uint8Array(12)))),
  };
  const body = base64url(JSON.stringify(payload));
  const sig = base64url(createHmac("sha256", getStateSecret()).update(body).digest());
  return `${body}.${sig}`;
}

export function verifyOAuthState(
  state: string,
): { ok: true; organizationId: string; userId: string } | { ok: false; reason: string } {
  const parts = state.split(".");
  if (parts.length !== 2) return { ok: false, reason: "Malformed state token." };
  const [body, sig] = parts;

  const expected = base64url(createHmac("sha256", getStateSecret()).update(body).digest());
  const expectedBuf = Buffer.from(expected);
  const sigBuf = Buffer.from(sig);
  if (expectedBuf.length !== sigBuf.length || !timingSafeEqual(expectedBuf, sigBuf)) {
    return { ok: false, reason: "Invalid state signature." };
  }

  let payload: StatePayload;
  try {
    payload = JSON.parse(fromBase64url(body).toString("utf8")) as StatePayload;
  } catch {
    return { ok: false, reason: "Malformed state payload." };
  }

  if (typeof payload.exp !== "number" || payload.exp < Math.floor(Date.now() / 1000)) {
    return { ok: false, reason: "State token expired." };
  }

  return { ok: true, organizationId: payload.org, userId: payload.user };
}

export function getSlackRedirectUri(): string {
  const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (!base) throw new Error("NEXT_PUBLIC_APP_URL is not configured.");
  return `${base}/api/integrations/slack/callback`;
}
