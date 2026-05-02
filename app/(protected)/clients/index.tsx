import { ListPageLayout } from "@/components/layout/templates/ListPageLayout";
import { AtLimitNewButton } from "@/components/common/AtLimitNewButton";
import { getServerSession } from "@/server/auth/session";
import { listClientsForUser } from "@/server/clients";
import { getClientCapStatus } from "@/server/subscription/plan-enforcement";
import { ClientsTable } from "@/components/tables/ClientsTable";
import { clientsSearchParamsCache } from "@/core/clients/searchParams";

type ClientsPageProps = {
  searchParams: Promise<Record<string, string>>;
};

const ClientsPage = async ({ searchParams }: ClientsPageProps) => {
  const session = await getServerSession();

  const { q, page, pageSize, sort, order, status, dateFrom, dateTo } =
    clientsSearchParamsCache.parse(await searchParams);

  const result = await listClientsForUser(session!.user.id, {
    query: q,
    page,
    pageSize,
    sort,
    // When no column is actively sorted fall back to desc (newest first).
    // When a column is sorted use the explicit order from the URL.
    order: sort ? (order === "asc" ? "asc" : "desc") : "desc",
    status: status || undefined,
    dateFrom: dateFrom ? new Date(dateFrom) : undefined,
    dateTo: dateTo ? new Date(dateTo) : undefined,
  });

  const canWrite = result.access?.canWrite ?? false;
  const orgName = result.access?.organizationName;
  const orgId = result.access?.organizationId;
  const capStatus = canWrite && orgId ? await getClientCapStatus(orgId) : null;

  return (
    <ListPageLayout
      title="Clients"
      description={
        orgName
          ? `${result.pagination.total} client${result.pagination.total === 1 ? "" : "s"} in ${orgName}`
          : "No active organization found for this account."
      }
      action={
        canWrite && capStatus ? (
          <AtLimitNewButton href="/clients/new" label="Add Client" capStatus={capStatus} />
        ) : undefined
      }
    >
      {!result.access ? (
        <div className="rounded-card border-border bg-card shadow-cf-1 border p-6">
          <p className="text-muted-foreground text-sm">
            Complete workspace bootstrap before managing clients.
          </p>
        </div>
      ) : (
        <ClientsTable clients={result.clients} pagination={result.pagination} canWrite={canWrite} />
      )}
    </ListPageLayout>
  );
};

export default ClientsPage;
