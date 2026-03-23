"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  TrendingUp,
  Users,
  FolderKanban,
  FileUp,
  CheckSquare,
  Loader2,
  ExternalLink,
  Filter,
  X,
} from "lucide-react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useMotionStagger } from "@/hooks/use-home-motion";
import { useAnalytics, DEFAULT_FILTERS } from "@/core/analytics/useCase";
import {
  DATE_PRESET_OPTIONS,
  type AnalyticsFilters,
  type ProjectStatusBreakdown,
  type MonthlyCount,
  type RecentProject,
} from "@/core/analytics/entity";
import { listClients } from "@/core/clients/repository";
import { clientKeys } from "@/core/clients/useCase";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

// ─── Status / priority helpers ────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  planning: "Planning",
  active: "Active",
  in_progress: "In Progress",
  on_hold: "On Hold",
  completed: "Completed",
  cancelled: "Cancelled",
};

const STATUS_COLORS: Record<string, string> = {
  planning: "bg-blue-400",
  active: "bg-emerald-500",
  in_progress: "bg-primary",
  on_hold: "bg-amber-400",
  completed: "bg-green-600",
  cancelled: "bg-muted-foreground",
};

const PRIORITY_COLORS: Record<string, string> = {
  urgent: "text-red-500",
  high: "text-orange-500",
  medium: "text-amber-500",
  low: "text-muted-foreground",
};

// ─── Skeletons ────────────────────────────────────────────────────────────────

