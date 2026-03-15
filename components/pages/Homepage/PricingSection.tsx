"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, CreditCard } from "lucide-react";
import Link from "next/link";
import { plans } from "@/config/plans";
import { useHomeMotion } from "@/hooks/use-home-motion";

const PricingSection = () => {
  const motionFx = useHomeMotion();

  return (
    <section className="py-20 bg-muted" id="pricing">
      <div className="container">
        <motion.div
          {...motionFx.inView.fadeUp}
          className="mx-auto max-w-2xl text-center"
        >
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">
            <CreditCard size={12} /> Pricing
          </span>
          <h2 className="mt-5 font-display text-2xl font-bold text-foreground md:text-3xl lg:text-[2.5rem]">
            Simple, transparent pricing
          </h2>
          <p className="mt-3 text-[15px] text-muted-foreground">
            Start free, scale as you grow. No hidden fees.
          </p>
        </motion.div>

        <motion.div
          variants={motionFx.stagger.variants.container}
          {...motionFx.stagger.inView}
          className="mx-auto mt-14 grid max-w-4xl gap-5 md:grid-cols-3"
        >
          {plans.map((plan) => (
            <motion.div
              key={plan.name}
              variants={motionFx.stagger.variants.item}
              className={`flex flex-col rounded-xl border p-6 transition-all duration-300 ${
                plan.featured
                  ? "border-primary/30 bg-card relative scale-[1.02]"
                  : "border-border bg-card hover:border-primary/15 hover:-translate-y-1"
              }`}
            >
              {plan.featured && (
                <span className="mb-3 inline-block self-start rounded-full bg-primary px-3 py-0.5 text-[11px] font-semibold text-primary-foreground">
                  Most Popular
                </span>
              )}
              <h3 className="font-display text-lg font-semibold text-foreground">
                {plan.name}
              </h3>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="font-display text-4xl font-extrabold text-foreground">
                  {plan.price}
                </span>
                <span className="text-sm text-muted-foreground">
                  {plan.period}
                </span>
              </div>
              <p className="mt-2 text-[13px] text-muted-foreground">
                {plan.desc}
              </p>
              <ul className="mt-6 flex-1 space-y-2.5">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-center gap-2.5 text-[13px] text-foreground"
                  >
                    <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <Check size={10} className="text-primary" />
                    </div>
                    {feature}
                  </li>
                ))}
              </ul>
              <Button
                className="mt-6 rounded-lg"
                variant={plan.featured ? "default" : "outline"}
                size="lg"
                asChild
              >
                <Link
                  href={
                    plan.name === "Enterprise" ? "/contact" : "/auth/sign-up"
                  }
                >
                  {plan.cta}
                </Link>
              </Button>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default PricingSection;
