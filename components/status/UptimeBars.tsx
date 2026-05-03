"use client";

import { CheckCircle2, AlertTriangle, MinusCircle, Wrench, XCircle } from "lucide-react";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import type { ComponentState } from "@/db/schemas/status";

/**
 * 90-day uptime bar strip with a per-bar hover popover.
 *
 * Bars are rendered server-side via the `UptimeBarDay[]` payload; this
 * component is `"use client"` purely so Radix's HoverCard can attach
 * pointer/keyboard listeners. The bars themselves carry no state.
 *
 * Mirrors the semantics of upstream status pages (Atlassian, Vercel,
 * etc.) - hovering a day reveals the date, uptime %, and probe count.
 */

export type UptimeBarDayClient = {
  /** ISO 8601 day-start (e.g. "2026-05-03T00:00:00.000Z"). Serialized as
   * a string because client components can't accept `Date` props from
   * server components without a serialization round-trip. */
  dateIso: string;
  state: ComponentState;
  /** Basis points (0–10_000) for uptime. `null` = no probe data that day. */
  uptimeBp: number | null;
  totalChecks: number;
};

type Props = {
  bars: UptimeBarDayClient[];
  /** Derived 90-day average uptime %, formatted by the caller. */
  averageUptimeLabel: string;
};

export function UptimeBars({ bars, averageUptimeLabel }: Props) {
  if (bars.length === 0) return null;

  return (
    <div>
      <div className="text-muted-foreground mb-1.5 flex items-center justify-between text-[10px]">
        <span>90 days ago</span>
        <span>{averageUptimeLabel}</span>
        <span>Today</span>
      </div>
      <div className="flex items-center gap-[2px]" role="img" aria-label="90-day uptime history">
        {bars.map((bar) => (
          <BarSegment key={bar.dateIso} bar={bar} />
        ))}
      </div>
    </div>
  );
}

const BAR_COLOR: Record<ComponentState, string> = {
  operational: "bg-emerald-500 hover:bg-emerald-400",
  degraded: "bg-amber-500 hover:bg-amber-400",
  outage: "bg-red-500 hover:bg-red-400",
  maintenance: "bg-sky-500 hover:bg-sky-400",
  unknown: "bg-muted hover:bg-muted/70",
};

const STATE_LABEL: Record<ComponentState, string> = {
  operational: "Operational",
  degraded: "Degraded performance",
  outage: "Major outage",
  maintenance: "Scheduled maintenance",
  unknown: "No data",
};

const STATE_ICON: Record<ComponentState, typeof CheckCircle2> = {
  operational: CheckCircle2,
  degraded: AlertTriangle,
  outage: XCircle,
  maintenance: Wrench,
  unknown: MinusCircle,
};

const STATE_ICON_COLOR: Record<ComponentState, string> = {
  operational: "text-emerald-500",
  degraded: "text-amber-500",
  outage: "text-red-500",
  maintenance: "text-sky-500",
  unknown: "text-muted-foreground",
};

function BarSegment({ bar }: { bar: UptimeBarDayClient }) {
  const date = new Date(bar.dateIso);
  const colorClass = BAR_COLOR[bar.state];
  const Icon = STATE_ICON[bar.state];
  const iconColor = STATE_ICON_COLOR[bar.state];

  // Plain-text aria-label for screen readers since the rich popover content
  // isn't read out automatically.
  const ariaLabel =
    bar.totalChecks === 0
      ? `${formatLongDate(date)}: no probe data`
      : `${formatLongDate(date)}: ${STATE_LABEL[bar.state]}, ${formatUptime(bar.uptimeBp)} uptime`;

  return (
    <HoverCard openDelay={80} closeDelay={120}>
      <HoverCardTrigger asChild>
        <span
          className={`h-7 min-w-[3px] flex-1 cursor-default rounded-[1px] transition-colors ${colorClass}`}
          aria-label={ariaLabel}
          tabIndex={0}
        />
      </HoverCardTrigger>
      <HoverCardContent side="top" align="center" sideOffset={8} className="w-60 p-3">
        <p className="text-foreground text-xs font-semibold">{formatLongDate(date)}</p>
        <div className="mt-2 flex items-center gap-1.5">
          <Icon size={13} className={iconColor} aria-hidden />
          <span className="text-foreground text-xs">{STATE_LABEL[bar.state]}</span>
        </div>
        <dl className="mt-3 grid grid-cols-2 gap-y-1 text-[11px]">
          <dt className="text-muted-foreground">Uptime</dt>
          <dd className="text-foreground text-right tabular-nums">{formatUptime(bar.uptimeBp)}</dd>
          <dt className="text-muted-foreground">Probes</dt>
          <dd className="text-foreground text-right tabular-nums">
            {bar.totalChecks > 0 ? bar.totalChecks.toLocaleString() : "—"}
          </dd>
        </dl>
      </HoverCardContent>
    </HoverCard>
  );
}

function formatLongDate(date: Date): string {
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatUptime(uptimeBp: number | null): string {
  if (uptimeBp == null) return "No data";
  return `${(uptimeBp / 100).toFixed(2)}%`;
}
