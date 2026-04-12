import { cn } from "@/utils/cn";

type StatusBadgeProps = {
  status: string;
  className?: string;
  colorMap?: Record<string, string>;
};

const DEFAULT_COLORS: Record<string, string> = {
  active: "bg-success/10 text-success",
  inactive: "bg-secondary text-muted-foreground",
  archived: "bg-secondary text-muted-foreground",
  pending: "bg-warning/10 text-warning",
  completed: "bg-success/10 text-success",
  cancelled: "bg-danger/10 text-danger",
  on_hold: "bg-warning/10 text-warning",
  planning: "bg-secondary text-muted-foreground",
  open: "bg-info/10 text-info",
  paid: "bg-success/10 text-success",
  draft: "bg-secondary text-muted-foreground",
  overdue: "bg-danger/10 text-danger",
  trialing: "bg-info/10 text-info",
};

export function StatusBadge({ status, className, colorMap }: StatusBadgeProps) {
  const colors = colorMap ?? DEFAULT_COLORS;
  const colorClass = colors[status] ?? "bg-secondary text-muted-foreground";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-pill px-2.5 py-0.5 text-xs font-medium capitalize",
        colorClass,
        className,
      )}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}
