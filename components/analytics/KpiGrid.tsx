"use client";

import { motion } from "framer-motion";
import {
  Users,
  FolderKanban,
  CheckSquare,
  FileUp,
  DollarSign,
  ListTodo,
  CircleCheck,
  AlertTriangle,
  Clock,
  ReceiptText,
} from "lucide-react";
import { useMotionStagger } from "@/hooks/use-home-motion";
import { KpiCard, KpiSkeleton } from "./KpiCard";
import type { AnalyticsSummary } from "@/core/analytics/entity";

function formatUSD(cents: number) {
  return `$${(cents / 100).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// ─── KpiGrid ──────────────────────────────────────────────────────────────────

export function KpiGrid({ summary }: { summary: AnalyticsSummary }) {
  const motionStagger = useMotionStagger({ step: 0.06, initialY: 12, duration: 0.35 });

  const row1 = [
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
    {
      label: "Total Revenue",
      value: formatUSD(summary.totalRevenueCents),
      icon: DollarSign,
      description: "Paid invoices",
    },
  ];

  const completionRate =
    summary.totalTasks > 0
      ? Math.round((summary.completedTasks / summary.totalTasks) * 100)
      : 0;

  const row2 = [
    {
      label: "Total Tasks",
      value: summary.totalTasks,
      icon: ListTodo,
      description: "All tasks across projects",
    },
    {
      label: "Tasks Completed",
      value: summary.completedTasks,
      icon: CircleCheck,
      description: `${completionRate}% completion rate`,
    },
    {
      label: "Overdue Tasks",
      value: summary.overdueTasks,
      icon: AlertTriangle,
      description: "Past due, not done",
    },
    {
      label: "Hours Logged",
      value: `${summary.totalHoursLogged}h`,
      icon: Clock,
      description: "Total time tracked",
    },
    {
      label: "Pending Revenue",
      value: formatUSD(summary.pendingRevenueCents),
      icon: ReceiptText,
      description: "Sent & draft invoices",
    },
  ];

  return (
    <div className="mb-8 space-y-4">
      <motion.div
        variants={motionStagger.container}
        initial="hidden"
        animate="show"
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5"
      >
        {row1.map((m) => (
          <KpiCard
            key={m.label}
            label={m.label}
            value={m.value}
            icon={m.icon}
            description={m.description}
            motionItem={motionStagger.item}
          />
        ))}
      </motion.div>

      <motion.div
        variants={motionStagger.container}
        initial="hidden"
        animate="show"
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5"
      >
        {row2.map((m) => (
          <KpiCard
            key={m.label}
            label={m.label}
            value={m.value}
            icon={m.icon}
            description={m.description}
            motionItem={motionStagger.item}
          />
        ))}
      </motion.div>
    </div>
  );
}

// ─── KpiGridSkeleton ──────────────────────────────────────────────────────────

export function KpiGridSkeleton() {
  return (
    <div className="mb-8 space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[0, 1, 2, 3, 4].map((i) => (
          <KpiSkeleton key={i} />
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[0, 1, 2, 3, 4].map((i) => (
          <KpiSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
