import { Suspense } from "react";
import { ListPageLayout } from "@/components/layout/ListPageLayout";
import { AuditLogsTable } from "@/components/tables/AuditLogsTable";
import { getServerSession } from "@/lib/get-session";
import { listAuditLogsForUser } from "@/lib/audit";
import { auditSearchParamsCache } from "@/core/audit/searchParams";
import { AuditExportButton } from "./AuditExportButton";

type AuditLogsPageProps = {
  searchParams: Promise<Record<string, string | string[]>>;
};

const AuditLogsPage = async ({ searchParams }: AuditLogsPageProps) => {
  const session = await getServerSession();
  const { q, dateFrom, dateTo, page, pageSize } =
    auditSearchParamsCache.parse(await searchParams);

  const result = await listAuditLogsForUser(session!.user.id, {
    query: q,
    page,
    pageSize,
    dateFrom: dateFrom ? new Date(dateFrom) : undefined,
    dateTo: dateTo ? new Date(dateTo) : undefined,
  });

  if (!result) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">
          You do not have permission to view audit logs.
        </p>
      </div>
    );
  }

  // Serialize Dates to ISO strings for client component
  const initialLogs = result.logs.map((l) => ({
    ...l,
    createdAt:
      l.createdAt instanceof Date ? l.createdAt.toISOString() : l.createdAt,
  }));

  return (
    <ListPageLayout
      title="Audit Logs"
      description="Security-grade immutable action trail"
    >
      <AuditLogsTable
        initialLogs={initialLogs}
        pagination={result.pagination}
        exportButton={
          <Suspense>
            <AuditExportButton />
          </Suspense>
        }
      />
    </ListPageLayout>
  );
};

export default AuditLogsPage;
