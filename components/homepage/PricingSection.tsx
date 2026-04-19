"use client";

import { motion } from "framer-motion";
import { CreditCard } from "lucide-react";
import { useHomeMotion } from "@/hooks/use-home-motion";
import PlanCards from "@/components/shared/PlanCards";
import type { PublicPlan } from "@/server/public/plans";

const PricingSection = ({ plans }: { plans: PublicPlan[] }) => {
  const motionFx = useHomeMotion();

  return (
    <section className="py-24 bg-muted" id="pricing">
      <div className="container">
        <motion.div {...motionFx.inView.fadeUp} className="mx-auto max-w-2xl text-center">
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

        <PlanCards plans={plans} />
      </div>
    </section>
  );
};

export default PricingSection;
