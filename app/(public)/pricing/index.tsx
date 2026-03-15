"use client";
import { Button } from "@/components/ui/button";
import { plans } from "@/config/plans";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import Link from "next/link";
import { useMotionStagger } from "@/hooks/use-home-motion";

const PricingPage = () => {
  const motionStagger = useMotionStagger({
    step: 0.06,
    initialY: 10,
    duration: 0.3,
  });

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

      <section className="py-12 md:py-16">
        <div className="container">
          <motion.div
            variants={motionStagger.container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="mx-auto grid max-w-4xl gap-4 md:grid-cols-3"
          >
            {plans.map((plan) => (
              <motion.div
                key={plan.name}
                variants={motionStagger.item}
                className={`flex flex-col rounded-xl border p-5 transition-shadow ${
                  plan.featured
                    ? "border-primary bg-card shadow-cf-2 ring-1 ring-primary/20"
                    : "border-border bg-card shadow-cf-1 hover:shadow-cf-2"
                }`}
              >
                {plan.featured && (
                  <span className="mb-3 inline-block self-start rounded-pill bg-primary px-3 py-0.5 text-[11px] font-semibold text-primary-foreground">
                    Most Popular
                  </span>
                )}
                <h3 className="font-display text-base font-semibold text-foreground">
                  {plan.name}
                </h3>
                <div className="mt-1.5 flex items-baseline gap-1">
                  <span className="font-display text-3xl font-bold text-foreground">
                    {plan.price}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {plan.period}
                  </span>
                </div>
                <p className="mt-1.5 text-[13px] text-muted-foreground">
                  {plan.desc}
                </p>
                <ul className="mt-5 flex-1 space-y-2">
                  {plan.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-center gap-2 text-[13px] text-foreground"
                    >
                      <Check size={14} className="shrink-0 text-primary" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  className="mt-5"
                  variant={plan.featured ? "default" : "outline"}
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
    </>
  );
};

export default PricingPage;
