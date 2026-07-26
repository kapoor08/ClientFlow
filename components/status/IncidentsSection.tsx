import Link from "next/link";
import type { PublicIncidentSummary } from "@/server/status/queries";
import { IncidentStateBadge, ImpactBadge } from "./StatusBadges";
import { formatRelative } from "./format";

export function IncidentsSection({
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
