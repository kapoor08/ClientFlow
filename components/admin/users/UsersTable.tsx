"use client";

import Link from "next/link";
import { useTransition } from "react";
import { formatDistanceToNow } from "date-fns";
import { ShieldCheck, ExternalLink, MailCheck, KeyRound } from "lucide-react";
import { parseAsString, useQueryStates } from "nuqs";
import { DataTable, FiltersPopover, type ColumnDef } from "@/components/data-table";
import { AdminUserActions } from "./AdminUserActions";
import type { AdminUserRow } from "@/server/admin/users";
import type { PaginationMeta } from "@/utils/pagination";

const VERIFIED_OPTIONS = [
  { value: "true", label: "Verified" },
  { value: "false", label: "Unverified" },
];

const ADMIN_OPTIONS = [
  { value: "true", label: "Platform admins only" },
];

const columns: ColumnDef<AdminUserRow>[] = [
  {
    key: "name",
    header: "User",
    sortable: true,
    cell: (u) => (
      <div className="flex items-center gap-2.5">
        {u.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={u.image} alt={u.name} className="h-7 w-7 rounded-full object-cover shrink-0" />
        ) : (
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[10px] font-bold text-primary">
            {u.name.slice(0, 2).toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="font-medium text-foreground truncate">{u.name}</p>
            {u.isPlatformAdmin && (
              <ShieldCheck size={12} className="text-danger shrink-0" aria-label="Platform Admin" />
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate">{u.email}</p>
        </div>
      </div>
    ),
  },
  {
    key: "orgCount",
    header: "Orgs",
    hideOnMobile: true,
    cell: (u) => <span className="text-muted-foreground">{u.orgCount}</span>,
  },
  {
    key: "emailVerified",
    header: "Verified",
    hideOnTablet: true,
    cell: (u) => (
      <MailCheck size={14} className={u.emailVerified ? "text-success" : "text-muted-foreground/40"} />
    ),
  },
  {
    key: "twoFactorEnabled",
    header: "MFA",
    hideOnTablet: true,
    cell: (u) => (
      <KeyRound size={14} className={u.twoFactorEnabled ? "text-success" : "text-muted-foreground/40"} />
    ),
  },
  {
    key: "createdAt",
    header: "Joined",
    sortable: true,
    hideOnMobile: true,
    cell: (u) => (
      <span className="text-xs text-muted-foreground">
        {formatDistanceToNow(new Date(u.createdAt), { addSuffix: true })}
      </span>
    ),
  },
  {
    key: "actions",
    header: "",
    headerClassName: "w-16",
    cell: (u) => (
      <div className="flex items-center justify-end gap-1">
        <Link
          href={`/admin/users/${u.id}`}
          className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          title="View profile"
        >
          <ExternalLink size={13} />
        </Link>
        <AdminUserActions userId={u.id} userName={u.name} />
      </div>
    ),
  },
];

type Props = {
  data: AdminUserRow[];
  pagination: PaginationMeta;
};

export function UsersTable({ data, pagination }: Props) {
  const [, startTransition] = useTransition();

  const [{ verified, platformAdmin }, setFilters] = useQueryStates(
    {
      verified: parseAsString.withDefault(""),
      platformAdmin: parseAsString.withDefault(""),
      page: parseAsString.withDefault(""),
    },
    { shallow: false, startTransition, clearOnDefault: true },
  );

  return (
    <DataTable
      data={data}
      columns={columns}
      getRowKey={(row) => row.id}
      searchPlaceholder="Search users…"
      searchExtra={
        <FiltersPopover
          filters={[
            {
              key: "verified",
              label: "Email",
              options: VERIFIED_OPTIONS,
              value: verified,
              onChange: (v) => setFilters({ verified: v || null, page: null }),
            },
            {
              key: "platformAdmin",
              label: "Role",
              options: ADMIN_OPTIONS,
              value: platformAdmin,
              onChange: (v) => setFilters({ platformAdmin: v || null, page: null }),
            },
          ]}
        />
      }
      pagination={pagination}
      emptyTitle="No users found."
      emptyDescription="Try adjusting your search or filters."
    />
  );
}
