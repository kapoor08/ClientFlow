import { TrendingUp, CreditCard, UserCheck } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { SubscriptionsTable } from "@/components/admin/billing";
import type { getAdminBillingStats, AdminSubscriptionRow } from "@/server/admin/billing";
import type { PaginationMeta } from "@/utils/pagination";

type Stats = Awaited<ReturnType<typeof getAdminBillingStats>>;

type PlanOption = { value: string; label: string };

type Props = {
  stats: Stats;
  data: AdminSubscriptionRow[];
  pagination: PaginationMeta;
  planOptions: PlanOption[];
};

function fmt(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(cents / 100);
}

export default function AdminBillingPage({ stats, data, pagination, planOptions }: Props) {
  return (
    <div>
      <PageHeader title="Billing" description="Platform revenue overview" />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 mb-8">
        {[
          { label: "MRR", value: fmt(stats.mrrCents), icon: TrendingUp },
          { label: "ARR", value: fmt(stats.arrCents), icon: TrendingUp },
          { label: "Active", value: stats.activeCount, icon: CreditCard },
          { label: "Trialing", value: stats.trialingCount, icon: UserCheck },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-5 shadow-cf-1">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {label}
              </p>
              <Icon size={14} className="text-muted-foreground" />
            </div>
            <p className="font-display text-2xl font-bold text-foreground">{value}</p>
          </div>
        ))}
      </div>

      <SubscriptionsTable data={data} pagination={pagination} planOptions={planOptions} />
    </div>
  );
}
