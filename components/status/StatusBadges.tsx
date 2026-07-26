import { CheckCircle2, AlertTriangle, XCircle, Wrench, MinusCircle } from "lucide-react";
import type { ComponentState, IncidentImpact, IncidentState } from "@/db/schemas/status";

const STATE_PILL_CONFIG: Record<
  ComponentState,
  { label: string; icon: typeof CheckCircle2; className: string }
> = {
  operational: {
    label: "Operational",
    icon: CheckCircle2,
    className: "bg-emerald-500/10 text-emerald-500",
  },
  degraded: {
    label: "Degraded",
    icon: AlertTriangle,
    className: "bg-amber-500/10 text-amber-500",
  },
  outage: {
    label: "Outage",
    icon: XCircle,
    className: "bg-red-500/10 text-red-500",
  },
  maintenance: {
    label: "Maintenance",
    icon: Wrench,
    className: "bg-sky-500/10 text-sky-500",
  },
  unknown: {
    label: "No data",
    icon: MinusCircle,
    className: "bg-muted text-muted-foreground",
  },
};

export function StatePill({ state }: { state: ComponentState }) {
  const conf = STATE_PILL_CONFIG[state];
  const Icon = conf.icon;
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${conf.className}`}
    >
      <Icon size={12} aria-hidden />
      {conf.label}
    </span>
  );
}

export function IncidentStateBadge({ state }: { state: IncidentState }) {
  const cls: Record<IncidentState, string> = {
    investigating: "bg-amber-500/10 text-amber-500",
    identified: "bg-orange-500/10 text-orange-500",
    monitoring: "bg-sky-500/10 text-sky-500",
    resolved: "bg-emerald-500/10 text-emerald-500",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${cls[state]}`}>
      {state}
    </span>
  );
}

export function ImpactBadge({ impact }: { impact: IncidentImpact }) {
  const cls: Record<IncidentImpact, string> = {
    none: "bg-muted text-muted-foreground",
    minor: "bg-amber-500/10 text-amber-500",
    major: "bg-orange-500/10 text-orange-500",
    critical: "bg-red-500/10 text-red-500",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${cls[impact]}`}>
      {impact}
    </span>
  );
}
