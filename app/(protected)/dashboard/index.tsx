"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useMotionStagger } from "@/hooks/use-home-motion";
import { useDashboard } from "@/core/dashboard/useCase";
import { DashboardStats } from "./DashboardStats";
import { RecentTasksList } from "./RecentTasksList";
import { RecentProjectsTable } from "./RecentProjectsTable";
import { RecentActivityList } from "./RecentActivityList";

// ─── Page ─────────────────────────────────────────────────────────────────────

const Dashboard = () => {
  const { data, isLoading } = useDashboard();
  const motionStagger = useMotionStagger({ step: 0.06, initialY: 12, duration: 0.35 });

  const firstName = data?.userName?.split(" ")[0] ?? "there";
  const tasksDueSoon = data?.tasksDueSoon ?? [];
  const recentProjects = data?.recentProjects ?? [];
  const recentActivity = data?.recentActivity ?? [];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground">
            Dashboard
          </h1>
          <div className="text-sm text-muted-foreground">
            {isLoading ? (
              <Skeleton className="mt-1 inline-block h-4 w-52" />
            ) : (
              <>Welcome back, {firstName}. Here&apos;s what&apos;s happening.</>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="default" size="sm" asChild>
            <Link href="/projects/new">New Project</Link>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <DashboardStats
        data={data}
        isLoading={isLoading}
        motionStagger={motionStagger}
      />

      {/* Tasks Due Soon */}
      <RecentTasksList tasksDueSoon={tasksDueSoon} isLoading={isLoading} />

      {/* Bottom two-col section */}
      <div className="mt-8 grid gap-6 lg:grid-cols-5">
        {/* Recent Projects */}
        <RecentProjectsTable recentProjects={recentProjects} isLoading={isLoading} />

        {/* Recent Activity */}
        <RecentActivityList recentActivity={recentActivity} isLoading={isLoading} />
      </div>
    </div>
  );
};

export default Dashboard;
