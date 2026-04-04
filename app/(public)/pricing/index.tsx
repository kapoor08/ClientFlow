"use client";

import { motion } from "framer-motion";
import PlanCards from "@/components/common/PlanCards";

const PricingPage = () => {
  return (
    <>
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 dot-grid dot-grid-fade opacity-40" />
        <div
          className="absolute inset-0"
          style={{ background: "var(--cf-hero-gradient)" }}
        />
        <div className="container relative py-14 md:py-20">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mx-auto max-w-2xl text-center"
          >
            <h1 className="font-display text-3xl font-bold tracking-tight text-foreground md:text-4xl lg:text-5xl">
              Plans that{" "}
              <span className="text-primary text-glow">scale with you</span>
            </h1>
            <p className="mt-4 text-base text-muted-foreground">
              Start free. Upgrade when you need more power.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-12 md:py-20">
        <div className="container">
          <PlanCards className="mt-8" />
        </div>
      </section>
    </>
  );
};

export default PricingPage;
