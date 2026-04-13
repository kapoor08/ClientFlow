import { adminApiKeysSearchParamsCache } from "@/schemas/admin/api-keys";
import { listAdminApiKeys } from "@/server/admin/api-keys";
import AdminApiKeysPage from "./index";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[]>>;
}) {
  const { q, page, pageSize, status } =
    adminApiKeysSearchParamsCache.parse(await searchParams);

  const result = await listAdminApiKeys({
    query: q || undefined,
    page,
    pageSize,
    status: status || undefined,
  });

  return <AdminApiKeysPage data={result.data} pagination={result.pagination} />;
}
