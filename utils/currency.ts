/**
 * Currency formatting helpers.
 */

/**
 * Formats a cent value as currency (e.g. "$1,234.56").
 * Returns "-" for null/undefined.
 */
export function formatCurrency(
  cents: number | null | undefined,
  currency?: string | null,
): string {
  if (cents === null || cents === undefined) return "-";
  const code = (currency ?? "USD").toUpperCase();
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: code,
    minimumFractionDigits: 2,
  }).format(cents / 100);
}
