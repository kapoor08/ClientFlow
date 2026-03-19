import Link from "next/link";
import { Plus } from "lucide-react";
import { listProjectsForUser } from "@/lib/projects";
import { projectsSearchParamsCache } from "@/core/projects/searchParams";
import { ListPageLayout } from "@/components/layout/ListPageLayout";
import { ProjectsTable } from "@/components/tables/ProjectsTable";
import { getServerSession } from "@/lib/get-session";

type ProjectsPageProps = {
  searchParams: Promise<Record<string, string | string[]>>;
};

export default async function ProjectsPage({ searchParams }: ProjectsPageProps) {
  const session = await getServerSession();
  const { q, page, pageSize, sort, order } =
    projectsSearchParamsCache.parse(await searchParams);

  const { access, projects, pagination } = await listProjectsForUser(
    session!.user.id,
    {
      query: q,
      page,
      pageSize,
      sort,
      order: sort ? (order === "asc" ? "asc" : "desc") : "desc",
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
      title="Projects"
      description={`${pagination.total} project${pagination.total === 1 ? "" : "s"} total`}
      action={
        access.canWrite ? (
          <Link
            href="/projects/new"
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus size={15} />
            New Project
          </Link>
        ) : undefined
      }
    >
      <ProjectsTable
        projects={projects}
        pagination={pagination}
        canWrite={access.canWrite}
      />
    </ListPageLayout>
  );
}
