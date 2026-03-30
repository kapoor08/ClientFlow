import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ListPageLayout } from "@/components/layout/ListPageLayout";
import { getServerSession } from "@/lib/get-session";
import { listClientsForUser } from "@/lib/clients";
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

  return (
    <ListPageLayout
      title="Clients"
      description={
        orgName
          ? `${result.pagination.total} client${result.pagination.total === 1 ? "" : "s"} in ${orgName}`
          : "No active organization found for this account."
      }
      action={
        canWrite ? (
          <Button asChild>
            <Link href="/clients/new">
              <Plus size={16} /> Add Client
            </Link>
          </Button>
        ) : undefined
      }
    >
      {!result.access ? (
        <div className="rounded-card border border-border bg-card p-6 shadow-cf-1">
          <p className="text-sm text-muted-foreground">
            Complete workspace bootstrap before managing clients.
          </p>
        </div>
      ) : (
        <ClientsTable
          clients={result.clients}
          pagination={result.pagination}
          canWrite={canWrite}
        />
      )}
    </ListPageLayout>
  );
};

export default ClientsPage;
