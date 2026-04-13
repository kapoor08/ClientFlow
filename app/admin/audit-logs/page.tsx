import { adminAuditLogsSearchParamsCache } from "@/schemas/admin/audit-logs";
import { listAdminAuditLogs } from "@/server/admin/audit-logs";
import AdminAuditLogsPage from "./index";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[]>>;
}) {
  const { q, page, pageSize, entityType, dateFrom, dateTo } =
    adminAuditLogsSearchParamsCache.parse(await searchParams);

  const result = await listAdminAuditLogs({
    query: q || undefined,
    page,
    pageSize,
    entityType: entityType || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  });

  return <AdminAuditLogsPage data={result.data} pagination={result.pagination} />;
}
