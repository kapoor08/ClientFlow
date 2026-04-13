import { PageHeader } from "@/components/ui/page-header";
import { OrganizationsTable } from "@/components/admin/organizations";
import type { AdminOrgRow } from "@/server/admin/organizations";
import type { PaginationMeta } from "@/utils/pagination";

type Props = {
  data: AdminOrgRow[];
  pagination: PaginationMeta;
};

export default function AdminOrganizationsPage({ data, pagination }: Props) {
  return (
    <div>
      <PageHeader
        title="Organizations"
        description={`${pagination.total} workspace${pagination.total === 1 ? "" : "s"} on the platform`}
      />
      <OrganizationsTable data={data} pagination={pagination} />
    </div>
  );
}
