/**
 * User-related display helpers.
 */

/**
 * Returns up to two uppercase initials from a name.
 * Returns "?" for null/empty input.
 */
export function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  const trimmed = name.trim();
  if (!trimmed) return "?";
  return trimmed
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .join("")
    .toUpperCase()
    .slice(0, 2);
}
