"use client";

import { m as Motion } from "framer-motion";
import PlanCards from "@/components/shared/PlanCards";
import type { PublicPlan } from "@/server/public/plans";

const PricingPage = ({ plans }: { plans: PublicPlan[] }) => {
  return (
    <>
      <section className="border-border relative overflow-hidden border-b">
        <div className="dot-grid dot-grid-fade absolute inset-0 opacity-40" />
        <div className="absolute inset-0" style={{ background: "var(--cf-hero-gradient)" }} />
        <div className="relative container py-14 md:py-20">
          <Motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mx-auto max-w-2xl text-center"
          >
            <h1 className="font-display text-foreground text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
              Plans that <span className="text-primary text-glow">scale with you</span>
            </h1>
            <p className="text-muted-foreground mt-4 text-base">
              Start free. Upgrade when you need more power.
            </p>
          </Motion.div>
        </div>
      </section>

      <section className="py-12 md:py-20">
        <div className="container">
          <PlanCards plans={plans} className="mt-8" />
        </div>
      </section>
    </>
  );
};

export default PricingPage;
