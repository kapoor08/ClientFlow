"use client";

import { motion } from "framer-motion";
import {
  Users,
  FolderKanban,
  CheckSquare,
  CreditCard,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { useMotionStagger } from "@/hooks/use-home-motion";
import type { DashboardContext } from "@/core/dashboard/entity";
import { formatRevenue } from "@/core/dashboard/entity";

export function DashboardStats({ data }: { data: DashboardContext }) {
  const motionStagger = useMotionStagger({ step: 0.06, initialY: 12, duration: 0.35 });

  const kpis = [
    {
      label: "Active Clients",
      value: String(data.kpis.activeClients),
      change: `+${data.kpis.newClientsThisMonth} this month`,
      icon: Users,
      trend: "up" as const,
      href: "/clients",
    },
    {
      label: "Projects",
      value: String(data.kpis.projectsInProgress),
      change: data.kpis.projectsDueThisWeek
        ? `${data.kpis.projectsDueThisWeek} due this week`
        : "None due this week",
      icon: FolderKanban,
      trend: "neutral" as const,
      href: "/projects",
    },
    {
      label: "Open Tasks",
      value: String(data.kpis.openTasks),
      change: data.kpis.overdueTasks
        ? `${data.kpis.overdueTasks} overdue`
        : "None overdue",
      icon: CheckSquare,
      trend: data.kpis.overdueTasks > 0 ? ("warning" as const) : ("up" as const),
      href: "/tasks",
    },
    {
      label: "Revenue This Month",
      value: formatRevenue(data.kpis.monthlyRevenueCents),
      change: "From paid invoices",
      icon: CreditCard,
      trend: "up" as const,
      href: "/billing",
    },
  ];

  return (
    <motion.div
      variants={motionStagger.container}
      initial="hidden"
      animate="show"
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      {kpis.map((kpi) => (
        <motion.div key={kpi.label} variants={motionStagger.item}>
          <Link
            href={kpi.href}
            className="block rounded-card border border-border bg-card p-5 shadow-cf-1 transition-all duration-200 hover:border-primary/20 hover:shadow-cf-2"
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
          </Link>
        </motion.div>
      ))}
    </motion.div>
  );
}
