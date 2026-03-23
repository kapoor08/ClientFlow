"use client";

import { motion } from "framer-motion";
import {
  Users,
  FolderKanban,
  CheckSquare,
  CreditCard,
  TrendingUp,
  AlertCircle,
  Clock,
  ArrowUpRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { useMotionStagger } from "@/hooks/use-home-motion";
import { useDashboard } from "@/core/dashboard/useCase";
import type { DashboardTask } from "@/core/dashboard/entity";
import {
  formatRevenue,
  formatDueDate,
  TASK_STATUS_LABELS,
  TASK_STATUS_STYLES,
} from "@/core/dashboard/entity";

// ─── KPI skeleton ─────────────────────────────────────────────────────────────

function KpiSkeleton() {
  return (
    <div className="rounded-card border border-border bg-card p-5 shadow-cf-1">
      <div className="flex items-center justify-between">
        <Skeleton className="h-3.5 w-28" />
        <Skeleton className="h-4 w-4 rounded" />
      </div>
      <Skeleton className="mt-3 h-7 w-16" />
      <Skeleton className="mt-2 h-3 w-32" />
    </div>
  );
}

// ─── Task row ─────────────────────────────────────────────────────────────────

function TaskRow({ task }: { task: DashboardTask }) {
  const { label, isOverdue } = formatDueDate(task.dueDate);
  const statusLabel = TASK_STATUS_LABELS[task.status] ?? task.status;
  const statusStyle =
    TASK_STATUS_STYLES[task.status] ?? "bg-secondary text-muted-foreground";

  return (
    <tr className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
      <td className="px-4 py-3 font-medium text-foreground">{task.title}</td>
      <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
        {task.projectName ?? "—"}
      </td>
      <td className="px-4 py-3">
        <span
          className={`inline-flex items-center rounded-pill px-2 py-0.5 text-xs font-medium ${statusStyle}`}
        >
          {statusLabel}
        </span>
      </td>
      <td className="hidden px-4 py-3 md:table-cell">
        <span
          className={`flex items-center gap-1 text-xs ${isOverdue ? "font-medium text-danger" : "text-muted-foreground"}`}
        >
          <Clock size={12} />
          {label}
        </span>
      </td>
    </tr>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const Dashboard = () => {
  const { data, isLoading } = useDashboard();
  const motionStagger = useMotionStagger({ step: 0.06, initialY: 12, duration: 0.35 });

  const kpis = [
    {
      label: "Active Clients",
      value: String(data?.kpis.activeClients ?? 0),
      change: `+${data?.kpis.newClientsThisMonth ?? 0} this month`,
      icon: Users,
      trend: "up" as const,
    },
    {
      label: "Projects",
      value: String(data?.kpis.projectsInProgress ?? 0),
      change: data?.kpis.projectsDueThisWeek
        ? `${data.kpis.projectsDueThisWeek} due this week`
        : "None due this week",
      icon: FolderKanban,
      trend: "neutral" as const,
    },
    {
      label: "Open Tasks",
      value: String(data?.kpis.openTasks ?? 0),
      change: data?.kpis.overdueTasks
        ? `${data.kpis.overdueTasks} overdue`
        : "None overdue",
      icon: CheckSquare,
      trend: (data?.kpis.overdueTasks ?? 0) > 0
        ? ("warning" as const)
        : ("up" as const),
    },
    {
      label: "Revenue This Month",
      value: formatRevenue(data?.kpis.monthlyRevenueCents ?? 0),
      change: "From paid invoices",
      icon: CreditCard,
      trend: "up" as const,
    },
  ];

  const firstName = data?.userName?.split(" ")[0] ?? "there";
  const tasksDueSoon = data?.tasksDueSoon ?? [];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground">
            Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            {isLoading ? (
              <Skeleton className="mt-1 inline-block h-4 w-52" />
            ) : (
              <>Welcome back, {firstName}. Here&apos;s what&apos;s happening.</>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/projects/new">New Project</Link>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <KpiSkeleton key={i} />
          ))}
        </div>
      ) : (
        <motion.div
          variants={motionStagger.container}
          initial="hidden"
          animate="show"
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {kpis.map((kpi) => (
            <motion.div
              key={kpi.label}
              variants={motionStagger.item}
              className="rounded-card border border-border bg-card p-5 shadow-cf-1"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  {kpi.label}
                </span>
                <kpi.icon size={18} className="text-muted-foreground" />
              </div>
              <div className="mt-2 font-display text-2xl font-bold text-foreground">
                {kpi.value}
              </div>
              <div className="mt-1 flex items-center gap-1 text-xs">
                {kpi.trend === "up" && (
                  <TrendingUp size={12} className="text-success" />
                )}
                {kpi.trend === "warning" && (
                  <AlertCircle size={12} className="text-warning" />
                )}
                <span className="text-muted-foreground">{kpi.change}</span>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Tasks Due Soon */}
      <div className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-foreground">
            Tasks Due Soon
          </h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/tasks" className="flex items-center gap-1">
              View All <ArrowUpRight size={14} />
            </Link>
          </Button>
        </div>

        <div className="overflow-hidden rounded-card border border-border bg-card shadow-cf-1">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Task
                </th>
                <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground sm:table-cell">
                  Project
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Status
                </th>
                <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground md:table-cell">
                  Due
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-border last:border-0">
                    <td className="px-4 py-3">
                      <Skeleton className="h-3.5 w-48" />
                    </td>
                    <td className="hidden px-4 py-3 sm:table-cell">
                      <Skeleton className="h-3.5 w-24" />
                    </td>
                    <td className="px-4 py-3">
                      <Skeleton className="h-5 w-20 rounded-full" />
                    </td>
                    <td className="hidden px-4 py-3 md:table-cell">
                      <Skeleton className="h-3.5 w-16" />
                    </td>
                  </tr>
                ))
              ) : tasksDueSoon.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-10 text-center text-sm text-muted-foreground"
                  >
                    No tasks due in the next 7 days.
                  </td>
                </tr>
              ) : (
                tasksDueSoon.map((task) => (
                  <TaskRow key={task.id} task={task} />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
