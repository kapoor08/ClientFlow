"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { CreditCard, Sparkles, Users, FolderOpen, Briefcase, Check, Loader2 } from "lucide-react";
import { RowActions } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useBilling } from "@/core/billing/useCase";
import type { BillingContext, BillingInvoiceItem } from "@/core/billing/entity";
import {
  formatPrice,
  formatDate,
  usagePercent,
  getStatusStyle,
} from "@/core/billing/entity";
import { plans } from "@/config/plans";

// ─── Plans dialog ─────────────────────────────────────────────────────────────

function PlansDialog({
  open,
  onClose,
  currentPlanCode,
}: {
  open: boolean;
  onClose: () => void;
  currentPlanCode?: string;
}) {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  async function handleSelectPlan(planCode: string) {
    if (planCode === "enterprise") {
      window.location.href = "mailto:sales@clientflow.io";
      return;
    }
    setLoadingPlan(planCode);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planCode }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } finally {
      setLoadingPlan(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[780px]">
        <DialogHeader className="pb-1">
          <DialogTitle className="font-display text-xl">Choose a Plan</DialogTitle>
          <DialogDescription>
            Select the plan that fits your team. All plans include a 14-day free trial.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {plans.map((plan) => {
            const isCurrent =
              currentPlanCode?.toLowerCase() === plan.code.toLowerCase();
            const isLoading = loadingPlan === plan.code;

            return (
              <div
                key={plan.name}
                className={`flex flex-col rounded-xl border p-5 transition-shadow ${
                  plan.featured
                    ? "border-primary bg-gradient-to-b from-brand-100/30 to-brand-100/10 shadow-md ring-1 ring-primary/20"
                    : "border-border bg-card hover:shadow-sm"
                }`}
              >
                {/* Header */}
                <div className="mb-4">
                  {plan.featured ? (
                    <span className="mb-2 inline-flex items-center rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-primary-foreground">
                      Most Popular
                    </span>
                  ) : (
                    <span className="mb-2 inline-block h-5" />
                  )}
                  <h3 className="font-display text-lg font-bold text-foreground">
                    {plan.name}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {plan.desc}
                  </p>
                </div>

                {/* Price */}
                <div className="mb-5 flex items-end gap-1">
                  <span className="font-display text-3xl font-extrabold tracking-tight text-foreground">
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span className="mb-1 text-sm text-muted-foreground">
                      {plan.period}
                    </span>
                  )}
                </div>

                {/* Divider */}
                <div className="mb-4 h-px bg-border" />

                {/* Features */}
                <ul className="flex-1 space-y-2.5 mb-6">
                  {plan.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-start gap-2.5 text-sm text-foreground/80"
                    >
                      <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-success/15">
                        <Check size={10} className="text-success" strokeWidth={3} />
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Button
                  variant={plan.featured ? "default" : "outline"}
                  className="w-full cursor-pointer"
                  disabled={isCurrent || isLoading || loadingPlan !== null}
                  onClick={() => handleSelectPlan(plan.code)}
                >
                  {isLoading ? (
                    <><Loader2 size={14} className="mr-1.5 animate-spin" /> Redirecting…</>
                  ) : isCurrent ? "Current Plan" : plan.cta}
                </Button>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SubscriptionCard({
  subscription,
  onViewPlans,
  onManageBilling,
  portalLoading,
}: {
  subscription: BillingContext["subscription"];
  onViewPlans: () => void;
  onManageBilling?: () => void;
  portalLoading?: boolean;
}) {
  if (!subscription) {
    return (
      <div className="mb-8 rounded-card border border-border bg-card p-6 shadow-cf-1">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <CreditCard size={20} className="text-muted-foreground" />
              <h2 className="font-display text-lg font-semibold text-foreground">
                No Active Plan
              </h2>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              You&apos;re not subscribed to any plan. Upgrade to unlock higher
              limits and premium features.
            </p>
          </div>
          <Button size="sm" className="shrink-0 cursor-pointer" onClick={onViewPlans}>
            <Sparkles size={14} className="mr-1.5" />
            View Plans
          </Button>
        </div>
      </div>
    );
  }

  const price =
    subscription.billingCycle === "yearly"
      ? formatPrice(subscription.yearlyPriceCents)
      : formatPrice(subscription.monthlyPriceCents);

  const cycle = subscription.billingCycle === "yearly" ? "year" : "month";

  return (
    <div className="mb-8 rounded-card border border-primary/30 bg-brand-100/20 p-6 shadow-cf-1">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <CreditCard size={20} className="text-primary" />
            <h2 className="font-display text-lg font-semibold text-foreground">
              {subscription.planName}
            </h2>
            <span
              className={`rounded-pill px-2 py-0.5 text-xs font-medium ${getStatusStyle(subscription.status)}`}
            >
              {subscription.status === "trialing" ? "Trial" : subscription.status === "active" ? "Active" : subscription.status}
            </span>
            {subscription.cancelAtPeriodEnd && (
              <span className="rounded-pill bg-warning/10 px-2 py-0.5 text-xs font-medium text-warning">
                Cancels at period end
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {price}/{cycle}
            {subscription.currentPeriodEnd && (
              <> · {subscription.status === "trialing" ? "Trial ends" : "Renews"} {formatDate(subscription.currentPeriodEnd)}</>
            )}
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" size="sm" className="cursor-pointer" onClick={onViewPlans}>
            Change Plan
          </Button>
          <Button variant="outline" size="sm" className="cursor-pointer" onClick={onManageBilling} disabled={portalLoading}>
            {portalLoading ? <><Loader2 size={14} className="mr-1.5 animate-spin" />Opening…</> : "Manage Billing"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function UsageCard({
  icon: Icon,
  label,
  used,
  limit,
}: {
  icon: typeof Users;
  label: string;
  used: number;
  limit: number | null;
}) {
  const pct = usagePercent(used, limit);
  const isNearLimit = limit !== null && pct >= 80;

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon size={14} className="text-muted-foreground" />
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
      <p className="font-display text-xl font-bold text-foreground">
        {used}
        {limit !== null && (
          <span className="ml-1 text-sm font-normal text-muted-foreground">
            / {limit}
          </span>
        )}
        {limit === null && (
          <span className="ml-1 text-sm font-normal text-muted-foreground">
            / ∞
          </span>
        )}
      </p>
      {limit !== null && (
        <div className="mt-2">
          <div className="h-1 w-full rounded-full bg-secondary overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${isNearLimit ? "bg-warning" : "bg-primary"}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className={`mt-1 text-[10px] ${isNearLimit ? "text-warning" : "text-muted-foreground"}`}>
            {pct}% used
          </p>
        </div>
      )}
    </div>
  );
}

function InvoiceRow({ invoice }: { invoice: BillingInvoiceItem }) {
  const amount =
    invoice.status === "paid"
      ? formatPrice(invoice.amountPaidCents, invoice.currencyCode ?? "USD")
      : formatPrice(invoice.amountDueCents, invoice.currencyCode ?? "USD");

  const date =
    invoice.status === "paid"
      ? formatDate(invoice.paidAt)
      : formatDate(invoice.dueAt);

  return (
    <tr className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
      <td className="px-4 py-3 text-xs font-mono text-muted-foreground">
        {invoice.id.slice(0, 8).toUpperCase()}
      </td>
      <td className="px-4 py-3 font-medium text-foreground">{amount}</td>
      <td className="px-4 py-3">
        <span
          className={`inline-flex rounded-pill px-2 py-0.5 text-xs font-medium capitalize ${getStatusStyle(invoice.status)}`}
        >
          {invoice.status}
        </span>
      </td>
      <td className="hidden px-4 py-3 text-xs text-muted-foreground md:table-cell">
        {date}
      </td>
      <td className="px-4 py-3 text-right">
        <RowActions openHref={invoice.invoiceUrl ?? undefined} />
      </td>
    </tr>
  );
}

function SkeletonCard() {
  return (
    <div className="mb-8 rounded-card border border-border bg-card p-6 shadow-cf-1">
      <div className="flex items-center gap-2 mb-2">
        <Skeleton className="h-5 w-5 rounded" />
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-5 w-14 rounded-full" />
      </div>
      <Skeleton className="h-4 w-56 mt-1" />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const BillingPage = () => {
  const { data, isLoading } = useBilling();
  const [plansOpen, setPlansOpen] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  async function handleManageBilling() {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const json = await res.json();
      if (json.url) window.location.href = json.url;
    } finally {
      setPortalLoading(false);
    }
  }

  // Show success/cancel banners from Stripe redirect query params
  const searchParams = useSearchParams();
  const showSuccess = searchParams.get("success") === "1";
  const showCanceled = searchParams.get("canceled") === "1";

  return (
    <div>
      <PlansDialog
        open={plansOpen}
        onClose={() => setPlansOpen(false)}
        currentPlanCode={data?.subscription?.planCode}
      />

      {showSuccess && (
        <div className="mb-4 rounded-card border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">
          Subscription activated! Your plan is now live.
        </div>
      )}
      {showCanceled && (
        <div className="mb-4 rounded-card border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
          Checkout was canceled. No charge was made.
        </div>
      )}

      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-foreground">
          Billing
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage your subscription and invoices
        </p>
      </div>

      {/* Subscription */}
      {isLoading ? (
        <SkeletonCard />
      ) : (
        <SubscriptionCard
          subscription={data?.subscription ?? null}
          onViewPlans={() => setPlansOpen(true)}
          onManageBilling={handleManageBilling}
          portalLoading={portalLoading}
        />
      )}

      {/* Usage */}
      <h2 className="mb-3 font-display text-lg font-semibold text-foreground">
        Usage
      </h2>
      <div className="mb-8 grid gap-3 sm:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-border bg-card p-4">
              <Skeleton className="h-3 w-24 mb-2" />
              <Skeleton className="h-7 w-16" />
            </div>
          ))
        ) : (
          <>
            <UsageCard
              icon={Users}
              label="Team Members"
              used={data?.usage.members.used ?? 0}
              limit={data?.usage.members.limit ?? null}
            />
            <UsageCard
              icon={FolderOpen}
              label="Projects"
              used={data?.usage.projects.used ?? 0}
              limit={data?.usage.projects.limit ?? null}
            />
            <UsageCard
              icon={Briefcase}
              label="Clients"
              used={data?.usage.clients.used ?? 0}
              limit={data?.usage.clients.limit ?? null}
            />
          </>
        )}
      </div>

      {/* Invoice History */}
      <h2 className="mb-4 font-display text-lg font-semibold text-foreground">
        Invoice History
      </h2>
      <div className="overflow-hidden rounded-card border border-border bg-card shadow-cf-1">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/50">
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                Invoice
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                Amount
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                Status
              </th>
              <th className="hidden px-4 py-3 text-left text-xs font-semibold text-muted-foreground md:table-cell">
                Date
              </th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className="border-b border-border last:border-0">
                  <td className="px-4 py-3"><Skeleton className="h-3 w-20" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-3 w-16" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-5 w-14 rounded-full" /></td>
                  <td className="hidden px-4 py-3 md:table-cell"><Skeleton className="h-3 w-24" /></td>
                  <td className="px-4 py-3" />
                </tr>
              ))
            ) : !data?.invoices.length ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-sm text-muted-foreground">
                  No invoices yet. Your billing history will appear here after
                  your first billing cycle.
                </td>
              </tr>
            ) : (
              data.invoices.map((inv) => (
                <InvoiceRow key={inv.id} invoice={inv} />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BillingPage;
