"use client";

import { motion } from "framer-motion";
import { Check, ArrowRight } from "lucide-react";
import Link from "next/link";
import { plans } from "@/config/plans";
import { useHomeMotion } from "@/hooks/use-home-motion";

interface PlanCardsProps {
  className?: string;
}

const PlanCards = ({ className = "mt-20" }: PlanCardsProps) => {
  const motionFx = useHomeMotion();

  return (
    <motion.div
      variants={motionFx.stagger.variants.container}
      {...motionFx.stagger.inView}
      className={`mx-auto grid max-w-7xl items-stretch gap-5 md:grid-cols-3 ${className}`}
    >
      {plans.map((plan) => {
        const isFeatured = !!plan.featured;

        if (isFeatured) {
          return (
            <motion.div
              key={plan.name}
              variants={motionFx.stagger.variants.item}
              className="relative flex"
            >
              {/* Badge protruding from top center */}
              <span className="absolute left-1/2 z-10 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full bg-white px-4 py-1 text-[11px] font-bold uppercase tracking-wider text-primary shadow-sm">
                Most Popular
              </span>

              {/* Gradient card */}
              <div className="flex w-full flex-col rounded-2xl bg-linear-to-br from-primary to-accent p-7 shadow-[0_20px_60px_hsl(var(--primary)/0.3)]">
                <h3 className="font-display text-xl font-bold text-white">
                  {plan.name}
                </h3>
                <p className="mt-1 text-[13px] text-white/60">{plan.desc}</p>

                <div className="mt-5 flex items-end gap-1">
                  <span className="mb-1 font-display text-base font-semibold text-white/60">
                    $
                  </span>
                  <span className="font-display text-5xl font-extrabold leading-none text-white">
                    {plan.price.replace("$", "")}
                  </span>
                  <span className="mb-1 text-sm text-white/50">
                    {plan.period}
                  </span>
                </div>

                <div className="my-5 h-px bg-white/20" />

                <ul className="flex-1 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5">
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/20">
                        <Check
                          size={11}
                          strokeWidth={2.5}
                          className="text-white"
                        />
                      </div>
                      <span className="text-[13px] font-medium text-white/85">
                        {f}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="mt-7 space-y-2.5">
                  <Link
                    href="/auth/sign-up"
                    className="group flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3 text-[13.5px] font-bold text-primary transition-all duration-200 hover:bg-white/90"
                  >
                    {plan.cta}
                    <ArrowRight
                      size={14}
                      className="transition-transform group-hover:translate-x-0.5"
                    />
                  </Link>
                  <p className="text-center text-[11px] text-white/40">
                    14-day free trial · No card required
                  </p>
                </div>
              </div>
            </motion.div>
          );
        }

        return (
          <motion.div
            key={plan.name}
            variants={motionFx.stagger.variants.item}
            className="group flex flex-col rounded-2xl border border-border bg-card p-7 shadow-sm transition-all duration-300 hover:border-primary/20 hover:shadow-[0_8px_30px_hsl(var(--primary)/0.08)]"
          >
            <h3 className="font-display text-xl font-bold text-foreground">
              {plan.name}
            </h3>
            <p className="mt-1 text-[13px] text-muted-foreground">
              {plan.desc}
            </p>

            <div className="mt-5 flex items-end gap-1">
              {plan.price !== "Custom" ? (
                <>
                  <span className="mb-1 font-display text-base font-semibold text-muted-foreground">
                    $
                  </span>
                  <span className="font-display text-5xl font-extrabold leading-none text-foreground">
                    {plan.price.replace("$", "")}
                  </span>
                  <span className="mb-1 text-sm text-muted-foreground">
                    {plan.period}
                  </span>
                </>
              ) : (
                <span className="font-display text-4xl font-extrabold leading-none text-foreground">
                  Custom
                </span>
              )}
            </div>

            <div className="my-5 h-px bg-border" />

            <ul className="flex-1 space-y-3">
              {plan.features.map((f) => (
                <li key={f} className="flex items-center gap-2.5">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Check
                      size={11}
                      strokeWidth={2.5}
                      className="text-primary"
                    />
                  </div>
                  <span className="text-[13px] font-medium text-foreground">
                    {f}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-7">
              <Link
                href={plan.code === "enterprise" ? "/contact" : "/auth/sign-up"}
                className="flex w-full items-center justify-center rounded-xl border border-border bg-background py-3 text-[13.5px] font-semibold text-foreground transition-all duration-200 hover:border-primary/30 hover:text-primary"
              >
                {plan.cta}
              </Link>
              {plan.code === "enterprise" && (
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
