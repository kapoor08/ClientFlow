"use client";

import { formatDistanceToNow } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LocalDataTable, type ColumnDef } from "@/components/data-table";
import { RevokeSessionButton } from "./RevokeSessionButton";
import type { getAdminUserDetail } from "@/server/admin/users";

type Detail = NonNullable<Awaited<ReturnType<typeof getAdminUserDetail>>>;
type OrgRow = Detail["orgs"][number];
type SessionRow = Detail["sessions"][number];
type AuditRow = Detail["auditLogs"][number];

type Props = {
  userId: string;
  orgs: OrgRow[];
  sessions: SessionRow[];
  auditLogs: AuditRow[];
};

export function UserDetailTabs({ userId, orgs, sessions, auditLogs }: Props) {
  return (
    <Tabs defaultValue="organizations" className="space-y-6">
      <TabsList variant="line" className="border-border w-fit border-b pb-1">
        <TabsTrigger value="organizations" className="cursor-pointer px-4">
          Organizations ({orgs.length})
        </TabsTrigger>
        <TabsTrigger value="sessions" className="cursor-pointer px-4">
          Sessions ({sessions.length})
        </TabsTrigger>
        <TabsTrigger value="activity" className="cursor-pointer px-4">
          Activity
        </TabsTrigger>
      </TabsList>

      <TabsContent value="organizations">
        <OrganizationsTable orgs={orgs} />
      </TabsContent>

      <TabsContent value="sessions">
        <SessionsTable sessions={sessions} userId={userId} />
      </TabsContent>

      <TabsContent value="activity">
        <ActivityTable auditLogs={auditLogs} />
      </TabsContent>
    </Tabs>
  );
}

// ─── Organizations ───────────────────────────────────────────────────────────

function OrganizationsTable({ orgs }: { orgs: OrgRow[] }) {
  const roleOptions = uniqueOptions(orgs.map((o) => ({ value: o.roleKey, label: o.roleName })));
  const statusOptions = uniqueOptions(
    orgs.map((o) => ({
      value: o.status,
      label: o.status.charAt(0).toUpperCase() + o.status.slice(1),
    })),
  );

  const columns: ColumnDef<OrgRow>[] = [
    {
      key: "orgName",
      header: "Organization",
      sortable: true,
      cell: (o) => <span className="text-foreground font-medium">{o.orgName}</span>,
    },
    {
      key: "roleName",
      header: "Role",
      sortable: true,
      cell: (o) => <span className="text-muted-foreground capitalize">{o.roleName}</span>,
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      cell: (o) => (
        <span
          className={`inline-flex rounded-full px-2 py-0.5 text-xs capitalize ${o.status === "active" ? "bg-success/10 text-success" : "bg-secondary text-muted-foreground"}`}
        >
          {o.status}
        </span>
      ),
    },
    {
      key: "joinedAt",
      header: "Joined",
      sortable: true,
      hideOnMobile: true,
      cell: (o) => (
        <span className="text-muted-foreground text-xs">
          {o.joinedAt ? formatDistanceToNow(new Date(o.joinedAt), { addSuffix: true }) : "-"}
        </span>
      ),
    },
  ];

  return (
    <LocalDataTable
      data={orgs}
      columns={columns}
      getRowKey={(o) => o.orgId}
      searchPlaceholder="Search organizations…"
      searchAccessor={(o) => `${o.orgName} ${o.orgSlug} ${o.roleName}`}
      sortAccessors={{
        orgName: (o) => o.orgName,
        roleName: (o) => o.roleName,
        status: (o) => o.status,
        joinedAt: (o) => (o.joinedAt ? new Date(o.joinedAt) : null),
      }}
      filters={[
        { key: "role", label: "Role", options: roleOptions, match: (o, v) => o.roleKey === v },
        {
          key: "membershipStatus",
          label: "Status",
          options: statusOptions,
          match: (o, v) => o.status === v,
        },
      ]}
      emptyTitle="No organizations."
      emptyDescription="This user is not a member of any organization."
    />
  );
}

// ─── Sessions ────────────────────────────────────────────────────────────────

