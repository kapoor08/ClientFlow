import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ListPageLayout } from "@/components/layout/ListPageLayout";
import { InvitationsTable } from "@/components/tables/InvitationsTable";
import { listInvitationsForOrg } from "@/lib/invitations";
import { getServerSession } from "@/lib/get-session";
import { invitationsSearchParamsCache } from "@/core/invitations/searchParams";
import { redirect } from "next/navigation";

type InvitationsPageProps = {
  searchParams: Promise<Record<string, string | string[]>>;
};

const InvitationsPage = async ({ searchParams }: InvitationsPageProps) => {
  const session = await getServerSession();
  const { q, status, sort, order, dateFrom, dateTo, page, pageSize } =
    invitationsSearchParamsCache.parse(await searchParams);

  const result = await listInvitationsForOrg(session!.user.id, {
    query: q,
    status: status || undefined,
    sort: sort || undefined,
    order: sort ? (order === "asc" ? "asc" : "desc") : "desc",
    dateFrom: dateFrom ? new Date(dateFrom) : undefined,
    dateTo: dateTo ? new Date(dateTo) : undefined,
    page,
    pageSize,
  });

  if (!result.access) redirect("/unauthorized");

  // Serialize Dates to ISO strings for client component
  const initialInvitations = result.invitations.map((inv) => ({
    ...inv,
    expiresAt:
      inv.expiresAt instanceof Date
        ? inv.expiresAt.toISOString()
        : inv.expiresAt,
    acceptedAt:
      inv.acceptedAt instanceof Date
        ? inv.acceptedAt.toISOString()
        : inv.acceptedAt,
    revokedAt:
      inv.revokedAt instanceof Date
        ? inv.revokedAt.toISOString()
        : inv.revokedAt,
    createdAt:
      inv.createdAt instanceof Date
        ? inv.createdAt.toISOString()
        : inv.createdAt,
  }));

  return (
    <ListPageLayout
      title="Invitations"
      description={`Manage team invitations for ${result.access.organizationName}`}
      action={
        result.access.canWrite ? (
          <Button asChild>
            <Link href="/invitations/new">
              <Plus size={16} className="mr-1.5" />
              Send Invite
            </Link>
          </Button>
        ) : undefined
      }
    >
      <InvitationsTable
        initialInvitations={initialInvitations}
        pagination={result.pagination}
      />
    </ListPageLayout>
  );
};

export default InvitationsPage;
