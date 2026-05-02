/**
 * IP allowlist enforcement utilities.
 * Supports exact IPv4 addresses and CIDR ranges (e.g. "192.168.1.0/24").
 */

import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { db } from "@/server/db/client";
import { organizationMemberships, organizationSettings } from "@/db/schema";
import { getActiveOrgIdFromCookie } from "@/server/auth/active-org";

function ipToInt(ip: string): number | null {
  const parts = ip.split(".");
  if (parts.length !== 4) return null;
  let result = 0;
  for (const part of parts) {
    const n = parseInt(part, 10);
    if (isNaN(n) || n < 0 || n > 255) return null;
    result = (result << 8) | n;
  }
  return result >>> 0;
}

/**
 * Returns true if `clientIp` matches any entry in `allowlist`.
 * Each entry can be a bare IPv4 address or a CIDR range.
 * Returns true (allow) when allowlist is empty or null.
 */
export function isIpAllowed(clientIp: string | null, allowlist: string[] | null): boolean {
  if (!allowlist || allowlist.length === 0) return true;
  if (!clientIp) return false;

  // Strip IPv6-mapped IPv4 prefix (::ffff:1.2.3.4)
  const normalizedIp = clientIp
    .replace(/^::ffff:/, "")
    .split(",")[0]
    .trim();
  const clientInt = ipToInt(normalizedIp);
  if (clientInt === null) return false;

  for (const entry of allowlist) {
    const slashIdx = entry.indexOf("/");
    if (slashIdx === -1) {
      // Exact match
      const entryInt = ipToInt(entry.trim());
      if (entryInt !== null && entryInt === clientInt) return true;
    } else {
      // CIDR match
      const network = entry.slice(0, slashIdx).trim();
      const prefix = parseInt(entry.slice(slashIdx + 1), 10);
      if (isNaN(prefix) || prefix < 0 || prefix > 32) continue;
      const networkInt = ipToInt(network);
      if (networkInt === null) continue;
      const mask = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;
      if ((clientInt & mask) === (networkInt & mask)) return true;
    }
  }

  return false;
}

/**
 * Extracts the best-available client IP from standard forwarded headers.
 */
export function getClientIp(headers: Headers): string | null {
  return headers.get("x-real-ip") ?? headers.get("x-forwarded-for")?.split(",")[0].trim() ?? null;
}

/**
 * Look up the IP allowlist for an org and return it (or null if none set).
 * Returns null without any allowlist set so callers can short-circuit.
 */
async function loadOrgIpAllowlist(organizationId: string): Promise<string[] | null> {
  const [row] = await db
    .select({ ipAllowlist: organizationSettings.ipAllowlist })
    .from(organizationSettings)
    .where(eq(organizationSettings.organizationId, organizationId))
    .limit(1);
  const allowlist = row?.ipAllowlist;
  if (!allowlist || allowlist.length === 0) return null;
  return allowlist;
}

/**
 * Resolve the user's active org and return its IP allowlist.
 * Honours the active-org cookie when present so the check matches whichever
 * workspace the user is currently in; falls back to their first active
 * membership if the cookie is absent or stale.
 */
async function loadUserActiveOrgIpAllowlist(userId: string): Promise<string[] | null> {
  const cookieOrgId = await getActiveOrgIdFromCookie();
  let activeOrgId: string | null = null;

  if (cookieOrgId) {
    const [membership] = await db
      .select({ organizationId: organizationMemberships.organizationId })
      .from(organizationMemberships)
      .where(
        and(
          eq(organizationMemberships.userId, userId),
          eq(organizationMemberships.organizationId, cookieOrgId),
          eq(organizationMemberships.status, "active"),
        ),
      )
      .limit(1);
    if (membership) activeOrgId = membership.organizationId;
  }

  if (!activeOrgId) {
    const [membership] = await db
      .select({ organizationId: organizationMemberships.organizationId })
      .from(organizationMemberships)
      .where(
        and(
          eq(organizationMemberships.userId, userId),
          eq(organizationMemberships.status, "active"),
        ),
      )
      .limit(1);
    if (!membership) return null;
    activeOrgId = membership.organizationId;
  }

  return loadOrgIpAllowlist(activeOrgId);
}

/**
 * Throws-style guard for use inside API route handlers and server actions.
 * Pages already get this via the protected layout; this closes the gap for
 * `/api/*` routes which bypass the layout entirely.
 *
 * Returns silently if no allowlist is configured or the request IP matches.
 * Throws with a 403-shaped error message if blocked - callers map to
 * NextResponse via apiErrorResponse.
 */
export async function assertIpAllowedForUser(userId: string): Promise<void> {
  const allowlist = await loadUserActiveOrgIpAllowlist(userId);
  if (!allowlist) return;
  const reqHeaders = await headers();
  const ip = getClientIp(reqHeaders);
  if (!isIpAllowed(ip, allowlist)) {
    throw new IpAllowlistError();
  }
}

export async function assertIpAllowedForOrg(organizationId: string): Promise<void> {
  const allowlist = await loadOrgIpAllowlist(organizationId);
  if (!allowlist) return;
  const reqHeaders = await headers();
  const ip = getClientIp(reqHeaders);
  if (!isIpAllowed(ip, allowlist)) {
    throw new IpAllowlistError();
  }
}

export class IpAllowlistError extends Error {
  readonly statusCode = 403;
  constructor() {
    super("Access denied from this IP address.");
    this.name = "IpAllowlistError";
  }
}
