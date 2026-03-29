"use client";

import {
  Mail,
  Clock,
  CheckCircle2,
  TimerOff,
  Ban,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { RowActions } from "@/components/data-table";
import type { InvitationListItem } from "@/core/invitations/entity";
import {
  useInvitations,
  useRevokeInvitation,
  useResendInvitation,
} from "@/core/invitations/useCase";

const statusConfig: Record<
  string,
  { label: string; className: string; Icon: React.ElementType }
> = {
  pending: {
    label: "Pending",
    className: "bg-warning/10 text-warning",
    Icon: Clock,
  },
  accepted: {
    label: "Accepted",
    className: "bg-success/10 text-success",
    Icon: CheckCircle2,
  },
  expired: {
    label: "Expired",
    className: "bg-neutral-300/50 text-neutral-500",
    Icon: TimerOff,
  },
  revoked: {
    label: "Revoked",
    className: "bg-danger/10 text-danger",
    Icon: Ban,
  },
};

const roleBadgeClass: Record<string, string> = {
  owner: "bg-brand-100 text-primary",
  admin: "bg-cf-accent-100 text-cf-accent-600",
  manager: "bg-info/10 text-info",
  member: "bg-secondary text-muted-foreground",
  client: "bg-warning/10 text-warning",
};

function InvitationRow({ invitation }: { invitation: InvitationListItem }) {
  const revoke = useRevokeInvitation();
  const resend = useResendInvitation();

  const isPending = invitation.status === "pending";
  const isExpired = invitation.status === "expired";
  const canResend = isPending || isExpired;
  const canRevoke = isPending;

  const statusCfg = statusConfig[invitation.status] ?? statusConfig.pending;
  const StatusIcon = statusCfg.Icon;

  const expiresAt = new Date(invitation.expiresAt);
  const expiresLabel =
    isPending
      ? `Expires ${formatDistanceToNow(expiresAt, { addSuffix: true })}`
      : isExpired
        ? `Expired ${formatDistanceToNow(expiresAt, { addSuffix: true })}`
        : "—";

  const sentAt = formatDistanceToNow(new Date(invitation.createdAt), {
    addSuffix: true,
  });

  const roleClass =
    roleBadgeClass[invitation.roleKey] ?? roleBadgeClass.member;

  return (
    <>
      <tr className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
        {/* Actions — first column */}
        <td className="px-4 py-3">
          <RowActions
            onResend={canResend ? () => resend.mutate(
              { invitationId: invitation.id },
              {
                onSuccess: () => toast.success("Invitation resent."),
                onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to resend invitation."),
              },
            ) : undefined}
            isResending={resend.isPending}
            onRevoke={canRevoke ? () => revoke.mutate(
              { invitationId: invitation.id },
              {
                onSuccess: () => toast.success("Invitation revoked."),
                onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to revoke invitation."),
              },
            ) : undefined}
            isRevoking={revoke.isPending}
            revokeLabel={invitation.email}
          />
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <Mail size={13} className="shrink-0 text-muted-foreground" />
            <span className="font-medium text-foreground text-sm">
              {invitation.email}
            </span>
          </div>
          {invitation.invitedByName && (
            <p className="mt-0.5 pl-5 text-xs text-muted-foreground">
              by {invitation.invitedByName}
            </p>
          )}
        </td>
        <td className="px-4 py-3">
          <span
            className={`inline-flex items-center rounded-pill px-2 py-0.5 text-xs font-medium capitalize ${roleClass}`}
          >
            {invitation.roleName}
          </span>
        </td>
        <td className="px-4 py-3">
          <span
            className={`inline-flex items-center gap-1 rounded-pill px-2 py-0.5 text-xs font-medium ${statusCfg.className}`}
          >
            <StatusIcon size={10} />
            {statusCfg.label}
          </span>
        </td>
        <td className="hidden px-4 py-3 text-xs text-muted-foreground sm:table-cell">
          {sentAt}
        </td>
        <td className="hidden px-4 py-3 text-xs text-muted-foreground md:table-cell">
          {expiresLabel}
        </td>
      </tr>
    </>
  );
}

type InvitationsTableProps = {
  initialInvitations: InvitationListItem[];
};

export function InvitationsTable({ initialInvitations }: InvitationsTableProps) {
  const { data } = useInvitations();
  const invitations = data?.invitations ?? initialInvitations;

  if (invitations.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-16 text-center">
        <Mail size={32} className="text-muted-foreground/30" />
        <p className="text-sm font-medium text-muted-foreground">
          No invitations yet
        </p>
        <p className="text-xs text-muted-foreground/70">
          Send an invitation to add someone to your organization.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-card border border-border bg-card shadow-cf-1">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-secondary/50">
            <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
              Actions
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
              Email
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
              Role
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
              Status
            </th>
            <th className="hidden px-4 py-3 text-left text-xs font-semibold text-muted-foreground sm:table-cell">
              Sent
            </th>
            <th className="hidden px-4 py-3 text-left text-xs font-semibold text-muted-foreground md:table-cell">
              Expires
            </th>
          </tr>
        </thead>
        <tbody>
          {invitations.map((inv) => (
            <InvitationRow key={inv.id} invitation={inv} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
