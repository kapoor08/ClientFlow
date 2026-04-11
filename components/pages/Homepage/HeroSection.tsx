"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, ChevronRight, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useHomeMotion } from "@/hooks/use-home-motion";
import HeroDashboardPreview from "./HeroDashboardPreview";

const HeroSection = () => {
  const motionFx = useHomeMotion();

  return (
    <section className="relative overflow-hidden hero-light">
      <div className="absolute inset-0 hero-mesh" />
      <div className="absolute inset-0 hero-grid" />

      <div className="container relative z-10 pt-20 pb-10 md:pt-28 md:pb-16 lg:pt-20 lg:pb-20">
        <motion.div
          {...motionFx.hero.container}
          className="mx-auto max-w-4xl text-center"
        >
          <motion.div
            {...motionFx.hero.badge}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-brand-100 px-4 py-1.5 text-[13px] font-medium text-brand-700 backdrop-blur-sm"
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent/15">
              <Zap size={11} className="text-accent" />
            </span>
            Built for agencies that move fast
            <ChevronRight size={14} className="text-brand-300" />
          </motion.div>

          <h1 className="font-display text-[2.5rem] font-extrabold leading-[1.1] tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-[4.25rem]">
            Manage clients, projects
            <br className="hidden sm:block" />& billing in{" "}
            <span className="bg-linear-to-r from-[hsl(207,85%,38%)] via-[hsl(195,80%,38%)] to-[hsl(170,76%,41%)] bg-clip-text text-transparent">
              one platform
            </span>
          </h1>

          <motion.p
            {...motionFx.hero.lead}
            className="mx-auto mt-6 max-w-lg text-[15px] leading-relaxed text-muted-foreground md:text-base"
          >
            ClientFlow is the all-in-one SaaS platform for agencies and
            service-based teams. Stop juggling tools - start delivering results.
          </motion.p>

          <motion.div
            {...motionFx.hero.actions}
            className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center"
          >
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
              <Link href="/features">See All Features</Link>
            </Button>
          </motion.div>

          <motion.p
            {...motionFx.hero.meta}
            className="mt-5 text-[12px] text-muted-foreground/70"
          >
            No credit card required · 14-day free trial · Cancel anytime
          </motion.p>
        </motion.div>

        <motion.div
          {...motionFx.hero.mockup}
          className="mx-auto mt-12 max-w-5xl"
        >
          <HeroDashboardPreview />
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
