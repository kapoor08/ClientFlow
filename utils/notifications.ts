import { isThisWeek, isToday, isYesterday } from "date-fns";

export type DateGroupLabel = "Today" | "Yesterday" | "This Week" | "Older";

export function getDateGroupLabel(value: Date | string): DateGroupLabel {
  const date = value instanceof Date ? value : new Date(value);
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  if (isThisWeek(date, { weekStartsOn: 1 })) return "This Week";
  return "Older";
}

export function groupItemsByDateLabel<T extends { createdAt: string }>(
  items: T[],
): Array<{ label: DateGroupLabel; items: T[] }> {
  const order: DateGroupLabel[] = ["Today", "Yesterday", "This Week", "Older"];
  const grouped = new Map<DateGroupLabel, T[]>();

  for (const item of items) {
    const label = getDateGroupLabel(item.createdAt);
    if (!grouped.has(label)) grouped.set(label, []);
    grouped.get(label)!.push(item);
  }

  return order
    .filter((label) => grouped.has(label))
    .map((label) => ({ label, items: grouped.get(label)! }));
}
