"use client";

import { useState } from "react";
import { toast } from "sonner";
import { PlansDialog } from "./PlansDialog";
import { SubscriptionCard } from "./SubscriptionCard";
import { UsageSection } from "./UsageSection";
import { InvoicesList } from "./InvoicesList";
import type { BillingContext } from "@/core/billing/entity";
import type { PublicPlan } from "@/server/public/plans";

type Props = {
  billing: BillingContext;
  showSuccess: boolean;
  showCanceled: boolean;
  plans: PublicPlan[];
};

export function BillingContent({ billing, showSuccess, showCanceled, plans }: Props) {
  const [plansOpen, setPlansOpen] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  async function handleManageBilling() {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(
          (json as { error?: string }).error ?? "Failed to open billing portal.",
        );
        return;
      }
      if (json.url) {
        window.location.href = json.url;
      } else {
        toast.error("Failed to open billing portal.");
      }
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setPortalLoading(false);
    }
  }

  return (
    <>
      <PlansDialog
        open={plansOpen}
        onClose={() => setPlansOpen(false)}
        currentPlanCode={billing.subscription?.planCode}
        plans={plans}
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

      <SubscriptionCard
        subscription={billing.subscription}
        onViewPlans={() => setPlansOpen(true)}
        onManageBilling={handleManageBilling}
        portalLoading={portalLoading}
      />

      <UsageSection usage={billing.usage} />

      <InvoicesList
        invoices={billing.invoices}
        pagination={billing.invoicePagination}
      />
    </>
  );
}
