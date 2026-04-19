"use client";

import { motion } from "framer-motion";
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
      <div className={`mx-auto max-w-2xl rounded-2xl border border-border bg-card p-10 text-center ${className}`}>
        <p className="text-sm text-muted-foreground">No plans are currently available.</p>
      </div>
    );
  }

  return (
    <motion.div
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
            <motion.div
              key={plan.code}
              variants={motionFx.stagger.variants.item}
              className="relative flex"
            >
              <span className="absolute left-1/2 z-10 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full bg-white px-4 py-1 text-[11px] font-bold uppercase tracking-wider text-primary shadow-sm">
                Most Popular
              </span>

              <div className="flex w-full flex-col rounded-2xl bg-linear-to-br from-primary to-accent p-7 shadow-[0_20px_60px_hsl(var(--primary)/0.3)]">
                <h3 className="font-display text-xl font-bold text-white">{plan.name}</h3>
                {plan.description && (
                  <p className="mt-1 text-[13px] text-white/60">{plan.description}</p>
                )}

                <div className="mt-5 flex items-end gap-1">
                  {isCustom ? (
                    <span className="font-display text-4xl font-extrabold leading-none text-white">
                      Custom
                    </span>
                  ) : (
                    <>
                      <span className="mb-1 font-display text-base font-semibold text-white/60">$</span>
                      <span className="font-display text-5xl font-extrabold leading-none text-white">
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
                    className="group flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3 text-[13.5px] font-bold text-primary transition-all duration-200 hover:bg-white/90"
                  >
                    {cta.label}
                    <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
                  </Link>
                  {plan.trialDays && plan.trialDays > 0 && (
                    <p className="text-center text-[11px] text-white/40">
                      {plan.trialDays}-day free trial · No card required
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          );
        }

        return (
          <motion.div
            key={plan.code}
            variants={motionFx.stagger.variants.item}
            className="group flex flex-col rounded-2xl border border-border bg-card p-7 shadow-sm transition-all duration-300 hover:border-primary/20 hover:shadow-[0_8px_30px_hsl(var(--primary)/0.08)]"
          >
            <h3 className="font-display text-xl font-bold text-foreground">{plan.name}</h3>
            {plan.description && (
              <p className="mt-1 text-[13px] text-muted-foreground">{plan.description}</p>
            )}

            <div className="mt-5 flex items-end gap-1">
              {isCustom ? (
                <span className="font-display text-4xl font-extrabold leading-none text-foreground">
                  Custom
                </span>
              ) : (
                <>
                  <span className="mb-1 font-display text-base font-semibold text-muted-foreground">$</span>
                  <span className="font-display text-5xl font-extrabold leading-none text-foreground">
                    {amount}
                  </span>
                  <span className="mb-1 text-sm text-muted-foreground">{period}</span>
                </>
              )}
            </div>

            <div className="my-5 h-px bg-border" />

            <ul className="flex-1 space-y-3">
              {plan.features.map((f) => (
                <li key={f} className="flex items-center gap-2.5">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Check size={11} strokeWidth={2.5} className="text-primary" />
                  </div>
                  <span className="text-[13px] font-medium text-foreground">{f}</span>
                </li>
              ))}
            </ul>

            <div className="mt-7">
              <Link
                href={cta.href}
                className="flex w-full items-center justify-center rounded-xl border border-border bg-background py-3 text-[13.5px] font-semibold text-foreground transition-all duration-200 hover:border-primary/30 hover:text-primary"
              >
                {cta.label}
              </Link>
              {isCustom && (
                <p className="mt-2 text-center text-[11px] text-muted-foreground/50">
                  Custom onboarding included
                </p>
              )}
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
};

export default PlanCards;
