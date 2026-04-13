import { adminOrgsSearchParamsCache } from "@/schemas/admin/organizations";
import { listAdminOrganizations } from "@/server/admin/organizations";
import AdminOrganizationsPage from "./index";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[]>>;
}) {
  const { q, page, pageSize, sort, order, status, plan } =
    adminOrgsSearchParamsCache.parse(await searchParams);

  const result = await listAdminOrganizations({
    query: q || undefined,
    page,
    pageSize,
    sort: sort || undefined,
    order: (order === "asc" ? "asc" : "desc"),
    status: status || undefined,
    plan: plan || undefined,
  });

  return <AdminOrganizationsPage data={result.data} pagination={result.pagination} />;
}
