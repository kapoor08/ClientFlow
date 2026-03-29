"use client";

import { CreditCard, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { BillingContext } from "@/core/billing/entity";
import { formatPrice, formatDate, getStatusStyle } from "@/core/billing/entity";

export function SubscriptionCard({
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
