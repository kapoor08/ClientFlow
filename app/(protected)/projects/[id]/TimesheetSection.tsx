"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Clock, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { LogTimeDialog } from "@/components/time-tracking/LogTimeDialog";
import type { TimeEntryItem } from "@/lib/time-entries";

type TimesheetData = {
  entries: TimeEntryItem[];
  summary: { totalMinutes: number; entryCount: number };
};

function formatMinutes(mins: number): string {
  if (mins === 0) return "0h";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function formatDate(d: Date | string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

type RowProps = {
  entry: TimeEntryItem;
  onDeleted: () => void;
};

function TimeEntryRow({ entry, onDeleted }: RowProps) {
  const [busy, setBusy] = useState(false);

  async function handleDelete() {
    setBusy(true);
    try {
      const res = await fetch(`/api/time-entries/${entry.id}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? "Delete failed.");
      }
      toast.success("Time entry deleted.");
      onDeleted();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <tr className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
      <td className="px-4 py-3 text-xs text-muted-foreground">
        {formatDate(entry.loggedAt)}
      </td>
      <td className="px-4 py-3 text-sm font-medium text-foreground">
        {entry.userName}
      </td>
      <td className="hidden px-4 py-3 text-xs text-muted-foreground md:table-cell">
        {entry.taskTitle ?? <span className="italic text-muted-foreground/60">No task</span>}
      </td>
      <td className="px-4 py-3 text-sm font-mono font-medium text-foreground">
        {formatMinutes(entry.minutes)}
      </td>
      <td className="hidden px-4 py-3 text-xs text-muted-foreground md:table-cell">
        {entry.description ?? "—"}
      </td>
      <td className="px-4 py-3 text-right">
        <button
          onClick={handleDelete}
          disabled={busy}
          className="text-muted-foreground hover:text-destructive transition-colors disabled:opacity-40"
          title="Delete entry"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </td>
    </tr>
  );
}

type Props = {
  projectId: string;
};

export function ProjectTimesheetSection({ projectId }: Props) {
  const qc = useQueryClient();
  const [logOpen, setLogOpen] = useState(false);

  const { data, isLoading } = useQuery<TimesheetData>({
    queryKey: ["project-timesheet", projectId],
    queryFn: () =>
      fetch(`/api/projects/${projectId}/time-entries`).then((r) => r.json()),
    staleTime: 0,
  });

  function refresh() {
    qc.invalidateQueries({ queryKey: ["project-timesheet", projectId] });
  }

  const totalMinutes = data?.summary.totalMinutes ?? 0;

  return (
    <div className="rounded-card border border-border bg-card shadow-cf-1">
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <div className="flex items-center gap-2">
          <Clock size={15} className="text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">Time Tracking</span>
          {totalMinutes > 0 && (
            <span className="rounded-pill bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              {formatMinutes(totalMinutes)} total
            </span>
          )}
        </div>
        <Button size="sm" variant="outline" onClick={() => setLogOpen(true)}>
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Log Time
        </Button>
      </div>

      <div className="overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/50">
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">
                Date
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">
                Member
              </th>
              <th className="hidden px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground md:table-cell">
                Task
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">
                Time
              </th>
              <th className="hidden px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground md:table-cell">
                Description
              </th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i} className="border-b border-border last:border-0">
                  <td className="px-4 py-3"><Skeleton className="h-3 w-20" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-3 w-24" /></td>
                  <td className="hidden px-4 py-3 md:table-cell"><Skeleton className="h-3 w-28" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-3 w-12" /></td>
                  <td className="hidden px-4 py-3 md:table-cell"><Skeleton className="h-3 w-32" /></td>
                  <td className="px-4 py-3" />
                </tr>
              ))
            ) : !data?.entries.length ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm text-muted-foreground">
                  No time logged yet.{" "}
                  <button
                    className="text-primary hover:underline"
                    onClick={() => setLogOpen(true)}
                  >
                    Log the first entry
                  </button>
                </td>
              </tr>
            ) : (
              data.entries.map((entry) => (
                <TimeEntryRow
                  key={entry.id}
                  entry={entry}
                  onDeleted={refresh}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      <LogTimeDialog
        open={logOpen}
        onClose={() => setLogOpen(false)}
        onLogged={refresh}
        projectId={projectId}
      />
    </div>
  );
}
