import "server-only";

import net from "node:net";
import { promises as dns } from "node:dns";

/**
 * Raised when a user-supplied outbound webhook URL targets a scheme/host we
 * refuse to call server-side (SSRF protection). 422 so the API surfaces it as a
 * validation error rather than a 500.
 */
export class UnsafeWebhookUrlError extends Error {
  readonly statusCode = 422;
  constructor(message: string) {
    super(message);
    this.name = "UnsafeWebhookUrlError";
  }
}

function ipv4IsPrivate(ip: string): boolean {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n) || n < 0 || n > 255)) {
    return true; // malformed → treat as unsafe
  }
  const [a, b] = parts;
  if (a === 0) return true; // 0.0.0.0/8 "this host"
  if (a === 10) return true; // 10.0.0.0/8 private
  if (a === 127) return true; // 127.0.0.0/8 loopback
  if (a === 169 && b === 254) return true; // 169.254.0.0/16 link-local (incl. cloud metadata)
  if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12 private
  if (a === 192 && b === 168) return true; // 192.168.0.0/16 private
  if (a === 100 && b >= 64 && b <= 127) return true; // 100.64.0.0/10 CGNAT
  if (a >= 224) return true; // 224.0.0.0/4 multicast + 240.0.0.0/4 reserved + broadcast
  return false;
}

function ipv6IsPrivate(ip: string): boolean {
  const lower = ip.toLowerCase();
  if (lower === "::1" || lower === "::") return true; // loopback / unspecified
  const mapped = lower.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/); // IPv4-mapped IPv6
  if (mapped) return ipv4IsPrivate(mapped[1]);
  const firstHextet = parseInt(lower.split(":")[0] || "0", 16);
  if ((firstHextet & 0xfe00) === 0xfc00) return true; // fc00::/7 unique-local
  if ((firstHextet & 0xffc0) === 0xfe80) return true; // fe80::/10 link-local
  return false;
}

function ipIsPrivate(ip: string): boolean {
  const kind = net.isIP(ip);
  if (kind === 4) return ipv4IsPrivate(ip);
  if (kind === 6) return ipv6IsPrivate(ip);
  return true; // not a valid IP literal → unsafe
}

const BLOCKED_HOST_SUFFIXES = [".localhost", ".local", ".internal", ".lan", ".home.arpa"];

/**
 * Syntactic validation of a user-supplied outbound webhook URL. Requires https
 * and rejects hosts that are literal private/loopback/link-local IPs or obvious
 * internal names. Returns the parsed URL. Call at create/update time for
 * immediate feedback. Does NOT resolve DNS - use `assertOutboundHostAllowed`
 * at fetch time to defeat DNS rebinding.
 */
export function assertSafeWebhookUrl(raw: string): URL {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new UnsafeWebhookUrlError("Enter a valid URL.");
  }

  if (url.protocol !== "https:") {
    throw new UnsafeWebhookUrlError("Webhook URL must use https.");
  }

  const host = url.hostname.toLowerCase().replace(/\.$/, "");
  if (!host) {
    throw new UnsafeWebhookUrlError("Webhook URL is missing a host.");
  }
  if (host === "localhost" || BLOCKED_HOST_SUFFIXES.some((s) => host.endsWith(s))) {
    throw new UnsafeWebhookUrlError("Webhook URL host is not allowed.");
  }
  // URL.hostname wraps IPv6 literals in brackets ([::1]); strip them so net.isIP
  // and the private-range checks recognise the address.
  const ipLiteral = host.replace(/^\[|\]$/g, "");
  if (net.isIP(ipLiteral) && ipIsPrivate(ipLiteral)) {
    throw new UnsafeWebhookUrlError("Webhook URL cannot target a private or loopback address.");
  }

  return url;
}

/**
 * Fetch-time anti-DNS-rebinding guard: resolve the host and reject if ANY
 * resolved address is private/loopback/link-local. Best-effort - there is a
 * small TOCTOU window between this lookup and the actual connection, but it
 * closes the common rebinding case where a public name flips to a private IP.
 */
export async function assertOutboundHostAllowed(hostname: string): Promise<void> {
  const host = hostname.toLowerCase().replace(/\.$/, "");
  // Strip IPv6 brackets ([::1]) so the literal is recognised by net.isIP.
  const ipLiteral = host.replace(/^\[|\]$/g, "");

  if (net.isIP(ipLiteral)) {
    if (ipIsPrivate(ipLiteral)) {
      throw new UnsafeWebhookUrlError("Webhook host resolves to a private address.");
    }
    return;
  }

  let records: { address: string }[];
  try {
    records = await dns.lookup(host, { all: true });
  } catch {
    throw new UnsafeWebhookUrlError("Webhook host could not be resolved.");
  }

  if (records.length === 0 || records.some((r) => ipIsPrivate(r.address))) {
    throw new UnsafeWebhookUrlError("Webhook host resolves to a private address.");
  }
}
