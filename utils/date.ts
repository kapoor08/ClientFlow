/**
 * Date / time formatting helpers shared across the app.
 * Safe to import from both server and client components.
 */

type DateInput = Date | string | null | undefined;

type FormatDateOptions = {
  /** Include hour and minute (e.g. "Jan 5, 2026, 02:30 PM"). */
  withTime?: boolean;
  /** Use full month name (e.g. "January" instead of "Jan"). */
  long?: boolean;
};

type FormatDateTimeOptions = {
  long?: boolean;
  withSeconds?: boolean;
};

export function formatDate(
  value: DateInput,
  opts: FormatDateOptions = {},
): string {
  if (!value) return "-";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("en-US", {
    month: opts.long ? "long" : "short",
    day: "numeric",
    year: "numeric",
    ...(opts.withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  }).format(date);
}

export function formatDateTime(
  value: DateInput,
  opts: FormatDateTimeOptions = {},
): string {
  if (!value) return "-";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("en-US", {
    month: opts.long ? "long" : "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    ...(opts.withSeconds ? { second: "2-digit" } : {}),
  }).format(date);
}

export function formatDateDayMonthYear(value: DateInput): string {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

/**
 * Returns a relative-time label like "5m ago", "2h ago", "3d ago".
 * For dates older than 30 days, falls back to a short formatted date.
 */
export function formatTimeAgo(value: DateInput): string {
  if (!value) return "-";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(date);
}

/**
 * Formats a duration in minutes as "Xh Ym" (e.g. "2h 30m", "45m", "0h").
 */
export function formatMinutes(minutes: number): string {
  if (!minutes || minutes <= 0) return "0h";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}
