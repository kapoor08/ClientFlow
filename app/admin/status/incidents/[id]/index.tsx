"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import type { AdminIncidentDetail } from "@/server/admin/status-incidents";
import type { AdminStatusComponent } from "@/server/admin/status-components";
import { Timeline, STATE_BADGE } from "@/components/admin/status/incident-detail/Timeline";
import { AddUpdateBlock } from "@/components/admin/status/incident-detail/AddUpdateBlock";
import { ResolveBlock } from "@/components/admin/status/incident-detail/ResolveBlock";

type Props = {
  detail: AdminIncidentDetail;
  components: AdminStatusComponent[];
};

export default function AdminIncidentDetailPage({ detail, components }: Props) {
  const { incident, updates, componentIds } = detail;
  const router = useRouter();
  const isResolved = !!incident.resolvedAt;
  const componentNameById = new Map(components.map((c) => [c.id, c.name]));

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/admin/status/incidents"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm"
        >
          <ArrowLeft size={14} /> All incidents
        </Link>
      </div>

      <header className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <h1 className="font-display text-foreground text-2xl font-bold">{incident.title}</h1>
          <span
            className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATE_BADGE[incident.currentState]}`}
          >
            {incident.currentState}
          </span>
        </div>
        <div className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 text-xs">
          <span>Started {new Date(incident.startedAt!).toLocaleString()}</span>
          {incident.resolvedAt && (
            <span>Resolved {new Date(incident.resolvedAt).toLocaleString()}</span>
          )}
          <span>Impact: {incident.impact}</span>
          {incident.isScheduled && <span>Scheduled maintenance</span>}
          {incident.isAutoOpened && <span>Auto-opened</span>}
          <span>
            Slug: <code className="font-mono">{incident.slug}</code>
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {componentIds.map((id) => (
            <span
              key={id}
              className="bg-secondary text-foreground rounded-full px-2 py-0.5 text-xs"
            >
              {componentNameById.get(id) ?? id}
            </span>
          ))}
        </div>
      </header>

      <Timeline updates={updates} />

      {!isResolved && (
        <>
          <AddUpdateBlock incidentId={incident.id} onSuccess={() => router.refresh()} />
          <ResolveBlock incidentId={incident.id} onSuccess={() => router.refresh()} />
        </>
      )}
    </div>
  );
}
