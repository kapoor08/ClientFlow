import Link from "next/link";
import { CheckCircle2, AlertTriangle, XCircle, Wrench, MinusCircle } from "lucide-react";
import {
  listActiveComponents,
  listActiveIncidents,
  listRecentResolvedIncidents,
  deriveBannerState,
  latestStateUpdate,
  type BannerState,
  type PublicComponent,
  type PublicIncidentSummary,
} from "@/server/status/queries";
import { getUptimeBarsByComponent, type UptimeBarDay } from "@/server/status/uptime-bars";
import { SubscribeForm } from "@/components/status/SubscribeForm";
import type { ComponentState, IncidentImpact, IncidentState } from "@/db/schemas/status";

/**
 * Public status page. Reads from the prober's cached `currentState` plus the
 * incidents tables - one indexed SELECT per section, no recomputation. ISR
 * with revalidate=60 means each unique URL is rendered at most once per
 * minute (admin posts also call `revalidatePath('/status')` for instant
 * cache busts).
 */
export const revalidate = 60;

export default async function StatusPage() {
  const [components, activeIncidents, recentIncidents] = await Promise.all([
    listActiveComponents(),
    listActiveIncidents(),
    listRecentResolvedIncidents(),
  ]);
  const banner = deriveBannerState(components);
  const lastUpdate = latestStateUpdate(components);
  const barsByComponent =
    components.length > 0
      ? await getUptimeBarsByComponent(components.map((c) => c.id))
      : new Map<string, UptimeBarDay[]>();

  return (
    <div className="space-y-10">
      <Banner state={banner} lastUpdate={lastUpdate} />
      {activeIncidents.length > 0 && (
        <IncidentsSection title="Active incidents" incidents={activeIncidents} />
      )}
      <ComponentList components={components} barsByComponent={barsByComponent} />
      {recentIncidents.length > 0 && (
        <IncidentsSection title="Recent history" incidents={recentIncidents} subdued />
      )}
      <SubscribeForm />
    </div>
  );
}

// ── Banner ─────────────────────────────────────────────────────────────────────

