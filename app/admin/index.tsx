import {
  Building2,
  Users,
  CreditCard,
  TrendingUp,
  FolderOpen,
  Briefcase,
  DollarSign,
  FlaskConical,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/shared/StatusBadge";
import type { getAdminDashboardStats } from "@/server/admin/dashboard";

type Stats = Awaited<ReturnType<typeof getAdminDashboardStats>>;

const PLAN_COLORS: Record<string, string> = {
  free: "bg-secondary text-muted-foreground",
  starter: "bg-info/10 text-info",
  professional: "bg-brand-100 text-primary",
  enterprise: "bg-success/10 text-success",
};

function KpiCard({
  label,
  value,
  icon: Icon,
  sub,
  accent,
}: {
  label: string;
  value: string | number;
  icon: typeof Building2;
  sub?: string;
  accent?: "success" | "warning" | "info";
}) {
  const accentIcon: Record<string, string> = {
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
    info: "bg-info/10 text-info",
  };

  return (
    <div className="border-border bg-card shadow-cf-1 rounded-xl border p-5">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">{label}</p>
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-lg ${accent ? accentIcon[accent] : "bg-secondary"}`}
        >
          <Icon size={14} className={accent ? "" : "text-muted-foreground"} />
        </div>
      </div>
      <p className="font-display text-foreground text-2xl font-bold">{value}</p>
      {sub && <p className="text-muted-foreground mt-1 text-xs">{sub}</p>}
    </div>
  );
}

function OrgGrowthChart({ data }: { data: { date: string; count: number }[] }) {
  if (data.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">No new organizations in the last 30 days.</p>
    );
  }

  const max = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="space-y-2">
      {data.map((d) => (
        <div key={d.date} className="flex items-center gap-3">
          <span className="text-muted-foreground w-20 shrink-0 text-[11px] tabular-nums">
            {format(new Date(d.date), "MMM d")}
          </span>
          <div className="bg-secondary h-2 flex-1 overflow-hidden rounded-full">
            <div
              className="bg-primary/60 h-full rounded-full"
              style={{ width: `${(d.count / max) * 100}%` }}
            />
          </div>
          <span className="text-foreground w-4 shrink-0 text-right text-[11px] font-medium tabular-nums">
            {d.count}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function AdminDashboardPage({ stats }: { stats: Stats }) {
  const mrrFormatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(stats.mrrCents / 100);

  const arrFormatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format((stats.mrrCents * 12) / 100);

  const arpu =
    stats.activeSubscriptions > 0
      ? new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          minimumFractionDigits: 0,
        }).format(stats.mrrCents / stats.activeSubscriptions / 100)
      : "-";

  const totalNewOrgs30d = stats.growthData.reduce((s, d) => s + d.count, 0);

  return (
    <div>
      <PageHeader title="Dashboard" description="Platform-wide overview" />

      {/* Primary KPIs */}
      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Organizations" value={stats.totalOrgs} icon={Building2} />
        <KpiCard label="Total Users" value={stats.totalUsers} icon={Users} />
        <KpiCard
          label="Active Subscriptions"
          value={stats.activeSubscriptions}
          icon={CreditCard}
          accent="success"
        />
        <KpiCard
          label="Trialing"
          value={stats.trialingSubscriptions}
          icon={FlaskConical}
          accent="warning"
          sub="Free trial accounts"
        />
      </div>

      {/* Revenue KPIs */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          label="MRR"
          value={mrrFormatted}
          icon={TrendingUp}
          accent="success"
          sub="Monthly recurring revenue"
        />
        <KpiCard
          label="ARR"
          value={arrFormatted}
          icon={DollarSign}
          accent="success"
          sub="Annual run rate"
        />
        <KpiCard label="ARPU" value={arpu} icon={CreditCard} sub="Per active subscription" />
        <KpiCard
          label="New Orgs (30d)"
          value={totalNewOrgs30d}
          icon={Building2}
          accent="info"
          sub="Last 30 days"
        />
      </div>

      {/* Secondary KPIs */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-2">
        <KpiCard label="Projects" value={stats.totalProjects} icon={FolderOpen} />
        <KpiCard label="Clients" value={stats.totalClients} icon={Briefcase} />
      </div>

      {/* Bottom panels */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Plan Distribution */}
        <div className="border-border bg-card shadow-cf-1 rounded-xl border p-5">
          <h2 className="font-display text-foreground mb-4 text-sm font-semibold">
            Plan Distribution
          </h2>
          {stats.planDistribution.length === 0 ? (
            <p className="text-muted-foreground text-sm">No active subscriptions.</p>
          ) : (
            <div className="space-y-3">
              {stats.planDistribution.map((p) => (
                <div key={p.planCode} className="flex items-center justify-between">
                  <StatusBadge status={p.planName} colorMap={PLAN_COLORS} />
                  <span className="text-foreground text-sm font-semibold">{p.count} orgs</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Org growth */}
        <div className="border-border bg-card shadow-cf-1 rounded-xl border p-5">
          <h2 className="font-display text-foreground mb-4 text-sm font-semibold">
            New Orgs - Last 30 Days
          </h2>
          <OrgGrowthChart data={stats.growthData} />
        </div>

        {/* Recent Signups */}
        <div className="border-border bg-card shadow-cf-1 rounded-xl border p-5">
          <h2 className="font-display text-foreground mb-4 text-sm font-semibold">
            Recent Signups
          </h2>
          {stats.recentUsers.length === 0 ? (
            <p className="text-muted-foreground text-sm">No users yet.</p>
          ) : (
            <div className="space-y-3">
              {stats.recentUsers.map((u) => (
                <div key={u.id} className="flex items-center gap-3">
                  {u.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={u.image} alt={u.name} className="h-7 w-7 rounded-full object-cover" />
                  ) : (
                    <div className="bg-brand-100 text-primary flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold">
                      {u.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-foreground truncate text-sm font-medium">{u.name}</p>
                    <p className="text-muted-foreground truncate text-xs">{u.email}</p>
                  </div>
                  <p className="text-muted-foreground text-[10px] whitespace-nowrap">
                    {formatDistanceToNow(new Date(u.createdAt), { addSuffix: true })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
