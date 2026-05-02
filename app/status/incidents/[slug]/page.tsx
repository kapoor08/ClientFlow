import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getIncidentBySlug } from "@/server/status/queries";
import type { IncidentImpact, IncidentState } from "@/db/schemas/status";

/**
 * Public incident detail page.
 *
 * Reached via `/incidents/<slug>` on the status subdomain (middleware
 * rewrites that to `/status/incidents/<slug>` internally). Same ISR cadence
 * as the index; admin posts revalidate this exact path so edits propagate
 * without waiting on the next tick.
 */
export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const incident = await getIncidentBySlug(slug);
  return {
    title: incident ? incident.title : "Incident",
  };
}

export default async function IncidentDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const incident = await getIncidentBySlug(slug);
  if (!incident) notFound();

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm"
        >
          <ArrowLeft size={14} /> Back to status
        </Link>
      </div>

      <header className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <h1 className="font-display text-foreground text-2xl font-bold">{incident.title}</h1>
          <IncidentStateBadge state={incident.currentState} />
        </div>
        <div className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 text-xs">
          <span>Started {new Date(incident.startedAt).toLocaleString()}</span>
          {incident.resolvedAt && (
            <span>Resolved {new Date(incident.resolvedAt).toLocaleString()}</span>
          )}
          <span>
            Impact: <ImpactBadge impact={incident.impact} />
          </span>
          {incident.isScheduled && (
            <span className="rounded-full bg-sky-500/10 px-2 py-0.5 text-sky-500">
              scheduled maintenance
            </span>
          )}
        </div>
        {incident.affectedComponentNames.length > 0 && (
          <p className="text-muted-foreground text-xs">
            Affecting: {incident.affectedComponentNames.join(", ")}
          </p>
        )}
      </header>

      <section>
        <h2 className="text-foreground mb-3 text-sm font-semibold">Updates</h2>
        <ol className="border-border bg-card divide-border divide-y overflow-hidden rounded-xl border">
          {incident.updates.map((u) => (
            <li key={u.id} className="space-y-1 px-5 py-4">
              <div className="flex items-center gap-2 text-xs">
                <IncidentStateBadge state={u.stateAtPost} />
                <span className="text-muted-foreground">
                  {new Date(u.createdAt).toLocaleString()}
                </span>
              </div>
              <p className="text-foreground text-sm whitespace-pre-wrap">{u.body}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

function IncidentStateBadge({ state }: { state: IncidentState }) {
  const cls: Record<IncidentState, string> = {
    investigating: "bg-amber-500/10 text-amber-500",
    identified: "bg-orange-500/10 text-orange-500",
    monitoring: "bg-sky-500/10 text-sky-500",
    resolved: "bg-emerald-500/10 text-emerald-500",
  };
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cls[state]}`}
    >
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
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${cls[impact]}`}>
      {impact}
    </span>
  );
}
