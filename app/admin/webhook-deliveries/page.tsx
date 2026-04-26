import { PageHeader } from "@/components/ui/page-header";
import { WebhookDeliveriesTable } from "@/components/admin/webhook-deliveries/WebhookDeliveriesTable";
import { listWebhookDeliveries } from "@/server/admin/webhook-deliveries";
import { adminWebhookDeliveriesSearchParamsCache } from "@/schemas/admin/webhook-deliveries";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[]>>;
}) {
  const { page, pageSize, status } = adminWebhookDeliveriesSearchParamsCache.parse(
    await searchParams,
  );

  const result = await listWebhookDeliveries({
    page,
    pageSize,
    status: (status || "exhausted") as "exhausted" | "permanent_fail" | "delivered" | "all",
  });

  return (
    <div>
      <PageHeader
        title="Webhook deliveries"
        description="Failed deliveries can be replayed once the receiving endpoint is healthy again."
      />
      <WebhookDeliveriesTable data={result.data} pagination={result.pagination} />
    </div>
  );
}
