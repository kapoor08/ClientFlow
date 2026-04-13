import { PageHeader } from "@/components/ui/page-header";
import { ContactSubmissionsTable } from "@/components/admin/support";
import type { AdminContactSubmissionRow } from "@/server/admin/support";
import type { PaginationMeta } from "@/utils/pagination";

type Props = {
  data: AdminContactSubmissionRow[];
  pagination: PaginationMeta;
};

export default function AdminContactSubmissionsPage({ data, pagination }: Props) {
  return (
    <div>
      <PageHeader
        title="Contact Submissions"
        description="Messages submitted via the public contact form"
      />
      <ContactSubmissionsTable data={data} pagination={pagination} />
    </div>
  );
}