function SessionsTable({ sessions, userId }: { sessions: SessionRow[]; userId: string }) {
  const columns: ColumnDef<SessionRow>[] = [
    {
      key: "ipAddress",
      header: "IP Address",
      sortable: true,
      cell: (s) => (
        <span className="text-muted-foreground font-mono text-xs">{s.ipAddress ?? "-"}</span>
      ),
    },
    {
      key: "userAgent",
      header: "User Agent",
      hideOnTablet: true,
      cell: (s) => (
        <span className="text-muted-foreground block max-w-[260px] truncate text-xs">
          {s.userAgent ?? "-"}
        </span>
      ),
    },
    {
      key: "createdAt",
      header: "Created",
      sortable: true,
      cell: (s) => (
        <span className="text-muted-foreground text-xs">
          {formatDistanceToNow(new Date(s.createdAt), { addSuffix: true })}
        </span>
      ),
    },
    {
      key: "expiresAt",
      header: "Expires",
      sortable: true,
      cell: (s) => (
        <span className="text-muted-foreground text-xs">
          {formatDistanceToNow(new Date(s.expiresAt), { addSuffix: true })}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      headerClassName: "w-0",
      className: "text-right",
      cell: (s) => <RevokeSessionButton sessionId={s.id} userId={userId} />,
    },
  ];

  return (
    <LocalDataTable
      data={sessions}
      columns={columns}
      getRowKey={(s) => s.id}
      searchPlaceholder="Search by IP or user agent…"
      searchAccessor={(s) => `${s.ipAddress ?? ""} ${s.userAgent ?? ""}`}
      sortAccessors={{
        ipAddress: (s) => s.ipAddress ?? "",
        createdAt: (s) => new Date(s.createdAt),
        expiresAt: (s) => new Date(s.expiresAt),
      }}
      emptyTitle="No active sessions."
      emptyDescription="This user has no active sessions."
    />
  );
}

// ─── Activity ────────────────────────────────────────────────────────────────

function ActivityTable({ auditLogs }: { auditLogs: AuditRow[] }) {
  const actionOptions = uniqueOptions(auditLogs.map((l) => ({ value: l.action, label: l.action })));
  const entityOptions = uniqueOptions(
    auditLogs.map((l) => ({ value: l.entityType ?? "", label: l.entityType ?? "(none)" })),
  );

  const columns: ColumnDef<AuditRow>[] = [
    {
      key: "action",
      header: "Action",
      sortable: true,
      cell: (l) => <span className="text-foreground font-medium">{l.action}</span>,
    },
    {
      key: "entityType",
      header: "Entity",
      sortable: true,
      cell: (l) => <span className="text-muted-foreground text-xs">{l.entityType ?? "-"}</span>,
    },
    {
      key: "ipAddress",
      header: "IP",
      hideOnMobile: true,
      cell: (l) => (
        <span className="text-muted-foreground font-mono text-xs">{l.ipAddress ?? "-"}</span>
      ),
    },
    {
      key: "createdAt",
      header: "When",
      sortable: true,
      cell: (l) => (
        <span className="text-muted-foreground text-xs whitespace-nowrap">
          {formatDistanceToNow(new Date(l.createdAt), { addSuffix: true })}
        </span>
      ),
    },
  ];

  return (
    <LocalDataTable
      data={auditLogs}
      columns={columns}
      getRowKey={(l) => l.id}
      searchPlaceholder="Search activity…"
      searchAccessor={(l) =>
        `${l.action} ${l.entityType ?? ""} ${l.entityId ?? ""} ${l.ipAddress ?? ""}`
      }
      sortAccessors={{
        action: (l) => l.action,
        entityType: (l) => l.entityType ?? "",
        createdAt: (l) => new Date(l.createdAt),
      }}
      filters={[
        {
          key: "action",
          label: "Action",
          options: actionOptions,
          match: (l, v) => l.action === v,
        },
        {
          key: "entityType",
          label: "Entity",
          options: entityOptions,
          match: (l, v) => (l.entityType ?? "") === v,
        },
      ]}
      emptyTitle="No activity found."
      emptyDescription="This user hasn't performed any tracked actions."
    />
  );
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function uniqueOptions(options: { value: string; label: string }[]) {
  const seen = new Map<string, string>();
  for (const o of options) {
    if (!seen.has(o.value)) seen.set(o.value, o.label);
  }
  return Array.from(seen, ([value, label]) => ({ value, label }));
}
