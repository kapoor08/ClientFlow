"use client";

import { useState } from "react";
import Link from "next/link";
import { FolderKanban, Mail, Phone, User } from "lucide-react";
import { DataTable, RowActions, type ColumnDef } from "@/components/data-table";
import { toast } from "sonner";
import { getUserInitials } from "@/core/auth";
import { useDeleteClient } from "@/core/clients/useCase";
import type { PaginationMeta } from "@/lib/pagination";
import type { ClientListItem } from "@/lib/clients";

// ─── Shared helpers ───────────────────────────────────────────────────────────

const statusBadge: Record<ClientListItem["status"], string> = {
  active: "bg-success/10 text-success",
  inactive: "bg-neutral-300/50 text-neutral-700",
  archived: "bg-neutral-300/50 text-neutral-500",
};

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(value);
}

function ClientAvatar({
  name,
  email,
  size = "sm",
}: {
  name: string;
  email: string | null;
  size?: "sm" | "md";
}) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-brand-100 font-semibold text-primary ${
        size === "md" ? "h-10 w-10 text-sm" : "h-8 w-8 text-xs"
      }`}
    >
      {getUserInitials(name, email)}
    </div>
  );
}

// ─── Table columns ────────────────────────────────────────────────────────────

function buildColumns(
  canWrite: boolean,
  deletingId: string | null,
  onDelete: (clientId: string) => void,
): ColumnDef<ClientListItem>[] {
  return [
    {
      key: "actions",
      header: "Actions",
      cell: (client) => (
        <RowActions
          viewHref={`/clients/${client.id}`}
          editHref={canWrite ? `/clients/${client.id}/edit` : undefined}
          onDelete={canWrite ? () => onDelete(client.id) : undefined}
          isDeleting={deletingId === client.id}
          deleteLabel={client.name}
        />
      ),
    },
    {
      key: "name",
      header: "Client",
      sortable: true,
      cell: (client) => (
        <Link href={`/clients/${client.id}`} className="flex items-center gap-3">
          <ClientAvatar name={client.name} email={client.contactEmail} />
          <div>
            <span className="font-medium text-foreground hover:text-primary">
              {client.name}
            </span>
            <span className="block text-xs text-muted-foreground md:hidden">
              {client.company || "No company"}
            </span>
          </div>
        </Link>
      ),
    },
    {
      key: "company",
      header: "Company",
      sortable: true,
      hideOnTablet: true,
      cell: (client) => (
        <span className="text-muted-foreground">{client.company || "—"}</span>
      ),
    },
    {
      key: "contact",
      header: "Contact",
      hideOnMobile: true,
      cell: (client) => (
        <div>
          <p className="text-sm">{client.contactName || "No primary contact"}</p>
          <p className="text-xs text-muted-foreground">
            {client.contactEmail || client.contactPhone || "—"}
          </p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      cell: (client) => (
        <span
          className={`inline-flex rounded-pill px-2 py-0.5 text-xs font-medium capitalize ${statusBadge[client.status]}`}
        >
          {client.status}
        </span>
      ),
    },
    {
      key: "projectCount",
      header: "Projects",
      hideOnMobile: true,
      cell: (client) => (
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <FolderKanban size={13} />
          <span>{client.projectCount}</span>
        </div>
      ),
    },
    {
      key: "updatedAt",
      header: "Updated",
      sortable: true,
      hideOnTablet: true,
      cell: (client) => (
        <span className="text-xs text-muted-foreground">
          {formatDate(client.updatedAt)}
        </span>
      ),
    },
  ];
}

// ─── Grid card ────────────────────────────────────────────────────────────────

function ContactRow({
  icon: Icon,
  value,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  value: string | null | undefined;
}) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-secondary">
        <Icon size={11} className="text-muted-foreground" />
      </div>
      <span className="truncate text-xs text-muted-foreground">{value}</span>
    </div>
  );
}

function ClientGridCard({ client }: { client: ClientListItem }) {
  const hasContact =
    client.contactName || client.contactEmail || client.contactPhone;

  return (
    <Link
      href={`/clients/${client.id}`}
      className="group flex flex-col rounded-card border border-border bg-card shadow-cf-1 transition-all hover:border-primary/30 hover:shadow-cf-2"
    >
      {/* Header */}
      <div className="flex items-start gap-3 p-5 pb-4">
        <ClientAvatar
          name={client.name}
          email={client.contactEmail}
          size="md"
        />
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold text-foreground transition-colors group-hover:text-primary">
            {client.name}
          </h3>
          <p className="truncate text-xs text-muted-foreground">
            {client.company || "No company"}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-pill px-2 py-0.5 text-xs font-medium capitalize ${statusBadge[client.status]}`}
        >
          {client.status}
        </span>
      </div>

      {/* Contact details */}
      {hasContact && (
        <div className="flex flex-col gap-2 border-t border-border/60 px-5 py-3.5">
          <ContactRow icon={User} value={client.contactName} />
          <ContactRow icon={Mail} value={client.contactEmail} />
          <ContactRow icon={Phone} value={client.contactPhone} />
        </div>
      )}

      {/* Footer */}
      <div
        className={`flex items-center justify-between px-5 py-3 ${hasContact ? "border-t border-border/60" : "mt-auto border-t border-border/60"}`}
      >
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <FolderKanban size={12} />
          <span className="text-xs">
            {client.projectCount}{" "}
            {client.projectCount === 1 ? "project" : "projects"}
          </span>
        </div>
        <span className="text-[10px] text-muted-foreground">
          Updated {formatDate(client.updatedAt)}
        </span>
      </div>
    </Link>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────

type ClientsTableProps = {
  clients: ClientListItem[];
  pagination: PaginationMeta;
  canWrite: boolean;
};

export function ClientsTable({
  clients,
  pagination,
  canWrite,
}: ClientsTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const deleteClient = useDeleteClient();

  const handleDelete = async (clientId: string) => {
    setDeletingId(clientId);
    try {
      await deleteClient.mutateAsync({ clientId });
      toast.success("Client deleted.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete client.");
    } finally {
      setDeletingId(null);
    }
  };

  const columns = buildColumns(canWrite, deletingId, handleDelete);

  return (
    <DataTable
      data={clients}
      columns={columns}
      getRowKey={(c) => c.id}
      searchPlaceholder="Search clients…"
      pagination={pagination}
      gridCard={(client) => <ClientGridCard client={client} />}
      gridCols={3}
      emptyTitle="No clients found."
      emptyDescription="Try a different search term or create your first client."
      emptyAction={
        canWrite ? (
          <Link
            href="/clients/new"
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Create Client
          </Link>
        ) : undefined
      }
    />
  );
}
