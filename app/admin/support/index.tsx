import { PageHeader } from "@/components/ui/page-header";
import { SupportTicketsTable } from "@/components/admin/support";
import type { AdminTicketRow } from "@/server/admin/support";
import type { PaginationMeta } from "@/utils/pagination";

type Props = {
  data: AdminTicketRow[];
  pagination: PaginationMeta;
};

export default function AdminSupportPage({ data, pagination }: Props) {
  return (
    <div>
      <PageHeader title="Support Tickets" description="All customer support requests" />
      <SupportTicketsTable data={data} pagination={pagination} />
    </div>
  );
}
