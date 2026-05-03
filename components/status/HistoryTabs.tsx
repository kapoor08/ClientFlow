"use client";

import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UptimeCalendar } from "./UptimeCalendar";
import type { UptimeBarDayClient } from "./UptimeBars";
import type { IncidentImpact, IncidentState } from "@/db/schemas/status";

/**
 * Client wrapper for the /history page tabs. Both tab payloads are
 * pre-fetched server-side so switching tabs is instant - no fetch waterfall.
 */

export type HistoryUptimeRow = {
  id: string;
  name: string;
  description: string | null;
  averageUptimeLabel: string;
  bars: UptimeBarDayClient[];
};

export type HistoryIncidentSummary = {
  id: string;
  slug: string;
  title: string;
  startedAtIso: string;
  resolvedAtIso: string | null;
  currentState: IncidentState;
  impact: IncidentImpact;
  isScheduled: boolean;
  affectedComponentNames: string[];
  latestUpdateBody: string | null;
};

export type HistoryIncidentsMonth = {
  year: number;
  month: number; // 0-indexed (matches Date.getUTCMonth)
  incidents: HistoryIncidentSummary[];
};

type Props = {
  uptimeData: HistoryUptimeRow[];
  incidentsData: HistoryIncidentsMonth[];
};

/**
 * Vercel-style underlined tabs. The shadcn `Tabs` primitive already ships
 * a `variant="line"` that does exactly this - underline animates beneath
 * the active tab via an `after:` pseudo-element on the trigger. We add a
 * `border-b` divider on the list so the underline reads as the active
 * indicator, not a floating rectangle.
 */
export function HistoryTabs({ uptimeData, incidentsData }: Props) {
  return (
    <Tabs defaultValue="incidents" className="space-y-6">
      <TabsList variant="line" className="border-border w-fit border-b pb-1">
        <TabsTrigger value="incidents" className="cursor-pointer px-4">
          Incidents
        </TabsTrigger>
        <TabsTrigger value="uptime" className="cursor-pointer px-4">
          Uptime
        </TabsTrigger>
      </TabsList>

      <TabsContent value="incidents" className="space-y-8">
        {incidentsData.map((m) => (
          <IncidentMonth key={`${m.year}-${m.month}`} month={m} />
        ))}
      </TabsContent>

      <TabsContent value="uptime">
        <UptimeCalendar components={uptimeData} />
      </TabsContent>
    </Tabs>
  );
}

// ── Incidents tab ─────────────────────────────────────────────────────────────

function IncidentMonth({ month }: { month: HistoryIncidentsMonth }) {
  return (
    <section>
      <h2 className="text-foreground border-border border-b pb-2 text-base font-semibold">
        {formatMonthHeader(month.year, month.month)}
      </h2>
      {month.incidents.length === 0 ? (
        <p className="text-muted-foreground mt-3 text-xs italic">
          No incidents reported for this month.
        </p>
      ) : (
        <ul className="mt-4 space-y-4">
          {month.incidents.map((inc) => (
            <li key={inc.id}>
              <Link href={`/incidents/${inc.slug}`} className="group block">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-foreground group-hover:text-primary text-sm font-medium transition-colors">
                    {inc.title}
                  </h3>
                  <IncidentStateBadge state={inc.currentState} />
                  <ImpactBadge impact={inc.impact} />
                  {inc.isScheduled && (
                    <span className="rounded-full bg-sky-500/10 px-2 py-0.5 text-[11px] text-sky-500">
                      scheduled
                    </span>
                  )}
                </div>
                {inc.affectedComponentNames.length > 0 && (
                  <p className="text-muted-foreground mt-1 text-xs">
                    Affecting: {inc.affectedComponentNames.join(", ")}
                  </p>
                )}
                {inc.latestUpdateBody && (
                  <p className="text-muted-foreground mt-1.5 line-clamp-2 text-sm">
                    {inc.latestUpdateBody}
                  </p>
                )}
                <p className="text-muted-foreground mt-1.5 text-[11px]">
                  {formatTimestamp(inc.startedAtIso, inc.resolvedAtIso)}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// ── Helpers + tiny shared badges ──────────────────────────────────────────────

function formatMonthHeader(year: number, month: number): string {
  return new Date(Date.UTC(year, month, 1)).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    timeZone: "UTC",
  });
}

function formatTimestamp(startedAtIso: string, resolvedAtIso: string | null): string {
  const start = new Date(startedAtIso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  if (!resolvedAtIso) return `Started ${start} · ongoing`;
  const end = new Date(resolvedAtIso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${start} – ${end}`;
}

function IncidentStateBadge({ state }: { state: IncidentState }) {
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

function ImpactBadge({ impact }: { impact: IncidentImpact }) {
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
