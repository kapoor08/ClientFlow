"use client";

import { m as Motion } from "framer-motion";
import { CreditCard } from "lucide-react";
import { useHomeMotion } from "@/hooks/use-home-motion";
import PlanCards from "@/components/shared/PlanCards";
import type { PublicPlan } from "@/server/public/plans";

const PricingSection = ({ plans }: { plans: PublicPlan[] }) => {
  const motionFx = useHomeMotion();

  return (
    <section className="bg-muted py-24" id="pricing">
      <div className="container">
        <Motion.div {...motionFx.inView.fadeUp} className="mx-auto max-w-2xl text-center">
          <span className="border-primary/20 bg-primary/5 text-primary inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold tracking-[0.12em] uppercase">
            <CreditCard size={12} /> Pricing
          </span>
          <h2 className="font-display text-foreground mt-5 text-2xl font-bold md:text-3xl lg:text-[2.5rem]">
            Simple, transparent pricing
          </h2>
          <p className="text-muted-foreground mt-3 text-[15px]">
            Start free, scale as you grow. No hidden fees.
          </p>
        </Motion.div>

        <PlanCards plans={plans} />
      </div>
    </section>
  );
};

export default PricingSection;
