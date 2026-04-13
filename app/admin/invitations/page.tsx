import { adminInvitationsSearchParamsCache } from "@/schemas/admin/invitations";
import { listAdminInvitations } from "@/server/admin/invitations";
import AdminInvitationsPage from "./index";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[]>>;
}) {
  const { q, page, pageSize, status } =
    adminInvitationsSearchParamsCache.parse(await searchParams);

  const result = await listAdminInvitations({
    query: q || undefined,
    page,
    pageSize,
    status: status || undefined,
  });

  return <AdminInvitationsPage data={result.data} pagination={result.pagination} />;
}
