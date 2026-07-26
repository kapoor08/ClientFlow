import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getIncidentBySlug } from "@/server/status/queries";
import {
  TimelineNode,
  IncidentStateBadge,
  ImpactBadge,
} from "@/components/status/incident-detail/IncidentTimeline";

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

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours < 24) return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
}

export default async function IncidentDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const incident = await getIncidentBySlug(slug);
  if (!incident) notFound();

  // Updates come back newest-first from the query - perfect for a "latest at
  // the top" timeline that matches Atlassian/Statuspage convention.
  const updates = incident.updates;
  const durationMinutes = incident.resolvedAt
    ? Math.max(
        1,
        Math.round((incident.resolvedAt.getTime() - incident.startedAt.getTime()) / 60_000),
      )
    : null;

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
        >
          <ArrowLeft size={14} /> Back to status
        </Link>
      </div>

      <header className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-foreground text-2xl font-semibold">{incident.title}</h1>
          <IncidentStateBadge state={incident.currentState} />
        </div>
        <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
          <span>
            <span className="text-foreground font-medium">Started:</span>{" "}
            {new Date(incident.startedAt).toLocaleString()}
          </span>
          {incident.resolvedAt && (
            <span>
              <span className="text-foreground font-medium">Resolved:</span>{" "}
              {new Date(incident.resolvedAt).toLocaleString()}
            </span>
          )}
          {durationMinutes != null && (
            <span>
              <span className="text-foreground font-medium">Duration:</span>{" "}
              {formatDuration(durationMinutes)}
            </span>
          )}
          <span className="inline-flex items-center gap-1.5">
            <span className="text-foreground font-medium">Impact:</span>{" "}
            <ImpactBadge impact={incident.impact} />
          </span>
          {incident.isScheduled && (
            <span className="rounded-full bg-sky-500/10 px-2 py-0.5 text-sky-500">
              scheduled maintenance
            </span>
          )}
        </div>
        {incident.affectedComponentNames.length > 0 && (
          <p className="text-muted-foreground text-xs">
            <span className="text-foreground font-medium">Affecting:</span>{" "}
            {incident.affectedComponentNames.join(", ")}
          </p>
        )}
      </header>

      <section>
        <h2 className="text-foreground mb-5 text-sm font-semibold">Update timeline</h2>

        {updates.length === 0 ? (
          <p className="text-muted-foreground border-border bg-card rounded-xl border p-5 text-sm">
            No updates posted yet.
          </p>
        ) : (
          <ol className="relative space-y-6 pl-6">
            {/* Vertical rail line that runs through every node. The last
                update gets the rail clipped above its dot to look "open"
                (it's the most recent state, nothing after). */}
            <span className="bg-border absolute top-1.5 bottom-1.5 left-[7px] w-px" aria-hidden />
            {updates.map((u, idx) => (
              <TimelineNode
                key={u.id}
                state={u.stateAtPost}
                body={u.body}
                createdAt={new Date(u.createdAt)}
                isLatest={idx === 0}
              />
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
