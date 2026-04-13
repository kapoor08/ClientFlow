import { PageHeader } from "@/components/ui/page-header";
import { WebhooksTable } from "@/components/admin/webhooks";
import type { AdminWebhookRow } from "@/server/admin/webhooks";
import type { PaginationMeta } from "@/utils/pagination";

type Props = {
  data: AdminWebhookRow[];
  pagination: PaginationMeta;
};

export default function AdminWebhooksPage({ data, pagination }: Props) {
  return (
    <div>
      <PageHeader
        title="Webhooks"
        description={`${pagination.total} webhook${pagination.total === 1 ? "" : "s"} across all organizations`}
      />
      <WebhooksTable data={data} pagination={pagination} />
    </div>
  );
}
