"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Clock, Plus, Trash2, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LogTimeDialog } from "./LogTimeDialog";
import { minutesToEstimate } from "@/components/form";

type Entry = {
  id: string;
  projectId: string;
  projectName: string | null;
  taskId: string | null;
  taskTitle: string | null;
  userId: string;
  userName: string;
  minutes: number;
  description: string | null;
  loggedAt: string;
  createdAt: string;
};

type Pagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

type ProjectOption = { id: string; name: string };

type Props = {
  currentUserId: string;
  entries: Entry[];
  pagination: Pagination;
  totalMinutes: number;
  summary: { weekMinutes: number; monthMinutes: number; allTimeMinutes: number };
  projects: ProjectOption[];
  filters: {
    projectId?: string;
    dateFrom?: string;
    dateTo?: string;
  };
};

export function TimeTrackingContent({
  currentUserId,
  entries,
  pagination,
  totalMinutes,
  summary,
  projects,
  filters,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [logOpen, setLogOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  function setParam(key: string, value: string | null) {
    const next = new URLSearchParams(searchParams.toString());
    if (value === null || value === "") next.delete(key);
    else next.set(key, value);
    // Reset to page 1 when filters change.
    if (key !== "page") next.delete("page");
    startTransition(() => {
      router.push(`?${next.toString()}`, { scroll: false });
    });
  }

  async function handleDelete(id: string) {
    setPendingDeleteId(id);
    try {
      const res = await fetch(`/api/time-entries/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Failed to delete entry");
      }
      toast.success("Time entry deleted.");
      startTransition(() => router.refresh());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete entry");
    } finally {
      setPendingDeleteId(null);
    }
  }

  return (
    <>
      {/* Summary stats */}
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <SummaryCard label="This week" minutes={summary.weekMinutes} />
        <SummaryCard label="Last 30 days" minutes={summary.monthMinutes} />
        <SummaryCard label="All time" minutes={summary.allTimeMinutes} />
      </div>

      {/* Filter bar */}
      <div className="bg-card mb-4 flex flex-col items-stretch gap-2 rounded-md border p-3 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-1">
          <Label className="text-muted-foreground text-[11px] tracking-wide uppercase">
            Project
          </Label>
          <Select
            value={filters.projectId ?? "all"}
            onValueChange={(v) => setParam("projectId", v === "all" ? null : v)}
          >
            <SelectTrigger className="w-full cursor-pointer">
              <SelectValue placeholder="All projects" />
            </SelectTrigger>
            <SelectContent position="popper">
              <SelectItem value="all" className="cursor-pointer">
                All projects
              </SelectItem>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id} className="cursor-pointer">
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-muted-foreground text-[11px] tracking-wide uppercase">From</Label>
          <Input
            type="date"
            value={filters.dateFrom ?? ""}
            onChange={(e) => setParam("dateFrom", e.target.value || null)}
            className="cursor-pointer"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-muted-foreground text-[11px] tracking-wide uppercase">To</Label>
          <Input
            type="date"
            value={filters.dateTo ?? ""}
            onChange={(e) => setParam("dateTo", e.target.value || null)}
            className="cursor-pointer"
          />
        </div>
        <Button onClick={() => setLogOpen(true)} className="cursor-pointer gap-1.5">
          <Plus size={14} />
          Log time
        </Button>
      </div>

      {/* Filtered total */}
      {entries.length > 0 && (
        <p className="text-muted-foreground mb-3 text-xs">
          {pagination.total} {pagination.total === 1 ? "entry" : "entries"} ·{" "}
          {minutesToEstimate(totalMinutes)} total in current filter
        </p>
      )}

      {/* Entries table */}
      {entries.length === 0 ? (
        <div className="bg-card flex flex-col items-center justify-center rounded-md border py-12 text-center">
          <Clock size={28} className="text-muted-foreground mb-2" />
          <p className="text-foreground text-sm font-medium">No time entries yet</p>
          <p className="text-muted-foreground mt-1 max-w-sm text-xs">
            Log your first hours to see them appear here.
          </p>
          <Button
            size="sm"
            className="mt-4 cursor-pointer gap-1.5"
            onClick={() => setLogOpen(true)}
          >
            <Plus size={12} />
            Log time
          </Button>
        </div>
      ) : (
        <div className="bg-card shadow-cf-1 overflow-hidden rounded-xl border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-muted-foreground text-xs">
              <tr>
                <th className="px-4 py-2.5 text-left font-medium">Date</th>
                <th className="px-4 py-2.5 text-left font-medium">Project / Task</th>
                <th className="px-4 py-2.5 text-left font-medium">User</th>
                <th className="px-4 py-2.5 text-left font-medium">Duration</th>
                <th className="px-4 py-2.5 text-left font-medium">Description</th>
                <th className="px-4 py-2.5 text-right font-medium" />
              </tr>
            </thead>
            <tbody className="divide-border divide-y">
              {entries.map((e) => (
                <tr key={e.id} className="group hover:bg-muted/30">
                  <td className="text-muted-foreground px-4 py-3 text-xs whitespace-nowrap">
                    {format(new Date(e.loggedAt), "MMM d, yyyy")}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-foreground text-sm font-medium">{e.projectName ?? "-"}</p>
                    {e.taskTitle && (
                      <p className="text-muted-foreground max-w-[220px] truncate text-xs">
                        {e.taskTitle}
                      </p>
                    )}
                  </td>
                  <td className="text-muted-foreground px-4 py-3 text-xs">{e.userName}</td>
                  <td className="text-foreground px-4 py-3 text-sm font-medium">
                    {minutesToEstimate(e.minutes)}
                  </td>
                  <td className="text-muted-foreground px-4 py-3 text-xs">
                    <span className="block max-w-[280px] truncate">{e.description ?? "-"}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {e.userId === currentUserId && (
                      <button
                        type="button"
                        onClick={() => handleDelete(e.id)}
                        disabled={pendingDeleteId === e.id}
                        className="text-muted-foreground hover:text-destructive cursor-pointer rounded p-1 opacity-0 transition-opacity group-hover:opacity-100 disabled:opacity-40"
                        title="Delete entry"
                      >
                        {pendingDeleteId === e.id ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <Trash2 size={12} />
                        )}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="text-muted-foreground mt-4 flex items-center justify-between text-xs">
          <span>
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => setParam("page", String(pagination.page - 1))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => setParam("page", String(pagination.page + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <LogTimeDialog
        open={logOpen}
        onClose={() => setLogOpen(false)}
        onLogged={() => startTransition(() => router.refresh())}
      />
    </>
  );
}

function SummaryCard({ label, minutes }: { label: string; minutes: number }) {
  return (
    <div className="bg-card shadow-cf-1 rounded-xl border p-4">
      <p className="text-muted-foreground text-[11px] tracking-wide uppercase">{label}</p>
      <p className="font-display text-foreground mt-1 text-2xl font-bold">
        {minutesToEstimate(minutes)}
      </p>
    </div>
  );
}
