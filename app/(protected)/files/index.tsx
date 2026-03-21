import { ListPageLayout } from "@/components/layout/ListPageLayout";
import { FilesTable } from "@/components/tables/FilesTable";
import { getServerSession } from "@/lib/get-session";
import { listAllFilesForUser } from "@/lib/files";
import { filesSearchParamsCache } from "@/core/files/searchParams";

type FilesPageProps = {
  searchParams: Promise<Record<string, string | string[]>>;
};

export default async function FilesPage({ searchParams }: FilesPageProps) {
  const session = await getServerSession();
  const { q, page, pageSize } = filesSearchParamsCache.parse(await searchParams);

  const { access, files, pagination } = await listAllFilesForUser(
    session!.user.id,
    { query: q, page, pageSize },
  );

  if (!access) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">No active organization found.</p>
      </div>
    );
  }

  // Serialize Dates to ISO strings for client component
  const initialFiles = files.map((f) => ({
    ...f,
    createdAt: f.createdAt instanceof Date ? f.createdAt.toISOString() : f.createdAt,
  }));

  return (
    <ListPageLayout
      title="Files"
      description={`${pagination.total} file${pagination.total === 1 ? "" : "s"} across all projects`}
    >
      <FilesTable initialFiles={initialFiles} canWrite={access.canWrite} />
    </ListPageLayout>
  );
}
