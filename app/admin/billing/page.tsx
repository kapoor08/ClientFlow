import { TrendingUp, CreditCard, UserCheck } from "lucide-react";
import { getAdminBillingStats } from "@/lib/admin-data";
import { formatDistanceToNow } from "date-fns";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/common/StatusBadge";
import { EmptyState } from "@/components/common/EmptyState";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const PLAN_COLORS: Record<string, string> = {
  free: "bg-secondary text-muted-foreground",
  starter: "bg-info/10 text-info",
  professional: "bg-brand-100 text-primary",
  enterprise: "bg-success/10 text-success",
};

const STATUS_COLORS: Record<string, string> = {
  active: "bg-success/10 text-success",
  trialing: "bg-brand-100 text-primary",
  past_due: "bg-warning/10 text-warning",
  canceled: "bg-secondary text-muted-foreground",
};

function fmt(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(cents / 100);
}

export default async function AdminBillingPage() {
  const stats = await getAdminBillingStats();

  return (
    <div>
      <PageHeader title="Billing" description="Platform revenue overview" />

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 mb-8">
        {[
          { label: "MRR", value: fmt(stats.mrrCents), icon: TrendingUp },
          { label: "ARR", value: fmt(stats.arrCents), icon: TrendingUp },
          { label: "Active", value: stats.activeCount, icon: CreditCard },
          { label: "Trialing", value: stats.trialingCount, icon: UserCheck },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-5 shadow-cf-1">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
              <Icon size={14} className="text-muted-foreground" />
            </div>
            <p className="font-display text-2xl font-bold text-foreground">{value}</p>
          </div>
        ))}
      </div>

      {/* Subscription list */}
      {stats.subscriptions.length === 0 ? (
        <EmptyState icon={CreditCard} title="No subscriptions yet." />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-cf-1">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Organization</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead className="hidden sm:table-cell">Status</TableHead>
                <TableHead className="hidden md:table-cell">Cycle</TableHead>
                <TableHead className="hidden lg:table-cell">MRR</TableHead>
                <TableHead className="hidden lg:table-cell">Renews</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.subscriptions.map((s) => {
                const mrr =
                  s.billingCycle === "yearly"
                    ? Math.round((s.yearlyPriceCents ?? 0) / 12)
                    : (s.monthlyPriceCents ?? 0);
                return (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium text-foreground">{s.orgName}</TableCell>
                    <TableCell>
                      <StatusBadge status={s.planCode} colorMap={PLAN_COLORS} />
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <StatusBadge status={s.status} colorMap={STATUS_COLORS} />
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-xs text-muted-foreground capitalize">
                      {s.billingCycle ?? "-"}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm font-medium text-foreground">
                      {s.status === "active" ? fmt(mrr) : "-"}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                      {s.currentPeriodEnd
                        ? formatDistanceToNow(new Date(s.currentPeriodEnd), { addSuffix: true })
                        : "-"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
