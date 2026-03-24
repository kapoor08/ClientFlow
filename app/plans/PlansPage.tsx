"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { plans } from "@/config/plans";

export default function PlansPage({ isExpired }: { isExpired: boolean }) {
  const router = useRouter();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [skipping, setSkipping] = useState(false);

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

  async function handleSkip() {
    setSkipping(true);
    try {
      await fetch("/api/billing/trial", { method: "POST" });
      router.push("/dashboard");
    } finally {
      setSkipping(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12">
      {/* Header */}
      <div className="mb-10 text-center">
        <div className="mb-4 flex items-center justify-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <span className="font-display text-sm font-bold text-primary-foreground">
              CF
            </span>
          </div>
          <span className="font-display text-xl font-semibold text-foreground">
            ClientFlow
          </span>
        </div>

        {isExpired ? (
          <>
            <h1 className="font-display text-3xl font-bold text-foreground">
              Your free trial has ended
            </h1>
            <p className="mt-2 text-muted-foreground">
              Choose a plan to continue using ClientFlow.
            </p>
          </>
        ) : (
          <>
            <h1 className="font-display text-3xl font-bold text-foreground">
              Choose your plan
            </h1>
            <p className="mt-2 text-muted-foreground">
              Start with a 14-day free trial. No credit card required.
            </p>
          </>
        )}
      </div>

      {/* Plan cards */}
      <div className="grid w-full max-w-4xl grid-cols-1 gap-4 sm:grid-cols-3">
        {plans.map((plan) => {
          const isLoading = loadingPlan === plan.code;

          return (
            <div
              key={plan.code}
              className={`flex flex-col rounded-xl border p-6 transition-shadow ${
                plan.featured
                  ? "border-primary bg-linear-to-b from-brand-100/30 to-brand-100/10 shadow-md ring-1 ring-primary/20"
                  : "border-border bg-card hover:shadow-sm"
              }`}
            >
              <div className="mb-4">
                {plan.featured ? (
                  <span className="mb-2 inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-primary-foreground">
                    <Sparkles size={9} /> Most Popular
                  </span>
                ) : (
                  <span className="mb-2 inline-block h-5" />
                )}
                <h3 className="font-display text-xl font-bold text-foreground">
                  {plan.name}
                </h3>
                <p className="text-xs text-muted-foreground">{plan.desc}</p>
              </div>

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

              <div className="mb-4 h-px bg-border" />

              <ul className="mb-6 flex-1 space-y-2.5">
                {plan.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-2.5 text-sm text-foreground/80"
                  >
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-success/15">
                      <Check
                        size={10}
                        className="text-success"
                        strokeWidth={3}
                      />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>

              <Button
                variant={plan.featured ? "default" : "outline"}
                className="w-full cursor-pointer"
                disabled={isLoading || loadingPlan !== null || skipping}
                onClick={() => handleSelectPlan(plan.code)}
              >
                {isLoading ? (
                  <>
                    <Loader2 size={14} className="mr-1.5 animate-spin" />
                    Redirecting…
                  </>
                ) : (
                  plan.cta
                )}
              </Button>
            </div>
          );
        })}
      </div>

      {/* Skip */}
      {!isExpired && (
        <div className="mt-8 text-center">
          <button
            onClick={handleSkip}
            disabled={skipping || loadingPlan !== null}
            className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline disabled:opacity-50 cursor-pointer"
          >
            {skipping ? (
              <span className="flex items-center gap-1.5">
                <Loader2 size={13} className="animate-spin" /> Starting trial…
              </span>
            ) : (
              "Skip for now — start my 14-day free trial"
            )}
          </button>
        </div>
      )}
    </div>
  );
}
