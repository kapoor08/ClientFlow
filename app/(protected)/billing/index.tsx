import { ListPageLayout } from "@/components/layout/ListPageLayout";
import { getServerSession } from "@/lib/get-session";
import { getBillingContextForUser } from "@/lib/billing";
import { BillingContent } from "./BillingContent";

type BillingPageProps = {
  searchParams: Promise<Record<string, string | string[]>>;
};

const BillingPage = async ({ searchParams }: BillingPageProps) => {
  const session = await getServerSession();
  const params = await searchParams;

  const billing = await getBillingContextForUser(session!.user.id);

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
  };

  const showSuccess = params["success"] === "1";
  const showCanceled = params["canceled"] === "1";

  return (
    <ListPageLayout
      title="Billing"
      description="Manage your subscription and invoices"
    >
      <BillingContent
        billing={serialized}
        showSuccess={showSuccess}
        showCanceled={showCanceled}
      />
    </ListPageLayout>
  );
};

export default BillingPage;
