"use client";

import { formatDistanceToNow } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LocalDataTable, type ColumnDef } from "@/components/data-table";
import type { getAdminOrgDetail } from "@/server/admin/organizations";

type Detail = NonNullable<Awaited<ReturnType<typeof getAdminOrgDetail>>>;
type MemberRow = Detail["members"][number];
type ProjectRow = Detail["projects"][number];
type ClientRow = Detail["clients"][number];

const TABS = ["overview", "members", "projects", "clients", "subscription", "settings"] as const;
const TAB_LABELS: Record<(typeof TABS)[number], string> = {
  overview: "Overview",
  members: "Members",
  projects: "Projects",
  clients: "Clients",
  subscription: "Subscription",
  settings: "Settings",
};

const ROLE_BADGE: Record<string, string> = {
  owner: "bg-brand-100 text-primary",
  admin: "bg-cf-accent-100 text-cf-accent-600",
  manager: "bg-info/10 text-info",
  member: "bg-secondary text-muted-foreground",
};

export function OrgDetailTabs({ detail }: { detail: Detail }) {
  const { org, settings, members, projects, clients, subscription } = detail;

  return (
    <Tabs defaultValue="overview" className="space-y-6">
      <TabsList variant="line" className="border-border w-fit border-b pb-1">
        {TABS.map((t) => (
          <TabsTrigger key={t} value={t} className="cursor-pointer px-4">
            {TAB_LABELS[t]}
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value="overview">
        <OverviewGrid org={org} />
      </TabsContent>

      <TabsContent value="members">
        <MembersTable members={members} />
      </TabsContent>

      <TabsContent value="projects">
        <ProjectsTable projects={projects} />
      </TabsContent>

      <TabsContent value="clients">
        <ClientsTable clients={clients} />
      </TabsContent>

      <TabsContent value="subscription">
        <SubscriptionGrid subscription={subscription} />
      </TabsContent>

      <TabsContent value="settings">
        <SettingsGrid settings={settings} />
      </TabsContent>
    </Tabs>
  );
}

// ─── Tables ──────────────────────────────────────────────────────────────────

function MembersTable({ members }: { members: MemberRow[] }) {
  const roleOptions = uniqueOptions(members.map((m) => ({ value: m.roleKey, label: m.roleName })));
  const statusOptions = uniqueOptions(
    members.map((m) => ({
      value: m.status,
      label: m.status.charAt(0).toUpperCase() + m.status.slice(1),
    })),
  );

  const columns: ColumnDef<MemberRow>[] = [
    {
      key: "userName",
      header: "Member",
      sortable: true,
      cell: (m) => (
        <div>
          <p className="text-foreground font-medium">{m.userName}</p>
          <p className="text-muted-foreground text-xs">{m.userEmail}</p>
        </div>
      ),
    },
    {
      key: "roleName",
      header: "Role",
      sortable: true,
      cell: (m) => (
        <span
          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${ROLE_BADGE[m.roleKey] ?? "bg-secondary text-muted-foreground"}`}
        >
          {m.roleName}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      cell: (m) => (
        <span
          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${m.status === "active" ? "bg-success/10 text-success" : "bg-secondary text-muted-foreground"}`}
        >
          {m.status}
        </span>
      ),
    },
    {
      key: "joinedAt",
      header: "Joined",
      sortable: true,
      cell: (m) => (
        <span className="text-muted-foreground text-xs">
          {m.joinedAt ? formatDistanceToNow(new Date(m.joinedAt), { addSuffix: true }) : "-"}
        </span>
      ),
    },
  ];

  return (
    <LocalDataTable
      data={members}
      columns={columns}
      getRowKey={(m) => m.id}
      searchPlaceholder="Search members…"
      searchAccessor={(m) => `${m.userName} ${m.userEmail} ${m.roleName}`}
      sortAccessors={{
        userName: (m) => m.userName,
        roleName: (m) => m.roleName,
        status: (m) => m.status,
        joinedAt: (m) => (m.joinedAt ? new Date(m.joinedAt) : null),
      }}
      filters={[
        { key: "role", label: "Role", options: roleOptions, match: (m, v) => m.roleKey === v },
        {
          key: "memberStatus",
          label: "Status",
          options: statusOptions,
          match: (m, v) => m.status === v,
        },
      ]}
      emptyTitle="No members."
      emptyDescription="No one has joined this organization yet."
    />
  );
}

function ProjectsTable({ projects }: { projects: ProjectRow[] }) {
  const statusOptions = uniqueOptions(
    projects.map((p) => ({
      value: p.status,
      label: p.status.charAt(0).toUpperCase() + p.status.slice(1),
    })),
  );

  const columns: ColumnDef<ProjectRow>[] = [
    {
      key: "name",
      header: "Project",
      sortable: true,
      cell: (p) => <span className="text-foreground font-medium">{p.name}</span>,
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      cell: (p) => (
        <span className="bg-secondary text-muted-foreground inline-flex rounded-full px-2 py-0.5 text-xs capitalize">
          {p.status}
        </span>
      ),
    },
    {
      key: "createdAt",
      header: "Created",
      sortable: true,
      cell: (p) => (
        <span className="text-muted-foreground text-xs">
          {formatDistanceToNow(new Date(p.createdAt), { addSuffix: true })}
        </span>
      ),
    },
  ];

  return (
    <LocalDataTable
      data={projects}
      columns={columns}
      getRowKey={(p) => p.id}
      searchPlaceholder="Search projects…"
      searchAccessor={(p) => p.name}
      sortAccessors={{
        name: (p) => p.name,
        status: (p) => p.status,
        createdAt: (p) => new Date(p.createdAt),
      }}
      filters={[
        {
          key: "projectStatus",
          label: "Status",
          options: statusOptions,
          match: (p, v) => p.status === v,
        },
      ]}
      emptyTitle="No projects."
      emptyDescription="This organization has no projects yet."
    />
  );
}

function ClientsTable({ clients }: { clients: ClientRow[] }) {
  const statusOptions = uniqueOptions(
    clients.map((c) => ({
      value: c.status,
      label: c.status.charAt(0).toUpperCase() + c.status.slice(1),
    })),
  );

  const columns: ColumnDef<ClientRow>[] = [
    {
      key: "name",
      header: "Client",
      sortable: true,
      cell: (c) => <span className="text-foreground font-medium">{c.name}</span>,
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      cell: (c) => (
        <span className="bg-secondary text-muted-foreground inline-flex rounded-full px-2 py-0.5 text-xs capitalize">
          {c.status}
        </span>
      ),
    },
    {
      key: "createdAt",
      header: "Created",
      sortable: true,
      cell: (c) => (
        <span className="text-muted-foreground text-xs">
          {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
        </span>
      ),
    },
  ];

  return (
    <LocalDataTable
      data={clients}
      columns={columns}
      getRowKey={(c) => c.id}
      searchPlaceholder="Search clients…"
      searchAccessor={(c) => c.name}
      sortAccessors={{
        name: (c) => c.name,
        status: (c) => c.status,
        createdAt: (c) => new Date(c.createdAt),
      }}
      filters={[
        {
          key: "clientStatus",
          label: "Status",
          options: statusOptions,
          match: (c, v) => c.status === v,
        },
      ]}
      emptyTitle="No clients."
      emptyDescription="This organization has no clients yet."
    />
  );
}

// ─── Read-only grids (Overview / Subscription / Settings) ───────────────────

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-border bg-card rounded-xl border p-4">
      <p className="text-muted-foreground mb-1 text-xs">{label}</p>
      <p className="text-foreground text-sm font-medium">{value}</p>
    </div>
  );
}

function OverviewGrid({ org }: { org: Detail["org"] }) {
  const rows: [string, string][] = [
    ["Name", org.name],
    ["Slug", org.slug],
    ["Status", org.isActive ? "Active" : "Suspended"],
    [
      "Created",
      new Date(org.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    ],
    ["Timezone", org.timezone ?? "-"],
    ["Currency", org.currencyCode ?? "-"],
  ];
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {rows.map(([label, value]) => (
        <InfoCard key={label} label={label} value={value} />
      ))}
    </div>
  );
}

function SubscriptionGrid({ subscription }: { subscription: Detail["subscription"] }) {
  if (!subscription) {
    return (
      <div className="border-border bg-card text-muted-foreground rounded-xl border p-8 text-center text-sm">
        No active subscription.
      </div>
    );
  }
  const rows: [string, string][] = [
    ["Plan", subscription.planName],
    ["Status", subscription.status],
    ["Billing cycle", subscription.billingCycle ?? "-"],
    [
      "Current period end",
      subscription.currentPeriodEnd
        ? new Date(subscription.currentPeriodEnd).toLocaleDateString()
        : "-",
    ],
    ["Stripe Customer ID", subscription.stripeCustomerId ?? "-"],
    ["Stripe Subscription ID", subscription.stripeSubscriptionId ?? "-"],
  ];
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {rows.map(([label, value]) => (
        <div key={label} className="border-border bg-card rounded-xl border p-4">
          <p className="text-muted-foreground mb-1 text-xs">{label}</p>
          <p className="text-foreground font-mono text-sm font-medium">{value}</p>
        </div>
      ))}
    </div>
  );
}

function SettingsGrid({ settings }: { settings: Detail["settings"] }) {
  if (!settings) {
    return (
      <div className="border-border bg-card text-muted-foreground rounded-xl border p-8 text-center text-sm">
        No settings found.
      </div>
    );
  }
  const rows: [string, string][] = [
    ["Email verification required", settings.requireEmailVerification ? "Yes" : "No"],
    ["Session timeout", settings.sessionTimeoutHours ? `${settings.sessionTimeoutHours}h` : "None"],
    ["IP allowlist", settings.ipAllowlist?.length ? settings.ipAllowlist.join(", ") : "None"],
    ["Brand color", settings.brandColor ?? "Default"],
    ["Logo", settings.logoUrl ? "Set" : "None"],
    [
      "Onboarding completed",
      settings.onboardingCompletedAt
        ? new Date(settings.onboardingCompletedAt).toLocaleDateString()
        : "No",
    ],
  ];
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {rows.map(([label, value]) => (
        <InfoCard key={label} label={label} value={value} />
      ))}
    </div>
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
