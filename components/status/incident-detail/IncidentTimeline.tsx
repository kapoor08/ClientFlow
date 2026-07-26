import { CheckCircle2, Eye, Search, Wrench } from "lucide-react";
import type { IncidentImpact, IncidentState } from "@/db/schemas/status";

// NB: these pills are intentionally styled slightly differently from the
// status-index badges (`components/status/StatusBadges`) - kept separate to
// preserve the incident-detail page's exact layout.

export function IncidentStateBadge({ state }: { state: IncidentState }) {
  const cls: Record<IncidentState, string> = {
    investigating: "bg-amber-500/10 text-amber-500",
    identified: "bg-orange-500/10 text-orange-500",
    monitoring: "bg-sky-500/10 text-sky-500",
    resolved: "bg-emerald-500/10 text-emerald-500",
  };
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${cls[state]}`}
    >
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
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] ${cls[impact]}`}
    >
      {impact}
    </span>
  );
}

const TIMELINE_NODE_CONFIG: Record<
  IncidentState,
  { dotClass: string; icon: typeof CheckCircle2 }
> = {
  investigating: { dotClass: "bg-amber-500", icon: Search },
  identified: { dotClass: "bg-orange-500", icon: Eye },
  monitoring: { dotClass: "bg-sky-500", icon: Wrench },
  resolved: { dotClass: "bg-emerald-500", icon: CheckCircle2 },
};

export function TimelineNode({
  state,
  body,
  createdAt,
  isLatest,
}: {
  state: IncidentState;
  body: string;
  createdAt: Date;
  isLatest: boolean;
}) {
  const conf = TIMELINE_NODE_CONFIG[state];
  const Icon = conf.icon;

  return (
    <li className="relative">
      {/* The colored dot sits over the rail line. ring-background makes it
          read as a "node on a line" rather than touching the rail. */}
      <span
        className={`ring-background absolute top-0.5 -left-[26px] flex h-4 w-4 items-center justify-center rounded-full ring-4 ${conf.dotClass}`}
        aria-hidden
      >
        <Icon size={9} className="text-white" />
      </span>

      <div className="-mt-0.5 flex flex-wrap items-center gap-2">
        <IncidentStateBadge state={state} />
        {isLatest && (
          <span className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
            Latest
          </span>
        )}
      </div>

      <p className="text-muted-foreground mt-1 text-[11px]">
        {createdAt.toLocaleString(undefined, {
          weekday: "short",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          timeZoneName: "short",
        })}
      </p>

      <div className="border-border bg-card mt-3 rounded-xl border p-4">
        <p className="text-foreground text-sm leading-relaxed whitespace-pre-wrap">{body}</p>
      </div>
    </li>
  );
}
