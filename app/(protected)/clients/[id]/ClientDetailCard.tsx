import type { LucideIcon } from "lucide-react";

export function ClientDetailCard({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-card border border-border bg-card p-4 shadow-cf-1">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Icon size={14} /> {label}
      </div>
      <p className="mt-1 text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}
