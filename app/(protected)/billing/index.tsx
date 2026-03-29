"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { useBilling } from "@/core/billing/useCase";
import { PlansDialog } from "./PlansDialog";
import { SubscriptionCard } from "./SubscriptionCard";
import { UsageSection } from "./UsageSection";
import { InvoicesList } from "./InvoicesList";

// ─── Skeleton ─────────────────────────────────────────────────────────────────

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
      <UsageSection usage={data?.usage} isLoading={isLoading} />

      {/* Invoice History */}
      <InvoicesList invoices={data?.invoices} isLoading={isLoading} />
    </div>
  );
};

export default BillingPage;
