// Tag color classes for task labels. Keyed by tag value; callers fall back to a
// neutral style for unknown tags.

export const TAG_COLORS: Record<string, string> = {
  bug: "bg-danger/10 text-danger border-danger/20",
  enhancement: "bg-info/10 text-info border-info/20",
  feature: "bg-success/10 text-success border-success/20",
  improvement: "bg-warning/10 text-warning border-warning/20",
  question: "bg-purple-100 text-purple-700 border-purple-200",
  documentation: "bg-neutral-100 text-neutral-600 border-neutral-200",
  design: "bg-pink-100 text-pink-700 border-pink-200",
  blocked: "bg-danger/20 text-danger border-danger/30",
};
