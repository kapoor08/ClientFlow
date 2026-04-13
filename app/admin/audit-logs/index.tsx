import { PageHeader } from "@/components/ui/page-header";
import { AuditLogsTable } from "@/components/admin/audit-logs";
import type { AdminAuditLogRow } from "@/server/admin/audit-logs";
import type { PaginationMeta } from "@/utils/pagination";

type Props = {
  data: AdminAuditLogRow[];
  pagination: PaginationMeta;
};

export default function AdminAuditLogsPage({ data, pagination }: Props) {
  return (
    <div>
      <PageHeader title="Audit Logs" description="Platform-wide activity trail" />
      <AuditLogsTable data={data} pagination={pagination} />
    </div>
  );
}
