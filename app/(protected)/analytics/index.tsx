"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Users,
  FolderKanban,
  FileUp,
  CheckSquare,
  DollarSign,
} from "lucide-react";
import { useMotionStagger } from "@/hooks/use-home-motion";
import { useAnalytics, DEFAULT_FILTERS } from "@/core/analytics/useCase";
import { type AnalyticsFilters } from "@/core/analytics/entity";
import { KpiCard, KpiSkeleton } from "./KpiCard";
import { ChartsRow } from "./ChartsRow";
import { FilterBar } from "./FilterBar";
import { RecentProjectsSection } from "./RecentProjectsSection";

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
        {
          label: "Total Revenue",
          value: `$${(summary.totalRevenueCents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          icon: DollarSign,
          description: "Paid invoices",
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 mb-8">
          {[0, 1, 2, 3, 4].map((i) => (
            <KpiSkeleton key={i} />
          ))}
        </div>
      ) : (
        <motion.div
          variants={motionStagger.container}
          initial="hidden"
          animate="show"
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 mb-8"
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
      )}

      <ChartsRow
        summary={summary}
        isLoading={isLoading}
        totalProjects={totalProjects}
        filters={filters}
      />

      {/* Recent Projects */}
      <RecentProjectsSection
        summary={summary}
        isLoading={isLoading}
        filters={filters}
      />
    </div>
  );
};

export default AnalyticsPage;
