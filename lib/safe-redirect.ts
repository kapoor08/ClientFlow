/**
 * Validates a `redirectTo` query-param value before passing it to `router.push`
 * or a server-side redirect. Prevents open-redirect attacks via crafted URLs
 * like `?redirectTo=https://evil.com` or `?redirectTo=//evil.com`.
 *
 * Returns the value if it's a same-origin internal path, otherwise the
 * provided fallback.
 */
export function safeInternalRedirect(value: string | null | undefined, fallback: string): string {
  if (!value) return fallback;

  // Reject protocol-relative URLs (//evil.com), absolute URLs, and anything
  // that doesn't start with a single forward slash.
  if (!value.startsWith("/")) return fallback;
  if (value.startsWith("//")) return fallback;
  if (value.startsWith("/\\")) return fallback;

  // Reject backslash tricks some browsers normalize to "/".
  if (value.includes("\\")) return fallback;

  return value;
}
