import type { IncidentState } from "@/db/schemas/status";
import type { AdminIncidentDetail } from "@/server/admin/status-incidents";

export const STATE_BADGE: Record<IncidentState, string> = {
  investigating: "bg-amber-500/10 text-amber-500",
  identified: "bg-orange-500/10 text-orange-500",
  monitoring: "bg-sky-500/10 text-sky-500",
  resolved: "bg-emerald-500/10 text-emerald-500",
};

/** Admin incident state pill (header uses the larger px-2.5 variant inline). */
export function StateBadge({ state }: { state: IncidentState }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATE_BADGE[state]}`}
    >
      {state}
    </span>
  );
}

export function Timeline({ updates }: { updates: AdminIncidentDetail["updates"] }) {
  return (
    <section>
      <h2 className="text-foreground mb-3 text-sm font-semibold">Timeline</h2>
      <ol className="border-border bg-card divide-border divide-y overflow-hidden rounded-xl border">
        {updates.map((u) => (
          <li key={u.id} className="space-y-1 px-5 py-4">
            <div className="flex items-center gap-2 text-xs">
              <StateBadge state={u.stateAtPost} />
              <span className="text-muted-foreground">{new Date(u.createdAt).toLocaleString()}</span>
            </div>
            <p className="text-foreground text-sm whitespace-pre-wrap">{u.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
