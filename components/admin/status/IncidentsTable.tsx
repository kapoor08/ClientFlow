import Link from "next/link";
import { Trash2 } from "lucide-react";
import { TipButton, TooltipProvider } from "@/components/data-table/RowActions";
import type { AdminIncidentSummary } from "@/server/admin/status-incidents";
import type { IncidentImpact, IncidentState } from "@/db/schemas/status";

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

/** A titled table of incidents (Active / Resolved sections on the admin index). */
export function IncidentsTable({
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
