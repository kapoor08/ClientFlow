"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, type Resolver, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ControlledTextarea, ControlledSelect } from "@/components/form";
import { toast } from "sonner";
import {
  addUpdateSchema,
  resolveIncidentSchema,
  INCIDENT_STATES,
  type AddUpdateValues,
  type ResolveIncidentValues,
} from "@/schemas/admin/status-incidents";
import {
  addIncidentUpdateAction,
  resolveIncidentAction,
} from "@/server/actions/admin/status-incidents";
import type { AdminIncidentDetail } from "@/server/admin/status-incidents";
import type { AdminStatusComponent } from "@/server/admin/status-components";
import type { IncidentState } from "@/db/schemas/status";

type Props = {
  detail: AdminIncidentDetail;
  components: AdminStatusComponent[];
};

const STATE_BADGE: Record<IncidentState, string> = {
  investigating: "bg-amber-500/10 text-amber-500",
  identified: "bg-orange-500/10 text-orange-500",
  monitoring: "bg-sky-500/10 text-sky-500",
  resolved: "bg-emerald-500/10 text-emerald-500",
};

const STATE_OPTIONS = INCIDENT_STATES.filter((s) => s !== "resolved").map((s) => ({
  value: s,
  label: s.charAt(0).toUpperCase() + s.slice(1),
}));

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

function Timeline({ updates }: { updates: AdminIncidentDetail["updates"] }) {
  return (
    <section>
      <h2 className="text-foreground mb-3 text-sm font-semibold">Timeline</h2>
      <ol className="border-border bg-card divide-border divide-y overflow-hidden rounded-xl border">
        {updates.map((u) => (
          <li key={u.id} className="space-y-1 px-5 py-4">
            <div className="flex items-center gap-2 text-xs">
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 font-medium ${STATE_BADGE[u.stateAtPost]}`}
              >
                {u.stateAtPost}
              </span>
              <span className="text-muted-foreground">
                {new Date(u.createdAt).toLocaleString()}
              </span>
            </div>
            <p className="text-foreground text-sm whitespace-pre-wrap">{u.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

function AddUpdateBlock({ incidentId, onSuccess }: { incidentId: string; onSuccess: () => void }) {
  const [isPending, startTransition] = useTransition();
  const form = useForm<AddUpdateValues>({
    resolver: zodResolver(addUpdateSchema) as Resolver<AddUpdateValues>,
    defaultValues: { body: "", stateAtPost: "investigating" },
  });
  const onSubmit: SubmitHandler<AddUpdateValues> = (values) => {
    startTransition(async () => {
      const result = await addIncidentUpdateAction(incidentId, values);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Update posted.");
      form.reset();
      onSuccess();
    });
  };
  return (
    <section>
      <h2 className="text-foreground mb-3 text-sm font-semibold">Post update</h2>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="border-border bg-card space-y-4 rounded-xl border p-5"
      >
        <ControlledSelect
          control={form.control}
          name="stateAtPost"
          label="New state"
          options={STATE_OPTIONS}
        />
        <ControlledTextarea
          control={form.control}
          name="body"
          label="Update"
          placeholder="We've identified the root cause and are deploying a fix."
        />
        <div className="flex justify-end">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Posting..." : "Post update"}
          </Button>
        </div>
      </form>
    </section>
  );
}

function ResolveBlock({ incidentId, onSuccess }: { incidentId: string; onSuccess: () => void }) {
  const [isPending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const form = useForm<ResolveIncidentValues>({
    resolver: zodResolver(resolveIncidentSchema) as Resolver<ResolveIncidentValues>,
    defaultValues: { body: "" },
  });
  const onSubmit: SubmitHandler<ResolveIncidentValues> = (values) => {
    startTransition(async () => {
      const result = await resolveIncidentAction(incidentId, values);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Incident resolved.");
      onSuccess();
    });
  };

  if (!confirming) {
    return (
      <div className="flex justify-end">
        <Button variant="default" onClick={() => setConfirming(true)} className="gap-1.5">
          <CheckCircle2 size={14} /> Resolve incident
        </Button>
      </div>
    );
  }

  return (
    <section>
      <h2 className="text-foreground mb-3 text-sm font-semibold">Resolve incident</h2>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5"
      >
        <ControlledTextarea
          control={form.control}
          name="body"
          label="Resolution note (optional)"
          placeholder="Fix has been deployed and verified. Customers should see normal performance."
        />
        <div className="flex justify-end gap-2">
          <Button variant="outline" type="button" onClick={() => setConfirming(false)}>
            Cancel
          </Button>
          <Button variant="default" type="submit" disabled={isPending}>
            {isPending ? "Resolving..." : "Confirm resolve"}
          </Button>
        </div>
      </form>
    </section>
  );
}
