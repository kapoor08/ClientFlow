import { ListPageLayout } from "@/components/layout/templates/ListPageLayout";
import { getServerSession } from "@/server/auth/session";
import { getBillingContextForUser } from "@/server/billing";
import { getPublicPlans } from "@/server/public/plans";
import { billingSearchParamsCache } from "@/core/billing/searchParams";
import { BillingContent } from "@/components/billing";

type BillingPageProps = {
  searchParams: Promise<Record<string, string | string[]>>;
};

const BillingPage = async ({ searchParams }: BillingPageProps) => {
  const session = await getServerSession();
  const params = await searchParams;
  const { dateFrom, dateTo, status, page, pageSize } =
    billingSearchParamsCache.parse(params);

  const billing = await getBillingContextForUser(session!.user.id, {
    dateFrom: dateFrom ? new Date(dateFrom) : undefined,
    dateTo: dateTo ? new Date(dateTo) : undefined,
    status: status || undefined,
    page,
    pageSize,
  });

  if (!billing) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">No active organization found.</p>
      </div>
    );
  }

  // Serialize Date objects to ISO strings for client components
  const serialized = {
    subscription: billing.subscription
      ? {
          ...billing.subscription,
          currentPeriodEnd:
            billing.subscription.currentPeriodEnd instanceof Date
              ? billing.subscription.currentPeriodEnd.toISOString()
              : billing.subscription.currentPeriodEnd,
        }
      : null,
    usage: billing.usage,
    invoices: billing.invoices.map((inv) => ({
      ...inv,
      dueAt: inv.dueAt instanceof Date ? inv.dueAt.toISOString() : inv.dueAt,
      paidAt: inv.paidAt instanceof Date ? inv.paidAt.toISOString() : inv.paidAt,
      createdAt:
        inv.createdAt instanceof Date ? inv.createdAt.toISOString() : String(inv.createdAt),
    })),
    invoicePagination: billing.invoicePagination,
  };

  const showSuccess = params["success"] === "1";
  const showCanceled = params["canceled"] === "1";
  const plans = await getPublicPlans();

  return (
    <ListPageLayout
      title="Billing"
      description="Manage your subscription and invoices"
    >
      <BillingContent
        billing={serialized}
        showSuccess={showSuccess}
        showCanceled={showCanceled}
        plans={plans}
      />
    </ListPageLayout>
  );
};

export default BillingPage;
