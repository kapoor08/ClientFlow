"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import type { PublicPlan } from "@/server/public/plans";
import { PlanChangePreviewDialog } from "./PlanChangePreviewDialog";

function formatPrice(plan: PublicPlan): { label: string; period: string } {
  if (plan.monthlyPriceCents == null) return { label: "Custom", period: "" };
  const dollars = Math.round(plan.monthlyPriceCents / 100);
  return { label: `$${dollars}`, period: "/mo" };
}

function planCta(plan: PublicPlan): string {
  if (plan.code === "enterprise" || plan.monthlyPriceCents == null) return "Contact Sales";
  return "Start Free Trial";
}

export function PlansDialog({
  open,
  onClose,
  currentPlanCode,
  plans,
}: {
  open: boolean;
  onClose: () => void;
  currentPlanCode?: string;
  plans: PublicPlan[];
}) {
  const router = useRouter();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [previewTarget, setPreviewTarget] = useState<PublicPlan | null>(null);

  const hasActiveSubscription = Boolean(currentPlanCode);
  const currentPlanName =
    plans.find((p) => p.code.toLowerCase() === currentPlanCode?.toLowerCase())?.name ??
    "Current plan";

  async function startCheckout(planCode: string) {
    setLoadingPlan(planCode);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planCode }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error((data as { error?: string }).error ?? "Failed to start checkout.");
        return;
      }
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error("Checkout did not return a session URL.");
      }
    } catch {
      toast.error("Failed to start checkout.");
    } finally {
      setLoadingPlan(null);
    }
  }

  function handleSelectPlan(plan: PublicPlan) {
    if (plan.code === "enterprise") {
      window.location.href = "mailto:sales@clientflow.io";
      return;
    }
    // Existing subscriber switching plans → show proration preview rather than
    // a fresh checkout (which would create a duplicate subscription).
    if (hasActiveSubscription) {
      setPreviewTarget(plan);
      return;
    }
    void startCheckout(plan.code);
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

        {plans.length === 0 ? (
          <div className="border-border bg-card text-muted-foreground rounded-xl border p-6 text-center text-sm">
            No plans are currently available.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {plans.map((plan) => {
              const isCurrent = currentPlanCode?.toLowerCase() === plan.code.toLowerCase();
              const isLoading = loadingPlan === plan.code;
              const featured = plan.recommendedBadge === "popular";
              const { label, period } = formatPrice(plan);

              return (
                <div
                  key={plan.code}
                  className={`flex flex-col rounded-xl border p-5 transition-shadow ${
                    featured
                      ? "border-primary from-brand-100/30 to-brand-100/10 ring-primary/20 bg-gradient-to-b shadow-md ring-1"
                      : "border-border bg-card hover:shadow-sm"
                  }`}
                >
                  <div className="mb-4">
                    {featured ? (
                      <span className="bg-primary text-primary-foreground mb-2 inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold tracking-widest uppercase">
                        Most Popular
                      </span>
                    ) : (
                      <span className="mb-2 inline-block h-5" />
                    )}
                    <h3 className="font-display text-foreground text-lg font-bold">{plan.name}</h3>
                    {plan.description && (
                      <p className="text-muted-foreground text-xs leading-relaxed">
                        {plan.description}
                      </p>
                    )}
                  </div>

                  <div className="mb-5 flex items-end gap-1">
                    <span className="font-display text-foreground text-3xl font-extrabold tracking-tight">
                      {label}
                    </span>
                    {period && <span className="text-muted-foreground mb-1 text-sm">{period}</span>}
                  </div>

                  <div className="bg-border mb-4 h-px" />

                  <ul className="mb-6 flex-1 space-y-2.5">
                    {plan.features.map((f) => (
                      <li key={f} className="text-foreground/80 flex items-start gap-2.5 text-sm">
                        <span className="bg-success/15 mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full">
                          <Check size={10} className="text-success" strokeWidth={3} />
                        </span>
                        {f}
                      </li>
                    ))}
                  </ul>

                  <Button
                    variant={featured ? "default" : "outline"}
                    className="w-full cursor-pointer"
                    disabled={isCurrent || isLoading || loadingPlan !== null}
                    onClick={() => handleSelectPlan(plan)}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 size={14} className="mr-1.5 animate-spin" /> Redirecting…
                      </>
                    ) : isCurrent ? (
                      "Current Plan"
                    ) : hasActiveSubscription ? (
                      "Switch to this plan"
                    ) : (
                      planCta(plan)
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </DialogContent>

      {previewTarget &&
        (() => {
          // Direction is purely cosmetic - the change-plan call applies proration
          // either way - but it gives the user clearer copy. Compare monthly
          // prices since both plans expose them; null prices fall back to
          // "lateral" so we don't claim a direction we can't justify.
          const fromPrice = plans.find(
            (p) => p.code.toLowerCase() === currentPlanCode?.toLowerCase(),
          )?.monthlyPriceCents;
          const toPrice = previewTarget.monthlyPriceCents;
          const direction: "upgrade" | "downgrade" | "lateral" =
            fromPrice == null || toPrice == null
              ? "lateral"
              : toPrice > fromPrice
                ? "upgrade"
                : toPrice < fromPrice
                  ? "downgrade"
                  : "lateral";

          return (
            <PlanChangePreviewDialog
              open={previewTarget !== null}
              onClose={() => setPreviewTarget(null)}
              onApplied={() => {
                setPreviewTarget(null);
                onClose();
                router.refresh();
              }}
              fromPlanName={currentPlanName}
              toPlanName={previewTarget.name}
              toPlanCode={previewTarget.code}
              direction={direction}
            />
          );
        })()}
    </Dialog>
  );
}
