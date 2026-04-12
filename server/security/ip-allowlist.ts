/**
 * IP allowlist enforcement utilities.
 * Supports exact IPv4 addresses and CIDR ranges (e.g. "192.168.1.0/24").
 */

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
export function isIpAllowed(
  clientIp: string | null,
  allowlist: string[] | null,
): boolean {
  if (!allowlist || allowlist.length === 0) return true;
  if (!clientIp) return false;

  // Strip IPv6-mapped IPv4 prefix (::ffff:1.2.3.4)
  const normalizedIp = clientIp.replace(/^::ffff:/, "").split(",")[0].trim();
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
  return (
    headers.get("x-real-ip") ??
    headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    null
  );
}
