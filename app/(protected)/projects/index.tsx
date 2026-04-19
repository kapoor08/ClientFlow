import Link from "next/link";
import { Plus, LayoutTemplate, Archive, ArrowLeft } from "lucide-react";
import { listProjectsForUser } from "@/server/projects";
import { projectsSearchParamsCache } from "@/core/projects/searchParams";
import { ListPageLayout } from "@/components/layout/templates/ListPageLayout";
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

  const { access, projects, pagination } = await listProjectsForUser(
    session!.user.id,
    {
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
    },
  );

  if (!access) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">
          No active organization found.
        </p>
      </div>
    );
  }

  return (
    <ListPageLayout
      title={archivedOnly ? "Archived Projects" : "Projects"}
      description={`${pagination.total} project${pagination.total === 1 ? "" : "s"}${archivedOnly ? " archived" : " total"}`}
      action={
        <div className="flex items-center gap-2">
          {archivedOnly ? (
            <Link
              href="/projects"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary transition-colors"
            >
              <ArrowLeft size={14} />
              Back to active
            </Link>
          ) : (
            <Link
              href="/projects?view=archived"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary transition-colors"
            >
              <Archive size={14} />
              Archived
            </Link>
          )}
          {access.canWrite && !archivedOnly && (
            <>
              <Link
                href="/projects/templates"
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary transition-colors"
              >
                <LayoutTemplate size={14} />
                Templates
              </Link>
              <Link
                href="/projects/new"
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                <Plus size={15} />
                New Project
              </Link>
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
