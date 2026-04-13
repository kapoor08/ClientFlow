import { PageHeader } from "@/components/ui/page-header";
import { ApiKeysTable } from "@/components/admin/api-keys";
import type { AdminApiKeyRow } from "@/server/admin/api-keys";
import type { PaginationMeta } from "@/utils/pagination";

type Props = {
  data: AdminApiKeyRow[];
  pagination: PaginationMeta;
};

export default function AdminApiKeysPage({ data, pagination }: Props) {
  return (
    <div>
      <PageHeader
        title="API Keys"
        description={`${pagination.total} API key${pagination.total === 1 ? "" : "s"} across all organizations`}
      />
      <ApiKeysTable data={data} pagination={pagination} />
    </div>
  );
}
