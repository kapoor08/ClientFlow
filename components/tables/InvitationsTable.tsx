"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Mail, Clock, CheckCircle2, TimerOff, Ban } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { parseAsString, useQueryState } from "nuqs";
import { toast } from "sonner";
import {
  DataTable,
  DateRangeFilter,
  FiltersPopover,
  RowActions,
  type ColumnDef,
  type FilterGroupConfig,
} from "@/components/data-table";
import {
  useRevokeInvitation,
  useResendInvitation,
} from "@/core/invitations/useCase";
import type { InvitationListItem } from "@/core/invitations/entity";
import { INVITATION_STATUS_OPTIONS } from "@/lib/invitations-shared";
import type { PaginationMeta } from "@/lib/pagination";

// ─── Status / role config ─────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  string,
  { label: string; className: string; Icon: React.ElementType }
> = {
  pending: { label: "Pending", className: "bg-warning/10 text-warning", Icon: Clock },
  accepted: { label: "Accepted", className: "bg-success/10 text-success", Icon: CheckCircle2 },
  expired: { label: "Expired", className: "bg-neutral-300/50 text-neutral-500", Icon: TimerOff },
  revoked: { label: "Revoked", className: "bg-danger/10 text-danger", Icon: Ban },
};

const ROLE_BADGE_CLASS: Record<string, string> = {
  owner: "bg-brand-100 text-primary",
  admin: "bg-cf-accent-100 text-cf-accent-600",
  manager: "bg-info/10 text-info",
  member: "bg-secondary text-muted-foreground",
  client: "bg-warning/10 text-warning",
};

// ─── Column definitions ───────────────────────────────────────────────────────

function buildColumns(
  revokingId: string | null,
  resendingId: string | null,
  onRevoke: (id: string, email: string) => void,
  onResend: (id: string) => void,
): ColumnDef<InvitationListItem>[] {
  return [
    {
      key: "actions",
      header: "Actions",
      cell: (inv) => {
        const isPending = inv.status === "pending";
        const isExpired = inv.status === "expired";
        return (
          <RowActions
            onResend={isPending || isExpired ? () => onResend(inv.id) : undefined}
            isResending={resendingId === inv.id}
            onRevoke={isPending ? () => onRevoke(inv.id, inv.email) : undefined}
            isRevoking={revokingId === inv.id}
            revokeLabel={inv.email}
          />
        );
      },
    },
    {
      key: "email",
      header: "Email",
      sortable: true,
      cell: (inv) => (
        <div>
          <div className="flex items-center gap-2">
            <Mail size={13} className="shrink-0 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">{inv.email}</span>
          </div>
          {inv.invitedByName && (
            <p className="mt-0.5 pl-5 text-xs text-muted-foreground">
              by {inv.invitedByName}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "roleName",
      header: "Role",
      cell: (inv) => (
        <span
          className={`inline-flex items-center rounded-pill px-2 py-0.5 text-xs font-medium capitalize ${ROLE_BADGE_CLASS[inv.roleKey] ?? ROLE_BADGE_CLASS.member}`}
        >
          {inv.roleName}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (inv) => {
        const cfg = STATUS_CONFIG[inv.status] ?? STATUS_CONFIG.pending;
        const StatusIcon = cfg.Icon;
        return (
          <span
            className={`inline-flex items-center gap-1 rounded-pill px-2 py-0.5 text-xs font-medium ${cfg.className}`}
          >
            <StatusIcon size={10} />
            {cfg.label}
          </span>
        );
      },
    },
    {
      key: "createdAt",
      header: "Sent",
      sortable: true,
      hideOnMobile: true,
      cell: (inv) => (
        <span className="text-xs text-muted-foreground">
          {formatDistanceToNow(new Date(inv.createdAt), { addSuffix: true })}
        </span>
      ),
    },
    {
      key: "expiresAt",
      header: "Expires",
      sortable: true,
      hideOnTablet: true,
      cell: (inv) => {
        const expiresAt = new Date(inv.expiresAt);
        const label =
          inv.status === "pending"
            ? `Expires ${formatDistanceToNow(expiresAt, { addSuffix: true })}`
            : inv.status === "expired"
              ? `Expired ${formatDistanceToNow(expiresAt, { addSuffix: true })}`
              : "—";
        return <span className="text-xs text-muted-foreground">{label}</span>;
      },
    },
  ];
}

// ─── Export ───────────────────────────────────────────────────────────────────

type InvitationsTableProps = {
  initialInvitations: InvitationListItem[];
  pagination: PaginationMeta;
};

export function InvitationsTable({
  initialInvitations,
  pagination,
}: InvitationsTableProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);

  const revoke = useRevokeInvitation();
  const resend = useResendInvitation();

  const [status, setStatus] = useQueryState(
    "status",
    parseAsString
      .withDefault("")
      .withOptions({ shallow: false, startTransition, clearOnDefault: true }),
  );

  const handleRevoke = (id: string, email: string) => {
    setRevokingId(id);
    revoke.mutate(
      { invitationId: id },
      {
        onSuccess: () => {
          toast.success("Invitation revoked.");
          router.refresh();
        },
        onError: (err) =>
          toast.error(
            err instanceof Error ? err.message : "Failed to revoke invitation.",
          ),
        onSettled: () => setRevokingId(null),
      },
    );
  };

  const handleResend = (id: string) => {
    setResendingId(id);
    resend.mutate(
      { invitationId: id },
      {
        onSuccess: () => {
          toast.success("Invitation resent.");
          router.refresh();
        },
        onError: (err) =>
          toast.error(
            err instanceof Error ? err.message : "Failed to resend invitation.",
          ),
        onSettled: () => setResendingId(null),
      },
    );
  };

  const statusFilterOptions = INVITATION_STATUS_OPTIONS.map((o) => ({
    label: o.label,
    value: o.value,
  }));

  const filters: FilterGroupConfig[] = [
    {
      key: "status",
      label: "Status",
      options: statusFilterOptions,
      value: status,
      onChange: (value) => setStatus(value || null),
    },
  ];

  const columns = buildColumns(revokingId, resendingId, handleRevoke, handleResend);

  return (
    <DataTable
      data={initialInvitations}
      columns={columns}
      getRowKey={(inv) => inv.id}
      searchPlaceholder="Search by email…"
      searchExtra={
        <div className="flex items-center gap-2">
          <DateRangeFilter />
          <FiltersPopover filters={filters} />
        </div>
      }
      pagination={pagination}
      emptyTitle="No invitations found."
      emptyDescription="Send an invitation to add someone to your organization."
    />
  );
}
