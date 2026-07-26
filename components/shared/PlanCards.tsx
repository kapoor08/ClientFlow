"use client";

import { m as Motion } from "framer-motion";
import { Check, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useHomeMotion } from "@/hooks/use-home-motion";
import type { PublicPlan } from "@/server/public/plans";

interface PlanCardsProps {
  plans: PublicPlan[];
  className?: string;
}

function formatPriceParts(plan: PublicPlan): { amount: string; period: string; isCustom: boolean } {
  if (plan.monthlyPriceCents == null) {
    return { amount: "Custom", period: "", isCustom: true };
  }
  const dollars = Math.round(plan.monthlyPriceCents / 100);
  return { amount: `${dollars}`, period: "/mo", isCustom: false };
}

function planCta(plan: PublicPlan): { label: string; href: string } {
  if (plan.code === "enterprise" || plan.monthlyPriceCents == null) {
    return { label: "Contact Sales", href: "/contact" };
  }
  return { label: "Start Free Trial", href: "/auth/sign-up" };
}

const PlanCards = ({ plans, className = "mt-20" }: PlanCardsProps) => {
  const motionFx = useHomeMotion();

  if (plans.length === 0) {
    return (
      <div
        className={`border-border bg-card mx-auto max-w-2xl rounded-2xl border p-10 text-center ${className}`}
      >
        <p className="text-muted-foreground text-sm">No plans are currently available.</p>
      </div>
    );
  }

  return (
    <Motion.div
      variants={motionFx.stagger.variants.container}
      {...motionFx.stagger.inView}
      className={`mx-auto grid max-w-7xl items-stretch gap-5 md:grid-cols-${Math.min(plans.length, 3)} ${className}`}
    >
      {plans.map((plan) => {
        const isFeatured = plan.recommendedBadge === "popular";
        const { amount, period, isCustom } = formatPriceParts(plan);
        const cta = planCta(plan);

        if (isFeatured) {
          return (
            <Motion.div
              key={plan.code}
              variants={motionFx.stagger.variants.item}
              className="relative flex"
            >
              <span className="text-primary absolute left-1/2 z-10 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white px-4 py-1 text-[11px] font-bold tracking-wider whitespace-nowrap uppercase shadow-sm">
                Most Popular
              </span>

              <div className="from-primary to-accent flex w-full flex-col rounded-2xl bg-linear-to-br p-7 shadow-[0_20px_60px_hsl(var(--primary)/0.3)]">
                <h3 className="font-display text-xl font-bold text-white">{plan.name}</h3>
                {plan.description && (
                  <p className="mt-1 text-[13px] text-white/60">{plan.description}</p>
                )}

                <div className="mt-5 flex items-end gap-1">
                  {isCustom ? (
                    <span className="font-display text-4xl leading-none font-extrabold text-white">
                      Custom
                    </span>
                  ) : (
                    <>
                      <span className="font-display mb-1 text-base font-semibold text-white/60">
                        $
                      </span>
                      <span className="font-display text-5xl leading-none font-extrabold text-white">
                        {amount}
                      </span>
                      <span className="mb-1 text-sm text-white/50">{period}</span>
                    </>
                  )}
                </div>

                <div className="my-5 h-px bg-white/20" />

                <ul className="flex-1 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5">
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/20">
                        <Check size={11} strokeWidth={2.5} className="text-white" />
                      </div>
                      <span className="text-[13px] font-medium text-white/85">{f}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-7 space-y-2.5">
                  <Link
                    href={cta.href}
                    className="group text-primary flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3 text-[13.5px] font-bold transition-all duration-200 hover:bg-white/90"
                  >
                    {cta.label}
                    <ArrowRight
                      size={14}
                      className="transition-transform group-hover:translate-x-0.5"
                    />
                  </Link>
                  {plan.trialDays && plan.trialDays > 0 && (
                    <p className="text-center text-[11px] text-white/40">
                      {plan.trialDays}-day free trial · No card required
                    </p>
                  )}
                </div>
              </div>
            </Motion.div>
          );
        }

        return (
          <Motion.div
            key={plan.code}
            variants={motionFx.stagger.variants.item}
            className="group border-border bg-card hover:border-primary/20 flex flex-col rounded-2xl border p-7 shadow-sm transition-all duration-300 hover:shadow-[0_8px_30px_hsl(var(--primary)/0.08)]"
          >
            <h3 className="font-display text-foreground text-xl font-bold">{plan.name}</h3>
            {plan.description && (
              <p className="text-muted-foreground mt-1 text-[13px]">{plan.description}</p>
            )}

            <div className="mt-5 flex items-end gap-1">
              {isCustom ? (
                <span className="font-display text-foreground text-4xl leading-none font-extrabold">
                  Custom
                </span>
              ) : (
                <>
                  <span className="font-display text-muted-foreground mb-1 text-base font-semibold">
                    $
                  </span>
                  <span className="font-display text-foreground text-5xl leading-none font-extrabold">
                    {amount}
                  </span>
                  <span className="text-muted-foreground mb-1 text-sm">{period}</span>
                </>
              )}
            </div>

            <div className="bg-border my-5 h-px" />

            <ul className="flex-1 space-y-3">
              {plan.features.map((f) => (
                <li key={f} className="flex items-center gap-2.5">
                  <div className="bg-primary/10 flex h-5 w-5 shrink-0 items-center justify-center rounded-full">
                    <Check size={11} strokeWidth={2.5} className="text-primary" />
                  </div>
                  <span className="text-foreground text-[13px] font-medium">{f}</span>
                </li>
              ))}
            </ul>

            <div className="mt-7">
              <Link
                href={cta.href}
                className="border-border bg-background text-foreground hover:border-primary/30 hover:text-primary flex w-full items-center justify-center rounded-xl border py-3 text-[13.5px] font-semibold transition-all duration-200"
              >
                {cta.label}
              </Link>
              {isCustom && (
                <p className="text-muted-foreground/50 mt-2 text-center text-[11px]">
                  Custom onboarding included
                </p>
              )}
            </div>
          </Motion.div>
        );
      })}
    </Motion.div>
  );
};

export default PlanCards;
