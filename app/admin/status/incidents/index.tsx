"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { IncidentFormDialog } from "@/components/admin/status/IncidentFormDialog";
import { TipButton, TooltipProvider } from "@/components/data-table/RowActions";
import { deleteIncidentAction } from "@/server/actions/admin/status-incidents";
import { toast } from "sonner";
import type { AdminIncidentSummary } from "@/server/admin/status-incidents";
import type { AdminStatusComponent } from "@/server/admin/status-components";
import type { IncidentImpact, IncidentState } from "@/db/schemas/status";

type Props = {
  incidents: AdminIncidentSummary[];
  components: AdminStatusComponent[];
};

const STATE_BADGE: Record<IncidentState, string> = {
  investigating: "bg-amber-500/10 text-amber-500",
  identified: "bg-orange-500/10 text-orange-500",
  monitoring: "bg-sky-500/10 text-sky-500",
  resolved: "bg-emerald-500/10 text-emerald-500",
};

const IMPACT_BADGE: Record<IncidentImpact, string> = {
  none: "bg-muted text-muted-foreground",
  minor: "bg-amber-500/10 text-amber-500",
  major: "bg-orange-500/10 text-orange-500",
  critical: "bg-red-500/10 text-red-500",
};

export default function AdminIncidentsPage({ incidents, components }: Props) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Delete incident "${title}"? Updates and component links will be removed.`)) {
      return;
    }
    const result = await deleteIncidentAction(id);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Incident deleted.");
      router.refresh();
    }
  }

  const active = incidents.filter((i) => !i.resolvedAt);
  const resolved = incidents.filter((i) => i.resolvedAt);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-foreground text-2xl font-bold">Status Incidents</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Open and track incidents that affect the public status page.
          </p>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          disabled={components.length === 0}
          className="gap-1.5"
        >
          <Plus size={14} />
          New incident
        </Button>
      </div>

      {components.length === 0 && (
        <div className="mb-6 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm">
          <p className="text-foreground">
            No status components yet. Create at least one component before opening an incident -{" "}
            <Link href="/admin/status/components" className="underline">
              go to Components
            </Link>
            .
          </p>
        </div>
      )}

      <Section title="Active" rows={active} onDelete={handleDelete} empty="No active incidents." />
      <div className="mt-10">
        <Section
          title="Resolved"
          rows={resolved}
          onDelete={handleDelete}
          empty="No resolved incidents yet."
        />
      </div>

      <IncidentFormDialog open={createOpen} onOpenChange={setCreateOpen} components={components} />
    </div>
  );
}

function Section({
  title,
  rows,
  onDelete,
  empty,
}: {
  title: string;
  rows: AdminIncidentSummary[];
  onDelete: (id: string, title: string) => void;
  empty: string;
}) {
  return (
    <section>
      <h2 className="text-foreground mb-3 text-sm font-semibold">{title}</h2>
      {rows.length === 0 ? (
        <p className="border-border bg-card text-muted-foreground rounded-xl border p-4 text-sm">
          {empty}
        </p>
      ) : (
        <div className="border-border bg-card overflow-hidden rounded-xl border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-border bg-secondary/50 border-b">
                <th className="text-muted-foreground px-4 py-3 text-left text-xs font-semibold">
                  Title
                </th>
                <th className="text-muted-foreground hidden px-4 py-3 text-left text-xs font-semibold md:table-cell">
                  Components
                </th>
                <th className="text-muted-foreground px-4 py-3 text-left text-xs font-semibold">
                  State
                </th>
                <th className="text-muted-foreground px-4 py-3 text-left text-xs font-semibold">
                  Impact
                </th>
                <th className="text-muted-foreground hidden px-4 py-3 text-left text-xs font-semibold sm:table-cell">
                  Started
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map((inc) => (
                <tr key={inc.id} className="border-border border-b last:border-b-0">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/status/incidents/${inc.id}`}
                      className="text-foreground font-medium hover:underline"
                    >
                      {inc.title}
                    </Link>
                    {inc.isScheduled && (
                      <span className="ml-2 rounded-full bg-sky-500/10 px-1.5 py-0.5 text-[10px] text-sky-500">
                        scheduled
                      </span>
                    )}
                    {inc.isAutoOpened && (
                      <span className="bg-secondary text-muted-foreground ml-2 rounded-full px-1.5 py-0.5 text-[10px]">
                        auto
                      </span>
                    )}
                  </td>
                  <td className="hidden px-4 py-3 md:table-cell">
                    <p className="text-muted-foreground text-xs">
                      {inc.componentNames.join(", ") || "—"}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATE_BADGE[inc.currentState]}`}
                    >
                      {inc.currentState}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${IMPACT_BADGE[inc.impact]}`}
                    >
                      {inc.impact}
                    </span>
                  </td>
                  <td className="text-muted-foreground hidden px-4 py-3 text-xs sm:table-cell">
                    {inc.startedAt ? new Date(inc.startedAt).toLocaleString() : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <TooltipProvider>
                      <TipButton
                        label="Delete"
                        onClick={() => onDelete(inc.id, inc.title)}
                        variant="danger"
                      >
                        <Trash2 size={14} />
                      </TipButton>
                    </TooltipProvider>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
