import { adminContactSearchParamsCache } from "@/schemas/admin/support";
import { listAdminContactSubmissions } from "@/server/admin/support";
import AdminContactSubmissionsPage from "./index";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[]>>;
}) {
  const { q, page, pageSize, status } = adminContactSearchParamsCache.parse(
    await searchParams,
  );

  const result = await listAdminContactSubmissions({
    query: q || undefined,
    page,
    pageSize,
    status: status || undefined,
  });

  return <AdminContactSubmissionsPage data={result.data} pagination={result.pagination} />;
}
