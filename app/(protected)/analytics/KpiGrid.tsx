"use client";

import { motion } from "framer-motion";
import {
  Users,
  FolderKanban,
  CheckSquare,
  FileUp,
  DollarSign,
} from "lucide-react";
import { useMotionStagger } from "@/hooks/use-home-motion";
import { KpiCard, KpiSkeleton } from "./KpiCard";

// ─── KpiGrid ──────────────────────────────────────────────────────────────────

type KpiSummaryProps = {
  totalClients: number;
  activeProjects: number;
  completedProjects: number;
  totalFiles: number;
  totalRevenueCents: number;
};

export function KpiGrid({ summary }: { summary: KpiSummaryProps }) {
  const motionStagger = useMotionStagger({
    step: 0.06,
    initialY: 12,
    duration: 0.35,
  });

  const kpis = [
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
      value: `$${(summary.totalRevenueCents / 100).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      icon: DollarSign,
      description: "Paid invoices",
    },
  ];

  return (
    <motion.div
      variants={motionStagger.container}
      initial="hidden"
      animate="show"
      className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5"
    >
      {kpis.map((m) => (
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
  );
}

// ─── KpiGridSkeleton ──────────────────────────────────────────────────────────

export function KpiGridSkeleton() {
  return (
    <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {[0, 1, 2, 3, 4].map((i) => (
        <KpiSkeleton key={i} />
      ))}
    </div>
  );
}
