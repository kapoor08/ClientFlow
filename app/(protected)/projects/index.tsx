import Link from "next/link";
import { LayoutTemplate, Archive, ArrowLeft } from "lucide-react";
import { listProjectsForUser } from "@/server/projects";
import { getProjectCapStatus } from "@/server/subscription/plan-enforcement";
import { projectsSearchParamsCache } from "@/core/projects/searchParams";
import { ListPageLayout } from "@/components/layout/templates/ListPageLayout";
import { AtLimitNewButton } from "@/components/common/AtLimitNewButton";
import { ProjectsTable } from "@/components/tables/ProjectsTable";
import { getServerSession } from "@/server/auth/session";

type ProjectsPageProps = {
  searchParams: Promise<Record<string, string | string[]>>;
};

export default async function ProjectsPage({ searchParams }: ProjectsPageProps) {
  const session = await getServerSession();
  const { q, page, pageSize, sort, order, status, priority, dateFrom, dateTo, view } =
    projectsSearchParamsCache.parse(await searchParams);

  const archivedOnly = view === "archived";

  const { access, projects, pagination } = await listProjectsForUser(session!.user.id, {
    query: q,
    page,
    pageSize,
    sort,
    order: sort ? (order === "asc" ? "asc" : "desc") : "desc",
    status: status || undefined,
    priority: priority || undefined,
    dateFrom: dateFrom ? new Date(dateFrom) : undefined,
    dateTo: dateTo ? new Date(dateTo) : undefined,
    archivedOnly,
  });

  if (!access) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">No active organization found.</p>
      </div>
    );
  }

  const capStatus =
    access.canWrite && !archivedOnly ? await getProjectCapStatus(access.organizationId) : null;

  return (
    <ListPageLayout
      title={archivedOnly ? "Archived Projects" : "Projects"}
      description={`${pagination.total} project${pagination.total === 1 ? "" : "s"}${archivedOnly ? " archived" : " total"}`}
      action={
        <div className="flex items-center gap-2">
          {archivedOnly ? (
            <Link
              href="/projects"
              className="border-border bg-card text-foreground hover:bg-secondary inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors"
            >
              <ArrowLeft size={14} />
              Back to active
            </Link>
          ) : (
            <Link
              href="/projects?view=archived"
              className="border-border bg-card text-foreground hover:bg-secondary inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors"
            >
              <Archive size={14} />
              Archived
            </Link>
          )}
          {access.canWrite && !archivedOnly && capStatus && (
            <>
              <Link
                href="/projects/templates"
                className="border-border bg-card text-foreground hover:bg-secondary inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors"
              >
                <LayoutTemplate size={14} />
                Templates
              </Link>
              <AtLimitNewButton href="/projects/new" label="New Project" capStatus={capStatus} />
            </>
          )}
        </div>
      }
    >
      <ProjectsTable
        projects={projects}
        pagination={pagination}
        canWrite={access.canWrite}
        archivedOnly={archivedOnly}
      />
    </ListPageLayout>
  );
}