function KpiSkeleton() {
  return (
    <div className="rounded-card border border-border bg-card p-5 shadow-cf-1">
      <div className="flex items-center justify-between mb-3">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-4 w-4" />
      </div>
      <Skeleton className="h-7 w-16 mb-2" />
      <Skeleton className="h-3 w-20" />
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="rounded-card border border-border bg-card p-5 shadow-cf-1">
      <Skeleton className="h-4 w-36 mb-6" />
      <div className="flex items-end gap-2 h-40">
        {[0.4, 0.7, 0.5, 0.9, 0.6, 0.8].map((h, i) => (
          <Skeleton
            key={i}
            className="flex-1 rounded-t"
            style={{ height: `${h * 100}%` }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Monthly bar chart ────────────────────────────────────────────────────────

function MonthlyChart({ data }: { data: MonthlyCount[] }) {
  const max = Math.max(...data.map((d) => d.total), 1);
  return (
    <div className="flex items-end gap-2" style={{ height: 180 }}>
      {data.map((d) => (
        <div key={d.month} className="flex flex-1 flex-col items-center gap-1">
          <span className="text-[10px] font-medium text-foreground">
            {d.total}
          </span>
          <div
            className="w-full rounded-t-md bg-primary/80 hover:bg-primary transition-colors"
            style={{ height: `${Math.max((d.total / max) * 140, 4)}px` }}
          />
          <span className="text-[10px] text-muted-foreground">{d.month}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Status distribution ──────────────────────────────────────────────────────

function StatusDistribution({
  data,
  total,
}: {
  data: ProjectStatusBreakdown[];
  total: number;
}) {
  const sorted = [...data].sort((a, b) => b.total - a.total);
  return (
    <div className="space-y-3">
      {sorted.map((row) => {
        const pct = total > 0 ? Math.round((row.total / total) * 100) : 0;
        const color = STATUS_COLORS[row.status] ?? "bg-muted-foreground";
        return (
          <div key={row.status}>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="font-medium text-foreground">
                {STATUS_LABELS[row.status] ?? row.status}
              </span>
              <span className="text-xs text-muted-foreground">
                {row.total} ({pct}%)
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-secondary">
              <div
                className={`h-full rounded-full transition-all ${color}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Recent project row ───────────────────────────────────────────────────────

function RecentProjectRow({ project }: { project: RecentProject }) {
  const dotColor = STATUS_COLORS[project.status] ?? "bg-muted-foreground";
  const priorityColor = project.priority
    ? (PRIORITY_COLORS[project.priority] ?? "")
    : "";
  const due = project.dueDate ? new Date(project.dueDate) : null;
  const isOverdue =
    due && due < new Date() && project.status !== "completed";

  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-border last:border-0">
      <div className="flex items-center gap-2.5 min-w-0">
        <span className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${dotColor}`} />
        <Link
          href={`/projects/${project.id}`}
          className="text-sm font-medium text-foreground hover:text-primary truncate transition-colors"
        >
          {project.name}
        </Link>
      </div>
      <div className="flex items-center gap-3 shrink-0 text-xs text-muted-foreground">
        {project.priority && (
          <span className={`font-medium capitalize ${priorityColor}`}>
            {project.priority}
          </span>
        )}
        {due && (
          <span className={isOverdue ? "text-red-500 font-medium" : ""}>
            {due.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </span>
        )}
        <Link
          href={`/projects/${project.id}`}
          className="hover:text-foreground transition-colors"
        >
          <ExternalLink size={12} />
        </Link>
      </div>
    </div>
  );
}

// ─── Filter bar ───────────────────────────────────────────────────────────────

type FilterBarProps = {
  filters: AnalyticsFilters;
  onChange: (f: AnalyticsFilters) => void;
};

function FilterBar({ filters, onChange }: FilterBarProps) {
  const { data: clientsData } = useQuery({
    queryKey: clientKeys.list({ pageSize: 500 }),
    queryFn: () => listClients({ page: 1 }),
    staleTime: 5 * 60 * 1000,
  });

  const clientOptions = clientsData?.clients ?? [];
  const isDirty =
    filters.datePreset !== DEFAULT_FILTERS.datePreset || !!filters.clientId;

  return (
    <div className="mb-6 flex flex-wrap items-center gap-2.5">
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground mr-1">
        <Filter size={14} />
        <span className="font-medium">Filters</span>
      </div>

      {/* Date range preset */}
      <Select
        value={filters.datePreset}
        onValueChange={(val) =>
          onChange({
            ...filters,
            datePreset: val as AnalyticsFilters["datePreset"],
          })
        }
      >
        <SelectTrigger size="sm" className="w-36">
          <SelectValue />
        </SelectTrigger>
        <SelectContent position="popper">
          {DATE_PRESET_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Client filter */}
      <Select
        value={filters.clientId || "__all__"}
        onValueChange={(val) =>
          onChange({ ...filters, clientId: val === "__all__" ? "" : val })
        }
      >
        <SelectTrigger size="sm" className="w-44">
          <SelectValue />
        </SelectTrigger>
        <SelectContent position="popper">
          <SelectItem value="__all__">All clients</SelectItem>
          {clientOptions.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.company ? `${c.name} (${c.company})` : c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Reset */}
      {isDirty && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onChange(DEFAULT_FILTERS)}
          className="h-7 gap-1 text-muted-foreground"
        >
          <X size={12} />
          Reset
        </Button>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const AnalyticsPage = () => {
  const motionStagger = useMotionStagger({
    step: 0.06,
    initialY: 12,
    duration: 0.35,
  });

  const [filters, setFilters] = useState<AnalyticsFilters>(DEFAULT_FILTERS);
  const { data, isLoading } = useAnalytics(filters);

  const summary = data?.summary;
  const totalProjects =
    summary?.projectsByStatus.reduce((acc, r) => acc + r.total, 0) ?? 0;

  const kpis = summary
    ? [
        {
          label: "Active Clients",
          value: summary.totalClients,
          icon: Users,
          description: "Clients with active status",
        },
        {
          label: "Active Projects",
          value: summary.activeProjects,
          icon: FolderKanban,
          description: "Active & in-progress",
        },
        {
          label: "Completed",
          value: summary.completedProjects,
          icon: CheckSquare,
          description: "Projects completed",
        },
        {
          label: "Files Uploaded",
          value: summary.totalFiles,
          icon: FileUp,
          description: "Across all projects",
        },
      ]
    : [];

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-foreground">
          Analytics
        </h1>
        <p className="text-sm text-muted-foreground">
          Organizational performance overview
        </p>
      </div>

      {/* Filters */}
      <FilterBar filters={filters} onChange={setFilters} />

      {/* KPI Cards */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {[0, 1, 2, 3].map((i) => (
            <KpiSkeleton key={i} />
          ))}
        </div>
      ) : (
        <motion.div
          variants={motionStagger.container}
          initial="hidden"
          animate="show"
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8"
        >
          {kpis.map((m) => (
            <motion.div
              key={m.label}
              variants={motionStagger.item}
              className="rounded-card border border-border bg-card p-5 shadow-cf-1"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  {m.label}
                </span>
                <m.icon size={18} className="text-muted-foreground" />
              </div>
              <div className="mt-2 font-display text-2xl font-bold text-foreground">
                {m.value}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {m.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Monthly Projects Chart */}
        {isLoading ? (
          <ChartSkeleton />
        ) : (
          <div className="rounded-card border border-border bg-card p-5 shadow-cf-1">
            <div className="mb-4 flex items-center gap-2">
              <BarChart3 size={18} className="text-muted-foreground" />
              <h2 className="font-display text-base font-semibold text-foreground">
                Projects Created
              </h2>
              <span className="ml-auto text-xs text-muted-foreground">
                {DATE_PRESET_OPTIONS.find(
                  (o) => o.value === filters.datePreset,
                )?.label ?? ""}
              </span>
            </div>
            {summary && summary.monthlyProjectCreation.length > 0 ? (
              <MonthlyChart data={summary.monthlyProjectCreation} />
            ) : (
              <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
                No project data for this period.
              </div>
            )}
          </div>
        )}

        {/* Project Status Distribution */}
        {isLoading ? (
          <ChartSkeleton />
        ) : (
          <div className="rounded-card border border-border bg-card p-5 shadow-cf-1">
            <div className="mb-4 flex items-center gap-2">
              <TrendingUp size={18} className="text-muted-foreground" />
              <h2 className="font-display text-base font-semibold text-foreground">
                Projects by Status
              </h2>
              {totalProjects > 0 && (
                <span className="ml-auto text-xs text-muted-foreground">
                  {totalProjects} total
                </span>
              )}
            </div>
            {summary && summary.projectsByStatus.length > 0 ? (
              <StatusDistribution
                data={summary.projectsByStatus}
                total={totalProjects}
              />
            ) : (
              <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
                No projects for this period.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Recent Projects */}
      <div className="mt-6 rounded-card border border-border bg-card shadow-cf-1">
        <div className="border-b border-border px-5 py-3.5 flex items-center gap-2">
          <FolderKanban size={16} className="text-muted-foreground" />
          <h2 className="font-display text-sm font-semibold text-foreground">
            Recent Projects
          </h2>
          <Link
            href={
              filters.clientId
                ? `/projects?clientId=${filters.clientId}`
                : "/projects"
            }
            className="ml-auto text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            View all
          </Link>
        </div>
        <div className="px-5">
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 size={18} className="animate-spin text-muted-foreground" />
            </div>
          ) : summary && summary.recentProjects.length > 0 ? (
            summary.recentProjects.map((p) => (
              <RecentProjectRow key={p.id} project={p} />
            ))
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No projects found.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
