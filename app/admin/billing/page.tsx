import { adminBillingSearchParamsCache } from "@/schemas/admin/billing";
import { getAdminBillingStats, listAdminSubscriptions } from "@/server/admin/billing";
import { getAdminPlansWithLimits } from "@/server/admin/plans";
import AdminBillingPage from "./index";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[]>>;
}) {
  const { q, page, pageSize, status, plan, cycle } =
    adminBillingSearchParamsCache.parse(await searchParams);

  const [stats, result, allPlans] = await Promise.all([
    getAdminBillingStats(),
    listAdminSubscriptions({
      query: q || undefined,
      page,
      pageSize,
      status: status || undefined,
      plan: plan || undefined,
      cycle: cycle || undefined,
    }),
    getAdminPlansWithLimits(),
  ]);

  const planOptions = allPlans
    .filter((p) => p.isActive)
    .map((p) => ({ value: p.id, label: p.name }));

  return (
    <AdminBillingPage
      stats={stats}
      data={result.data}
      pagination={result.pagination}
      planOptions={planOptions}
    />
  );
}
