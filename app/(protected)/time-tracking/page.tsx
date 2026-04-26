import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ListPageLayout } from "@/components/layout/templates/ListPageLayout";
import { getServerSession } from "@/server/auth/session";
import { listTimeEntriesForOrg, getOrgTimeSummary } from "@/server/time-entries";
import { listProjectsForUser } from "@/server/projects";
import { TimeTrackingContent } from "@/components/time-tracking/TimeTrackingContent";

export const metadata: Metadata = {
  title: "Time Tracking",
};

type PageProps = {
  searchParams: Promise<Record<string, string | string[]>>;
};

function pickStr(v: string | string[] | undefined): string | undefined {
  if (Array.isArray(v)) return v[0];
  return v;
}

export default async function Page({ searchParams }: PageProps) {
  const session = await getServerSession();
  if (!session?.user) redirect("/auth/sign-in");

  const sp = await searchParams;
  const projectId = pickStr(sp.projectId);
  const dateFrom = pickStr(sp.dateFrom);
  const dateTo = pickStr(sp.dateTo);
  const page = Math.max(1, Number(pickStr(sp.page)) || 1);
  const pageSize = Math.max(1, Number(pickStr(sp.pageSize)) || 25);

  const [list, summary, projectsResult] = await Promise.all([
    listTimeEntriesForOrg(session.user.id, {
      projectId,
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined,
      page,
      pageSize,
    }),
    getOrgTimeSummary(session.user.id),
    listProjectsForUser(session.user.id, { page: 1, pageSize: 200 }),
  ]);

  if (!list) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">No active organization found.</p>
      </div>
    );
  }

  const serializedEntries = list.entries.map((e) => ({
    id: e.id,
    projectId: e.projectId,
    projectName: (e as unknown as { projectName: string | null }).projectName ?? null,
    taskId: e.taskId,
    taskTitle: e.taskTitle,
    userId: e.userId,
    userName: e.userName,
    minutes: e.minutes,
    description: e.description,
    loggedAt: e.loggedAt.toISOString(),
    createdAt: e.createdAt.toISOString(),
  }));

  return (
    <ListPageLayout
      title="Time Tracking"
      description="All time entries logged across your projects."
    >
      <TimeTrackingContent
        currentUserId={session.user.id}
        entries={serializedEntries}
        pagination={list.pagination}
        totalMinutes={list.totalMinutes}
        summary={summary}
        projects={projectsResult.projects.map((p) => ({ id: p.id, name: p.name }))}
        filters={{ projectId, dateFrom, dateTo }}
      />
    </ListPageLayout>
  );
}
