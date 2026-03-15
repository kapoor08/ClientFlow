"use client";

import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useHomeMotion } from "@/hooks/use-home-motion";

const CTASection = () => {
  const motionFx = useHomeMotion();

  return (
    <section className="relative overflow-hidden hero-dark noise py-24">
      <div className="absolute inset-0 hero-mesh" />
      <div className="absolute inset-0 hero-grid" />

      <div className="container relative z-10">
        <motion.div
          {...motionFx.inView.fadeUp}
          className="mx-auto max-w-2xl text-center"
        >
          <h2 className="font-display text-3xl font-bold text-white md:text-4xl lg:text-5xl">
            Ready to streamline
            <br />
            <span className="bg-linear-to-r from-[hsl(207,85%,68%)] to-[hsl(170,76%,55%)] bg-clip-text text-transparent">
              your agency?
            </span>
          </h2>
          <p className="mt-5 text-[15px] text-white/45">
            Join 2,000+ agencies already using ClientFlow. Start your free trial
            today.
          </p>
          <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button
              size="lg"
              asChild
              className="btn-hero-primary rounded-full px-7"
            >
              <Link href="/auth/sign-up">
                Start Free Trial <ArrowRight size={16} className="ml-2" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="ghost"
              asChild
              className="btn-hero-secondary rounded-full px-7"
            >
              <Link href="/contact">Talk to Sales</Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
