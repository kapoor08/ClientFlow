import { adminSupportSearchParamsCache } from "@/schemas/admin/support";
import { listAdminTickets } from "@/server/admin/support";
import AdminSupportPage from "./index";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[]>>;
}) {
  const { q, page, pageSize, status, priority, category } =
    adminSupportSearchParamsCache.parse(await searchParams);

  const result = await listAdminTickets({
    query: q || undefined,
    page,
    pageSize,
    status: status || undefined,
    priority: priority || undefined,
    category: category || undefined,
  });

  return <AdminSupportPage data={result.data} pagination={result.pagination} />;
}
