"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ComponentFormDialog, ComponentActions } from "@/components/admin/status";
import type { AdminStatusComponent } from "@/server/admin/status-components";
import type { ComponentState, ProbeConfig } from "@/db/schemas/status";

type Props = { components: AdminStatusComponent[] };

const STATE_BADGE: Record<ComponentState, string> = {
  operational: "bg-emerald-500/10 text-emerald-500",
  degraded: "bg-amber-500/10 text-amber-500",
  outage: "bg-red-500/10 text-red-500",
  maintenance: "bg-sky-500/10 text-sky-500",
  unknown: "bg-muted text-muted-foreground",
};

function describeProbe(config: ProbeConfig): string {
  if (config.kind === "http") {
    return `HTTP ${config.method} ${config.url} → ${config.expectedStatus}`;
  }
  if (config.kind === "stripe_balance") {
    return "Stripe balance.retrieve()";
  }
  return `Signal "${config.signalKey}" stale > ${config.staleAfterMin}m`;
}

export default function AdminStatusComponentsPage({ components }: Props) {
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-foreground text-2xl font-bold">Status Components</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Services monitored by the public status page. The probe cron checks each active
            component every minute.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-1.5">
          <Plus size={14} />
          New component
        </Button>
      </div>

      {components.length === 0 ? (
        <div className="border-border bg-card rounded-xl border p-10 text-center">
          <p className="text-muted-foreground text-sm">
            No status components yet. Create one to start probing it.
          </p>
        </div>
      ) : (
        <div className="border-border bg-card overflow-hidden rounded-xl border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-border bg-secondary/50 border-b">
                <th className="text-muted-foreground px-4 py-3 text-left text-xs font-semibold">
                  Name
                </th>
                <th className="text-muted-foreground hidden px-4 py-3 text-left text-xs font-semibold md:table-cell">
                  Probe
                </th>
                <th className="text-muted-foreground px-4 py-3 text-left text-xs font-semibold">
                  Current state
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {components.map((c, i) => (
                <tr key={c.id} className="border-border border-b last:border-b-0">
                  <td className="px-4 py-3">
                    <p className="text-foreground font-medium">
                      {c.name}{" "}
                      {!c.isActive && (
                        <span className="bg-secondary text-muted-foreground ml-1 rounded-full px-1.5 py-0.5 text-[10px]">
                          inactive
                        </span>
                      )}
                    </p>
                    <p className="text-muted-foreground font-mono text-xs">{c.slug}</p>
                  </td>
                  <td className="hidden px-4 py-3 md:table-cell">
                    <p className="text-muted-foreground font-mono text-xs">
                      {describeProbe(c.probeConfig)}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATE_BADGE[c.currentState]}`}
                    >
                      {c.currentState}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <ComponentActions
                      component={c}
                      isFirst={i === 0}
                      isLast={i === components.length - 1}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ComponentFormDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
