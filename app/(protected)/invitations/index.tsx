import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InvitationsTable } from "@/components/tables/InvitationsTable";
import { listInvitationsForOrg } from "@/lib/invitations";
import { getServerSession } from "@/lib/get-session";
import { redirect } from "next/navigation";

const InvitationsPage = async () => {
  const session = await getServerSession();
  const result = await listInvitationsForOrg(session!.user.id, {
    page: 1,
    pageSize: 50,
  });

  if (!result.access) redirect("/unauthorized");

  // Serialize Dates to ISO strings for client component
  const initialInvitations = result.invitations.map((inv) => ({
    ...inv,
    expiresAt: inv.expiresAt instanceof Date ? inv.expiresAt.toISOString() : inv.expiresAt,
    acceptedAt: inv.acceptedAt instanceof Date ? inv.acceptedAt.toISOString() : inv.acceptedAt,
    revokedAt: inv.revokedAt instanceof Date ? inv.revokedAt.toISOString() : inv.revokedAt,
    createdAt: inv.createdAt instanceof Date ? inv.createdAt.toISOString() : inv.createdAt,
  }));

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground">
            Invitations
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage team invitations for {result.access.organizationName}
          </p>
        </div>
        {result.access.canWrite && (
          <Button asChild>
            <Link href="/invitations/new">
              <Plus size={16} className="mr-1.5" /> Send Invite
            </Link>
          </Button>
        )}
      </div>

      <InvitationsTable initialInvitations={initialInvitations} />
    </div>
  );
};

export default InvitationsPage;
