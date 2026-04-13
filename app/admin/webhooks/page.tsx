import { adminWebhooksSearchParamsCache } from "@/schemas/admin/webhooks";
import { listAdminWebhooks } from "@/server/admin/webhooks";
import AdminWebhooksPage from "./index";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[]>>;
}) {
  const { q, page, pageSize, status } =
    adminWebhooksSearchParamsCache.parse(await searchParams);

  const result = await listAdminWebhooks({
    query: q || undefined,
    page,
    pageSize,
    status: status || undefined,
  });

  return <AdminWebhooksPage data={result.data} pagination={result.pagination} />;
}