function Banner({ state, lastUpdate }: { state: BannerState; lastUpdate: Date | null }) {
  const conf = BANNER_CONFIG[state];
  const Icon = conf.icon;

  return (
    <section
      className={`rounded-2xl border ${conf.borderClass} ${conf.bgClass} p-6`}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-4">
        <Icon size={28} className={`mt-0.5 shrink-0 ${conf.iconClass}`} aria-hidden />
        <div className="min-w-0 flex-1">
          <h1 className="text-foreground text-2xl font-semibold">{conf.title}</h1>
          <p className="text-muted-foreground mt-1 text-sm">{conf.subtitle}</p>
          {lastUpdate ? (
            <p className="text-muted-foreground mt-3 text-xs">
              Last checked {formatRelative(lastUpdate)}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}

const BANNER_CONFIG: Record<
  BannerState,
  {
    title: string;
    subtitle: string;
    icon: typeof CheckCircle2;
    bgClass: string;
    borderClass: string;
    iconClass: string;
  }
> = {
  operational: {
    title: "All Systems Operational",
    subtitle: "All ClientFlow services are responding normally.",
    icon: CheckCircle2,
    bgClass: "bg-emerald-500/5",
    borderClass: "border-emerald-500/20",
    iconClass: "text-emerald-500",
  },
  degraded: {
    title: "Some Systems Degraded",
    subtitle:
      "One or more services are responding slowly or returning intermittent errors. Investigation in progress.",
    icon: AlertTriangle,
    bgClass: "bg-amber-500/5",
    borderClass: "border-amber-500/20",
    iconClass: "text-amber-500",
  },
  outage: {
    title: "Major Outage",
    subtitle:
      "One or more services are currently unavailable. Our team is actively working on a fix.",
    icon: XCircle,
    bgClass: "bg-red-500/5",
    borderClass: "border-red-500/20",
    iconClass: "text-red-500",
  },
  maintenance: {
    title: "Scheduled Maintenance",
    subtitle: "Planned maintenance is in progress. Some services may be briefly unavailable.",
    icon: Wrench,
    bgClass: "bg-sky-500/5",
    borderClass: "border-sky-500/20",
    iconClass: "text-sky-500",
  },
};

// ── Components list ────────────────────────────────────────────────────────────

function ComponentList({
  components,
  barsByComponent,
}: {
  components: PublicComponent[];
  barsByComponent: Map<string, UptimeBarDay[]>;
}) {
  if (components.length === 0) {
    return (
      <section>
        <h2 className="text-foreground text-lg font-semibold">Services</h2>
        <p className="border-border bg-card text-muted-foreground mt-4 rounded-xl border p-6 text-sm">
          No services configured yet.
        </p>
      </section>
    );
  }

  return (
    <section>
      <h2 className="text-foreground text-lg font-semibold">Services</h2>
      <ul className="border-border bg-card divide-border mt-4 divide-y overflow-hidden rounded-xl border">
        {components.map((c) => (
          <li key={c.id} className="space-y-3 px-5 py-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-foreground text-sm font-medium">{c.name}</p>
                {c.description ? (
                  <p className="text-muted-foreground mt-0.5 text-xs">{c.description}</p>
                ) : null}
              </div>
              <StatePill state={c.currentState} />
            </div>
            <UptimeBar bars={barsByComponent.get(c.id) ?? []} />
          </li>
        ))}
      </ul>
    </section>
  );
}

// ── Uptime bar (90-day) ────────────────────────────────────────────────────────

function UptimeBar({ bars }: { bars: UptimeBarDay[] }) {
  if (bars.length === 0) return null;

  const known = bars.filter((b) => b.totalChecks > 0 && b.uptimeBp != null);
  const avgUptimeBp =
    known.length > 0
      ? Math.round(known.reduce((sum, b) => sum + (b.uptimeBp ?? 0), 0) / known.length)
      : null;

  return (
    <div>
      <div className="text-muted-foreground mb-1.5 flex items-center justify-between text-[10px]">
        <span>90 days ago</span>
        <span>{avgUptimeBp != null ? `${(avgUptimeBp / 100).toFixed(2)}% uptime` : "No data"}</span>
        <span>Today</span>
      </div>
      <div className="flex items-center gap-[2px]" role="img" aria-label="90-day uptime history">
        {bars.map((bar) => (
          <BarSegment key={bar.date.getTime()} bar={bar} />
        ))}
      </div>
    </div>
  );
}

function BarSegment({ bar }: { bar: UptimeBarDay }) {
  const conf = BAR_SEGMENT_CONFIG[bar.state];
  const tooltip =
    bar.totalChecks === 0
      ? `${formatDate(bar.date)} — no data`
      : bar.state === "maintenance"
        ? `${formatDate(bar.date)} — maintenance`
        : `${formatDate(bar.date)} — ${((bar.uptimeBp ?? 0) / 100).toFixed(2)}% uptime`;
  return (
    <span
      className={`h-7 min-w-[3px] flex-1 rounded-[1px] ${conf}`}
      title={tooltip}
      aria-label={tooltip}
    />
  );
}

const BAR_SEGMENT_CONFIG: Record<ComponentState, string> = {
  operational: "bg-emerald-500",
  degraded: "bg-amber-500",
  outage: "bg-red-500",
  maintenance: "bg-sky-500",
  unknown: "bg-muted",
};

function formatDate(date: Date): string {
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// ── Incidents ──────────────────────────────────────────────────────────────────

function IncidentsSection({
  title,
  incidents,
  subdued,
}: {
  title: string;
  incidents: PublicIncidentSummary[];
  subdued?: boolean;
}) {
  return (
    <section>
      <h2 className="text-foreground text-lg font-semibold">{title}</h2>
      <ul className="mt-4 space-y-3">
        {incidents.map((inc) => (
          <li key={inc.id}>
            <Link
              href={`/incidents/${inc.slug}`}
              className={`border-border bg-card hover:border-foreground/30 block rounded-xl border p-5 transition-colors ${subdued ? "opacity-90" : ""}`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-foreground text-sm font-medium">{inc.title}</h3>
                <IncidentStateBadge state={inc.currentState} />
                <ImpactBadge impact={inc.impact} />
                {inc.isScheduled && (
                  <span className="rounded-full bg-sky-500/10 px-2 py-0.5 text-[11px] text-sky-500">
                    scheduled
                  </span>
                )}
              </div>
              {inc.affectedComponentNames.length > 0 && (
                <p className="text-muted-foreground mt-1.5 text-xs">
                  Affecting: {inc.affectedComponentNames.join(", ")}
                </p>
              )}
              {inc.latestUpdateBody && (
                <p className="text-muted-foreground mt-2 line-clamp-2 text-sm">
                  {inc.latestUpdateBody}
                </p>
              )}
              <p className="text-muted-foreground mt-2 text-[11px]">
                {inc.resolvedAt
                  ? `Resolved ${formatRelative(inc.resolvedAt)}`
                  : `Started ${formatRelative(inc.startedAt)}`}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

// ── Pills ──────────────────────────────────────────────────────────────────────

function StatePill({ state }: { state: ComponentState }) {
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

// ── Utils ──────────────────────────────────────────────────────────────────────

function formatRelative(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 30) return "just now";
  if (seconds < 60) return `${seconds} seconds ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}
