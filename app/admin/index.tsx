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
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { AdminKpiCard } from "@/components/admin/dashboard/AdminKpiCard";
import { OrgGrowthChart } from "@/components/admin/dashboard/OrgGrowthChart";
import type { getAdminDashboardStats } from "@/server/admin/dashboard";

type Stats = Awaited<ReturnType<typeof getAdminDashboardStats>>;

const PLAN_COLORS: Record<string, string> = {
  free: "bg-secondary text-muted-foreground",
  starter: "bg-info/10 text-info",
  professional: "bg-brand-100 text-primary",
  enterprise: "bg-success/10 text-success",
};

export default function AdminDashboardPage({ stats }: { stats: Stats }) {
  const currency = (cents: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(cents / 100);

  const mrrFormatted = currency(stats.mrrCents);
  const arrFormatted = currency(stats.mrrCents * 12);
  const arpu =
    stats.activeSubscriptions > 0 ? currency(stats.mrrCents / stats.activeSubscriptions) : "-";

  const totalNewOrgs30d = stats.growthData.reduce((s, d) => s + d.count, 0);

  return (
    <div>
      <PageHeader title="Dashboard" description="Platform-wide overview" />

      {/* Primary KPIs */}
      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <AdminKpiCard label="Organizations" value={stats.totalOrgs} icon={Building2} />
        <AdminKpiCard label="Total Users" value={stats.totalUsers} icon={Users} />
        <AdminKpiCard
          label="Active Subscriptions"
          value={stats.activeSubscriptions}
          icon={CreditCard}
          accent="success"
        />
        <AdminKpiCard
          label="Trialing"
          value={stats.trialingSubscriptions}
          icon={FlaskConical}
          accent="warning"
          sub="Free trial accounts"
        />
      </div>

      {/* Revenue KPIs */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <AdminKpiCard
          label="MRR"
          value={mrrFormatted}
          icon={TrendingUp}
          accent="success"
          sub="Monthly recurring revenue"
        />
        <AdminKpiCard
          label="ARR"
          value={arrFormatted}
          icon={DollarSign}
          accent="success"
          sub="Annual run rate"
        />
        <AdminKpiCard label="ARPU" value={arpu} icon={CreditCard} sub="Per active subscription" />
        <AdminKpiCard
          label="New Orgs (30d)"
          value={totalNewOrgs30d}
          icon={Building2}
          accent="info"
          sub="Last 30 days"
        />
      </div>

      {/* Secondary KPIs */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-2">
        <AdminKpiCard label="Projects" value={stats.totalProjects} icon={FolderOpen} />
        <AdminKpiCard label="Clients" value={stats.totalClients} icon={Briefcase} />
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
                    <Image
                      src={u.image}
                      alt={u.name}
                      width={28}
                      height={28}
                      unoptimized
                      className="h-7 w-7 rounded-full object-cover"
                    />
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
