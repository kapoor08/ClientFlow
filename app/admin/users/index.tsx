import { PageHeader } from "@/components/ui/page-header";
import { UsersTable } from "@/components/admin/users";
import type { AdminUserRow } from "@/server/admin/users";
import type { PaginationMeta } from "@/utils/pagination";

type Props = {
  data: AdminUserRow[];
  pagination: PaginationMeta;
};

export default function AdminUsersPage({ data, pagination }: Props) {
  return (
    <div>
      <PageHeader
        title="Users"
        description={`${pagination.total} registered user${pagination.total === 1 ? "" : "s"}`}
      />
      <UsersTable data={data} pagination={pagination} />
    </div>
  );
}
