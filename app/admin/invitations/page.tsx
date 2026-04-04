import { formatDistanceToNow } from "date-fns";
import { Mail } from "lucide-react";
import { listAdminInvitations } from "@/lib/admin-data";
import { RevokeInvitationButton } from "./RevokeInvitationButton";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/common/StatusBadge";
import { EmptyState } from "@/components/common/EmptyState";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-warning/10 text-warning",
  accepted: "bg-success/10 text-success",
  revoked: "bg-secondary text-muted-foreground",
  expired: "bg-danger/10 text-danger",
};

export default async function AdminInvitationsPage() {
  const invitations = await listAdminInvitations();

  return (
    <div>
      <PageHeader
        title="Invitations"
        description={`${invitations.length} invitations across all organizations`}
      />

      {invitations.length === 0 ? (
        <EmptyState icon={Mail} title="No invitations found." />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-cf-1">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invitee</TableHead>
                <TableHead>Organization</TableHead>
                <TableHead className="hidden sm:table-cell">Role</TableHead>
                <TableHead className="hidden md:table-cell">Status</TableHead>
                <TableHead className="hidden lg:table-cell">Expires</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {invitations.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell>
                    <p className="font-medium text-foreground">{inv.email}</p>
                    {inv.inviterName && (
                      <p className="text-xs text-muted-foreground">by {inv.inviterName}</p>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{inv.orgName}</TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground capitalize">
                    {inv.roleName}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <StatusBadge status={inv.status} colorMap={STATUS_COLORS} />
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(inv.expiresAt), { addSuffix: true })}
                  </TableCell>
                  <TableCell className="text-right">
                    {inv.status === "pending" && (
                      <RevokeInvitationButton invitationId={inv.id} />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
