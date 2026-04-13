import { PageHeader } from "@/components/ui/page-header";
import { InvitationsTable } from "@/components/admin/invitations";
import type { AdminInvitationRow } from "@/server/admin/invitations";
import type { PaginationMeta } from "@/utils/pagination";

type Props = {
  data: AdminInvitationRow[];
  pagination: PaginationMeta;
};

export default function AdminInvitationsPage({ data, pagination }: Props) {
  return (
    <div>
      <PageHeader
        title="Invitations"
        description={`${pagination.total} invitation${pagination.total === 1 ? "" : "s"} across all organizations`}
      />
      <InvitationsTable data={data} pagination={pagination} />
    </div>
  );
}
