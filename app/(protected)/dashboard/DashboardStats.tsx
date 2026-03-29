import { motion, type Variants } from "framer-motion";
import {
  Users,
  FolderKanban,
  CheckSquare,
  CreditCard,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { DashboardContext } from "@/core/dashboard/entity";
import { formatRevenue } from "@/core/dashboard/entity";

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

// ─── DashboardStats ───────────────────────────────────────────────────────────

export function DashboardStats({
  data,
  isLoading,
  motionStagger,
}: {
  data: DashboardContext | undefined;
  isLoading: boolean;
  motionStagger: { container: Variants; item: Variants };
}) {
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

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <KpiSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
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
  );
}
