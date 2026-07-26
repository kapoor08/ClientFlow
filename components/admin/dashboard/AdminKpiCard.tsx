import type { LucideIcon } from "lucide-react";

const ACCENT_ICON: Record<string, string> = {
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  info: "bg-info/10 text-info",
};

export function AdminKpiCard({
  label,
  value,
  icon: Icon,
  sub,
  accent,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  sub?: string;
  accent?: "success" | "warning" | "info";
}) {
  return (
    <div className="border-border bg-card shadow-cf-1 rounded-xl border p-5">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">{label}</p>
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-lg ${accent ? ACCENT_ICON[accent] : "bg-secondary"}`}
        >
          <Icon size={14} className={accent ? "" : "text-muted-foreground"} />
        </div>
      </div>
      <p className="font-display text-foreground text-2xl font-bold">{value}</p>
      {sub && <p className="text-muted-foreground mt-1 text-xs">{sub}</p>}
    </div>
  );
}
