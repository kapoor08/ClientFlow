import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ListPageLayout } from "@/components/layout/ListPageLayout";
import { getServerSession } from "@/lib/get-session";
import { getDashboardContextForUser } from "@/lib/dashboard";
import { DashboardStats } from "./DashboardStats";
import { RecentTasksList } from "./RecentTasksList";
import { RecentProjectsTable } from "./RecentProjectsTable";
import { RecentActivityList } from "./RecentActivityList";

const DashboardPage = async () => {
  const session = await getServerSession();
  const data = await getDashboardContextForUser(session!.user.id);

  if (!data) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">No active organization found.</p>
      </div>
    );
  }

  const firstName = data.userName?.split(" ")[0] ?? "there";

  // Serialize Date objects to ISO strings for client components
  const dashboard = {
    userName: data.userName,
    kpis: data.kpis,
    tasksDueSoon: data.tasksDueSoon.map((t) => ({
      ...t,
      dueDate: t.dueDate instanceof Date ? t.dueDate.toISOString() : t.dueDate,
    })),
    recentProjects: data.recentProjects.map((p) => ({
      ...p,
      dueDate: p.dueDate instanceof Date ? p.dueDate.toISOString() : p.dueDate,
    })),
    recentActivity: data.recentActivity.map((a) => ({
      ...a,
      createdAt:
        a.createdAt instanceof Date ? a.createdAt.toISOString() : String(a.createdAt),
    })),
  };

  return (
    <ListPageLayout
      title="Dashboard"
      description={`Welcome back, ${firstName}. Here's what's happening.`}
      action={
        <Button size="sm" asChild>
          <Link href="/projects/new">New Project</Link>
        </Button>
      }
    >
      <DashboardStats data={dashboard} />

      <RecentTasksList tasksDueSoon={dashboard.tasksDueSoon} />

      <div className="mt-8 grid gap-6 lg:grid-cols-5">
        <RecentProjectsTable recentProjects={dashboard.recentProjects} />
        <RecentActivityList recentActivity={dashboard.recentActivity} />
      </div>
    </ListPageLayout>
  );
};

export default DashboardPage;
