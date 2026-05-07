"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LocalDataTable, type ColumnDef } from "@/components/data-table";
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

const STATE_OPTIONS = (Object.keys(STATE_BADGE) as ComponentState[]).map((s) => ({
  value: s,
  label: s.charAt(0).toUpperCase() + s.slice(1),
}));

const ACTIVE_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

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

  // Move up/down depends on the row's position in the *full* ordered list,
  // not the paginated slice - capture that mapping once.
  const positionById = useMemo(() => {
    const m = new Map<string, { isFirst: boolean; isLast: boolean }>();
    components.forEach((c, i) => {
      m.set(c.id, { isFirst: i === 0, isLast: i === components.length - 1 });
    });
    return m;
  }, [components]);

  const columns: ColumnDef<AdminStatusComponent>[] = [
    {
      key: "actions",
      header: "Actions",
      headerClassName: "w-0",
      className: "text-right",
      cell: (c) => {
        const pos = positionById.get(c.id) ?? { isFirst: false, isLast: false };
        return <ComponentActions component={c} isFirst={pos.isFirst} isLast={pos.isLast} />;
      },
    },
    {
      key: "name",
      header: "Name",
      sortable: true,
      cell: (c) => (
        <div>
          <p className="text-foreground font-medium">
            {c.name}{" "}
            {!c.isActive && (
              <span className="bg-secondary text-muted-foreground ml-1 rounded-full px-1.5 py-0.5 text-[10px]">
                inactive
              </span>
            )}
          </p>
          <p className="text-muted-foreground font-mono text-xs">{c.slug}</p>
        </div>
      ),
    },
    {
      key: "probe",
      header: "Probe",
      hideOnTablet: true,
      cell: (c) => (
        <p className="text-muted-foreground font-mono text-xs">{describeProbe(c.probeConfig)}</p>
      ),
    },
    {
      key: "currentState",
      header: "Current state",
      sortable: true,
      cell: (c) => (
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATE_BADGE[c.currentState]}`}
        >
          {c.currentState}
        </span>
      ),
    },
  ];

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

      <LocalDataTable
        data={components}
        columns={columns}
        getRowKey={(c) => c.id}
        searchPlaceholder="Search by name or slug…"
        searchAccessor={(c) => `${c.name} ${c.slug}`}
        sortAccessors={{
          name: (c) => c.name,
          currentState: (c) => c.currentState,
        }}
        filters={[
          {
            key: "state",
            label: "State",
            options: STATE_OPTIONS,
            match: (c, v) => c.currentState === v,
          },
          {
            key: "active",
            label: "Active",
            options: ACTIVE_OPTIONS,
            match: (c, v) => (v === "active" ? c.isActive : !c.isActive),
          },
        ]}
        emptyTitle="No status components yet."
        emptyDescription="Create one to start probing it."
      />

      <ComponentFormDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
