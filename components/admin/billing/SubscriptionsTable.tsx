"use client";

import { useTransition } from "react";
import { formatDistanceToNow } from "date-fns";
import { parseAsString, useQueryStates } from "nuqs";
import { DataTable, FiltersPopover, type ColumnDef } from "@/components/data-table";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { BillingRowActions } from "./BillingRowActions";
import type { AdminSubscriptionRow } from "@/server/admin/billing";
import type { PaginationMeta } from "@/utils/pagination";

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

const PLAN_OPTIONS = [
  { value: "free", label: "Free" },
  { value: "starter", label: "Starter" },
  { value: "professional", label: "Professional" },
  { value: "enterprise", label: "Enterprise" },
];

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "trialing", label: "Trialing" },
  { value: "past_due", label: "Past Due" },
  { value: "canceled", label: "Canceled" },
];

const CYCLE_OPTIONS = [
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

function fmt(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(cents / 100);
}

type PlanOption = { value: string; label: string };

function buildColumns(planOptions: PlanOption[]): ColumnDef<AdminSubscriptionRow>[] {
  return [
    {
      key: "actions",
      header: "Actions",
      headerClassName: "w-12",
      cell: (s) => (
        <div className="flex items-center">
          <BillingRowActions subscription={s} planOptions={planOptions} />
        </div>
      ),
    },
    {
      key: "orgName",
      header: "Organization",
      cell: (s) => <span className="font-medium text-foreground">{s.orgName}</span>,
    },
    {
      key: "plan",
      header: "Plan",
      cell: (s) => <StatusBadge status={s.planCode} colorMap={PLAN_COLORS} />,
    },
    {
      key: "status",
      header: "Status",
      hideOnMobile: true,
      cell: (s) => <StatusBadge status={s.status} colorMap={STATUS_COLORS} />,
    },
    {
      key: "billingCycle",
      header: "Cycle",
      hideOnTablet: true,
      cell: (s) => (
        <span className="text-xs text-muted-foreground capitalize">{s.billingCycle ?? "-"}</span>
      ),
    },
    {
      key: "mrr",
      header: "MRR",
      hideOnMobile: true,
      cell: (s) => {
        const mrr =
          s.billingCycle === "yearly"
            ? Math.round((s.yearlyPriceCents ?? 0) / 12)
            : (s.monthlyPriceCents ?? 0);
        return (
          <span className="text-sm font-medium text-foreground">
            {s.status === "active" ? fmt(mrr) : "-"}
          </span>
        );
      },
    },
    {
      key: "currentPeriodEnd",
      header: "Renews",
      hideOnMobile: true,
      cell: (s) => (
        <span className="text-xs text-muted-foreground">
          {s.currentPeriodEnd
            ? formatDistanceToNow(new Date(s.currentPeriodEnd), { addSuffix: true })
            : "-"}
        </span>
      ),
    },
  ];
}

type Props = {
  data: AdminSubscriptionRow[];
  pagination: PaginationMeta;
  planOptions?: PlanOption[];
};

export function SubscriptionsTable({ data, pagination, planOptions = [] }: Props) {
  const [, startTransition] = useTransition();
  const columns = buildColumns(planOptions);

  const [{ status, plan, cycle }, setFilters] = useQueryStates(
    {
      status: parseAsString.withDefault(""),
      plan: parseAsString.withDefault(""),
      cycle: parseAsString.withDefault(""),
      page: parseAsString.withDefault(""),
    },
    { shallow: false, startTransition, clearOnDefault: true },
  );

  return (
    <DataTable
      data={data}
      columns={columns}
      getRowKey={(row) => row.id}
      searchPlaceholder="Search by organization…"
      searchExtra={
        <FiltersPopover
          filters={[
            {
              key: "plan",
              label: "Plan",
              options: PLAN_OPTIONS,
              value: plan,
              onChange: (v) => setFilters({ plan: v || null, page: null }),
            },
            {
              key: "status",
              label: "Status",
              options: STATUS_OPTIONS,
              value: status,
              onChange: (v) => setFilters({ status: v || null, page: null }),
            },
            {
              key: "cycle",
              label: "Billing Cycle",
              options: CYCLE_OPTIONS,
              value: cycle,
              onChange: (v) => setFilters({ cycle: v || null, page: null }),
            },
          ]}
        />
      }
      pagination={pagination}
      emptyTitle="No subscriptions found."
      emptyDescription="Try adjusting your search or filters."
    />
  );
}
