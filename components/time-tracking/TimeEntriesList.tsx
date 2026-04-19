"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2, Loader2, Clock, ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { minutesToEstimate } from "@/components/form";

export type TimeEntryRow = {
  id: string;
  projectId: string;
  taskId: string | null;
  taskTitle: string | null;
  userId: string;
  userName: string;
  minutes: number;
  description: string | null;
  loggedAt: string;
  createdAt: string;
};

type Props = {
  /** When set, lists entries scoped to this task. */
  taskId?: string;
  /** When set (and no taskId), lists entries scoped to this project. */
  projectId?: string;
  /** Current user — used to gate the delete button to entry owners. */
  currentUserId: string;
  /** Collapsed by default — click the header to expand. */
  defaultExpanded?: boolean;
};

export const timeEntriesKeys = {
  byTask: (taskId: string) => ["time-entries", "task", taskId] as const,
  byProject: (projectId: string) => ["time-entries", "project", projectId] as const,
};

function getKey(taskId?: string, projectId?: string) {
  if (taskId) return timeEntriesKeys.byTask(taskId);
  if (projectId) return timeEntriesKeys.byProject(projectId);
  return ["time-entries", "none"] as const;
}

export function TimeEntriesList({
  taskId,
  projectId,
  currentUserId,
  defaultExpanded = false,
}: Props) {
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState(defaultExpanded);

  const queryKey = getKey(taskId, projectId);

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: async (): Promise<{ entries: TimeEntryRow[] }> => {
      const qs = new URLSearchParams();
      if (taskId) qs.set("taskId", taskId);
      else if (projectId) qs.set("projectId", projectId);
      const res = await fetch(`/api/time-entries?${qs.toString()}`);
      if (!res.ok) throw new Error("Failed to load time entries");
      return res.json();
    },
    enabled: !!(taskId || projectId),
  });

  const entries = data?.entries ?? [];
  const totalMinutes = entries.reduce((sum, e) => sum + e.minutes, 0);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/time-entries/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? "Failed to delete entry");
      }
    },
    onSuccess: () => {
      toast.success("Time entry deleted.");
      qc.invalidateQueries({ queryKey });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to delete entry.");
    },
  });

  if (entries.length === 0 && !isLoading) {
    return null;
  }

  return (
    <div className="rounded-md border border-border">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left hover:bg-secondary/40 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2 text-sm">
          {expanded ? (
            <ChevronDown size={13} className="text-muted-foreground" />
          ) : (
            <ChevronRight size={13} className="text-muted-foreground" />
          )}
          <Clock size={13} className="text-muted-foreground" />
          <span className="font-medium text-foreground">
            {minutesToEstimate(totalMinutes)}
          </span>
          <span className="text-muted-foreground">
            · {entries.length} {entries.length === 1 ? "entry" : "entries"}
          </span>
        </div>
      </button>

      {expanded && (
        <div className="divide-y divide-border border-t border-border">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 size={14} className="animate-spin text-muted-foreground" />
            </div>
          ) : (
            entries.map((entry) => {
              const canDelete = entry.userId === currentUserId;
              return (
                <div
                  key={entry.id}
                  className="group flex items-start justify-between gap-3 px-3 py-2.5"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-2 text-sm">
                      <span className="font-medium text-foreground">
                        {minutesToEstimate(entry.minutes)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        by {entry.userName}
                      </span>
                      <span className="text-[10px] text-muted-foreground/70">
                        · {formatDistanceToNow(new Date(entry.loggedAt), { addSuffix: true })}
                      </span>
                    </div>
                    {entry.description && (
                      <p className="mt-0.5 text-xs text-muted-foreground leading-snug">
                        {entry.description}
                      </p>
                    )}
                  </div>
                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => deleteMutation.mutate(entry.id)}
                      disabled={deleteMutation.isPending}
                      className="shrink-0 rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:text-danger group-hover:opacity-100 cursor-pointer disabled:opacity-40"
                      title="Delete entry"
                    >
                      {deleteMutation.isPending && deleteMutation.variables === entry.id ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <Trash2 size={12} />
                      )}
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
