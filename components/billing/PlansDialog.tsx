"use client";

import { useState } from "react";
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
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(
          (data as { error?: string }).error ?? "Failed to start checkout.",
        );
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
          <div className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
            No plans are currently available.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {plans.map((plan) => {
              const isCurrent =
                currentPlanCode?.toLowerCase() === plan.code.toLowerCase();
              const isLoading = loadingPlan === plan.code;
              const featured = plan.recommendedBadge === "popular";
              const { label, period } = formatPrice(plan);

              return (
                <div
                  key={plan.code}
                  className={`flex flex-col rounded-xl border p-5 transition-shadow ${
                    featured
                      ? "border-primary bg-gradient-to-b from-brand-100/30 to-brand-100/10 shadow-md ring-1 ring-primary/20"
                      : "border-border bg-card hover:shadow-sm"
                  }`}
                >
                  <div className="mb-4">
                    {featured ? (
                      <span className="mb-2 inline-flex items-center rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-primary-foreground">
                        Most Popular
                      </span>
                    ) : (
                      <span className="mb-2 inline-block h-5" />
                    )}
                    <h3 className="font-display text-lg font-bold text-foreground">
                      {plan.name}
                    </h3>
                    {plan.description && (
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {plan.description}
                      </p>
                    )}
                  </div>

                  <div className="mb-5 flex items-end gap-1">
                    <span className="font-display text-3xl font-extrabold tracking-tight text-foreground">
                      {label}
                    </span>
                    {period && (
                      <span className="mb-1 text-sm text-muted-foreground">{period}</span>
                    )}
                  </div>

                  <div className="mb-4 h-px bg-border" />

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

                  <Button
                    variant={featured ? "default" : "outline"}
                    className="w-full cursor-pointer"
                    disabled={isCurrent || isLoading || loadingPlan !== null}
                    onClick={() => handleSelectPlan(plan.code)}
                  >
                    {isLoading ? (
                      <><Loader2 size={14} className="mr-1.5 animate-spin" /> Redirecting…</>
                    ) : isCurrent ? "Current Plan" : planCta(plan)}
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
