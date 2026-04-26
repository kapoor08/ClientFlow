import { PageHeader } from "@/components/ui/page-header";
import { BillingWebhookEventsTable } from "@/components/admin/billing-webhook-events/BillingWebhookEventsTable";
import { listBillingWebhookEvents } from "@/server/admin/billing-webhook-events";
import { adminBillingWebhookEventsSearchParamsCache } from "@/schemas/admin/billing-webhook-events";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[]>>;
}) {
  const { page, pageSize, status } = adminBillingWebhookEventsSearchParamsCache.parse(
    await searchParams,
  );

  const result = await listBillingWebhookEvents({
    page,
    pageSize,
    status: (status || "failed") as "failed" | "processed" | "all",
  });

  return (
    <div>
      <PageHeader
        title="Stripe webhook events"
        description="Inbound events from Stripe. Failed rows can be replayed once the underlying issue is fixed - the same dispatcher the live route uses runs the replay."
      />
      <BillingWebhookEventsTable data={result.data} pagination={result.pagination} />
    </div>
  );
}
