import { adminUsersSearchParamsCache } from "@/schemas/admin/users";
import { listAdminUsers } from "@/server/admin/users";
import AdminUsersPage from "./index";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[]>>;
}) {
  const { q, page, pageSize, sort, order, verified, platformAdmin } =
    adminUsersSearchParamsCache.parse(await searchParams);

  const result = await listAdminUsers({
    query: q || undefined,
    page,
    pageSize,
    sort: sort || undefined,
    order: (order === "asc" ? "asc" : "desc"),
    verified: verified || undefined,
    platformAdmin: platformAdmin || undefined,
  });

  return <AdminUsersPage data={result.data} pagination={result.pagination} />;
}
