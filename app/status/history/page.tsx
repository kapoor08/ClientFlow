import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { listActiveComponents, listIncidentsByMonth } from "@/server/status/queries";
import { getUptimeBarsByComponent, type UptimeBarDay } from "@/server/status/uptime-bars";
import { HistoryTabs } from "@/components/status/HistoryTabs";
import type { UptimeBarDayClient } from "@/components/status/UptimeBars";

/**
 * Historical view at /history.
 *
 * Two tabs (mirrors Atlassian Statuspage layout):
 *   - Incidents: month-grouped archive of every incident, including empty
 *     months so the timeline reads continuously.
 *   - Uptime: per-component 90-day bar history with hover details. Same
 *     data as the index page but laid out for browsing rather than
 *     summary glance.
 *
 * Both tabs render server-side; the client wrapper just toggles which one
 * is visible. Keeps the page fast and SEO-friendly.
 */
export const revalidate = 60;

const HISTORY_MONTHS = 6;

export default async function HistoryPage() {
  const [components, monthlyIncidents] = await Promise.all([
    listActiveComponents(),
    listIncidentsByMonth(HISTORY_MONTHS),
  ]);

  const barsByComponent: Map<string, UptimeBarDay[]> =
    components.length > 0 ? await getUptimeBarsByComponent(components.map((c) => c.id)) : new Map();

  // Serialize Date → ISO at the server boundary so the client tab component
  // can safely accept the payload without rehydration mismatches.
  const uptimeData = components.map((c) => {
    const bars = barsByComponent.get(c.id) ?? [];
    const known = bars.filter((b) => b.totalChecks > 0 && b.uptimeBp != null);
    const avgUptimeBp =
      known.length > 0
        ? Math.round(known.reduce((sum, b) => sum + (b.uptimeBp ?? 0), 0) / known.length)
        : null;
    const clientBars: UptimeBarDayClient[] = bars.map((b) => ({
      dateIso: b.date.toISOString(),
      state: b.state,
      uptimeBp: b.uptimeBp,
      totalChecks: b.totalChecks,
    }));
    return {
      id: c.id,
      name: c.name,
      description: c.description,
      averageUptimeLabel:
        avgUptimeBp != null ? `${(avgUptimeBp / 100).toFixed(2)}% uptime` : "No data",
      bars: clientBars,
    };
  });

  const incidentsData = monthlyIncidents.map((m) => ({
    year: m.year,
    month: m.month,
    incidents: m.incidents.map((inc) => ({
      id: inc.id,
      slug: inc.slug,
      title: inc.title,
      startedAtIso: inc.startedAt.toISOString(),
      resolvedAtIso: inc.resolvedAt ? inc.resolvedAt.toISOString() : null,
      currentState: inc.currentState,
      impact: inc.impact,
      isScheduled: inc.isScheduled,
      affectedComponentNames: inc.affectedComponentNames,
      latestUpdateBody: inc.latestUpdateBody,
    })),
  }));

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
        >
          <ArrowLeft size={14} /> Current status
        </Link>
      </div>

      <header>
        <h1 className="text-foreground text-2xl font-semibold">History</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Past {HISTORY_MONTHS} months of incidents and uptime.
        </p>
      </header>

      <HistoryTabs uptimeData={uptimeData} incidentsData={incidentsData} />
    </div>
  );
}
