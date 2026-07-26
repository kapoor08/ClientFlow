"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { IncidentFormDialog } from "@/components/admin/status/IncidentFormDialog";
import { IncidentsTable } from "@/components/admin/status/IncidentsTable";
import { deleteIncidentAction } from "@/server/actions/admin/status-incidents";
import { toast } from "sonner";
import type { AdminIncidentSummary } from "@/server/admin/status-incidents";
import type { AdminStatusComponent } from "@/server/admin/status-components";

type Props = {
  incidents: AdminIncidentSummary[];
  components: AdminStatusComponent[];
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

      <IncidentsTable
        title="Active"
        rows={active}
        onDelete={handleDelete}
        empty="No active incidents."
      />
      <div className="mt-10">
        <IncidentsTable
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
