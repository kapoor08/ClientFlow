import { ListPageLayout } from "@/components/layout/ListPageLayout";
import { getServerSession } from "@/lib/get-session";
import { getOrganizationSettingsContextForUser } from "@/lib/organization-settings";
import { listInvoicesForUser } from "@/lib/invoices";
import { listClientsForUser } from "@/lib/clients";
import { invoicesSearchParamsCache } from "@/core/invoices/searchParams";
import { InvoicesTable } from "@/components/tables/InvoicesTable";
import { CreateInvoiceButton } from "./CreateInvoiceButton";

type InvoicesPageProps = {
  searchParams: Promise<Record<string, string | string[]>>;
};

const InvoicesPage = async ({ searchParams }: InvoicesPageProps) => {
  const session = await getServerSession();
  const { q, status, sort, order, dateFrom, dateTo, page, pageSize } =
    invoicesSearchParamsCache.parse(await searchParams);

  const [result, ctx, clientsResult] = await Promise.all([
    listInvoicesForUser(session!.user.id, {
      query: q,
      status: status || undefined,
      sort: sort || undefined,
      order: (order as "asc" | "desc") || "desc",
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined,
      page,
      pageSize,
    }),
    getOrganizationSettingsContextForUser(session!.user.id),
    listClientsForUser(session!.user.id, { pageSize: 200 }),
  ]);

  if (!result) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">No active organization found.</p>
      </div>
    );
  }

  const canManage = ctx?.canManageSettings ?? false;

  const clients = clientsResult.clients.map((c) => ({ id: c.id, name: c.name }));

  // Serialize Date objects to ISO strings for client components
  const invoices = result.invoices.map((inv) => ({
    ...inv,
    dueAt: inv.dueAt instanceof Date ? inv.dueAt.toISOString() : inv.dueAt,
    paidAt: inv.paidAt instanceof Date ? inv.paidAt.toISOString() : inv.paidAt,
    sentAt: inv.sentAt instanceof Date ? inv.sentAt.toISOString() : inv.sentAt,
    createdAt:
      inv.createdAt instanceof Date ? inv.createdAt.toISOString() : String(inv.createdAt),
  }));

  return (
    <ListPageLayout
      title="Invoices"
      description="Manage and track client invoices"
      action={canManage ? <CreateInvoiceButton clients={clients} /> : undefined}
    >
      <InvoicesTable initialInvoices={invoices} pagination={result.pagination} />
    </ListPageLayout>
  );
};

export default InvoicesPage;
