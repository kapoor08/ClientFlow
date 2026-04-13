import { TrendingUp, TrendingDown, Building2, Users, CreditCard, DollarSign } from "lucide-react";
import type { PlatformStats } from "@/server/admin/analytics";

function fmt(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(cents / 100);
}

function Delta({ current, previous }: { current: number; previous: number }) {
  if (previous === 0 && current === 0) return null;
  const isUp = current >= previous;
  const diff = current - previous;
  const sign = diff >= 0 ? "+" : "";

  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-medium ${
        isUp ? "text-success" : "text-danger"
      }`}
    >
      {isUp ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
      {sign}{diff} vs prev
    </span>
  );
}

type Props = { stats: PlatformStats; days: number };

export function PlatformStatsGrid({ stats, days }: Props) {
  const cards = [
    {
      label: "Total Organizations",
      value: stats.orgs.total.toLocaleString(),
      sub: `+${stats.orgs.newCurrent} in ${days}d`,
      delta: <Delta current={stats.orgs.newCurrent} previous={stats.orgs.newPrevious} />,
      icon: Building2,
    },
    {
      label: "Total Users",
      value: stats.users.total.toLocaleString(),
      sub: `+${stats.users.newCurrent} in ${days}d`,
      delta: <Delta current={stats.users.newCurrent} previous={stats.users.newPrevious} />,
      icon: Users,
    },
    {
      label: "Current MRR",
      value: fmt(stats.mrrCents),
      sub: `ARR ${fmt(stats.mrrCents * 12)}`,
      delta: null,
      icon: DollarSign,
    },
    {
      label: "Active Subscriptions",
      value: stats.subscriptions.active.toLocaleString(),
      sub: `+${stats.subscriptions.newCurrent} in ${days}d`,
      delta: (
        <Delta
          current={stats.subscriptions.newCurrent}
          previous={stats.subscriptions.newPrevious}
        />
      ),
      icon: CreditCard,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cards.map(({ label, value, sub, delta, icon: Icon }) => (
        <div key={label} className="rounded-xl border border-border bg-card p-5 shadow-cf-1">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {label}
            </p>
            <Icon size={14} className="text-muted-foreground" />
          </div>
          <p className="font-display text-2xl font-bold text-foreground">{value}</p>
          <div className="mt-1.5 flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground">{sub}</span>
            {delta}
          </div>
        </div>
      ))}
    </div>
  );
}
