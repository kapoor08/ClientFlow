"use client";

import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, ChevronRight, Zap } from "lucide-react";
import Link from "next/link";
import { useHomeMotion } from "@/hooks/use-home-motion";

const mockupStats = ["Clients", "Projects", "Revenue", "Tasks"];

const DashboardMockup = () => (
  <div className="mockup-frame">
    <div className="mockup-dots">
      <span />
      <span />
      <span />
      <div className="ml-auto flex items-center gap-2">
        <div className="h-2 w-16 rounded-full bg-white/60" />
        <div className="h-2 w-10 rounded-full bg-white/60" />
      </div>
    </div>
    <div className="p-4 md:p-6">
      <div className="grid grid-cols-4 gap-3 mb-4">
        {mockupStats.map((label) => (
          <div
            key={label}
            className="rounded-lg border border-white/10 bg-white/5 p-3"
          >
            <div className="text-[10px] text-white/30 uppercase tracking-wider">
              {label}
            </div>
            <div className="mt-1 font-display text-lg font-bold text-white/70">
              {label === "Revenue"
                ? "$48.2K"
                : label === "Tasks"
                  ? "142"
                  : label === "Projects"
                    ? "28"
                    : "156"}
            </div>
            <div className="mt-1 h-1 w-3/4 rounded-full bg-linear-to-r from-primary to-accent opacity-40" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2 rounded-lg border border-white/10 bg-white/5 p-3">
          <div className="text-[10px] text-white/30 uppercase tracking-wider mb-3">
            Revenue Trend
          </div>
          <div className="flex items-end gap-1.5 h-16">
            {[35, 45, 30, 55, 65, 50, 70, 80, 60, 75, 85, 90].map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-sm bg-linear-to-t from-primary to-primary/30"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/5 p-3">
          <div className="text-[10px] text-white/30 uppercase tracking-wider mb-2">
            Recent
          </div>
          <div className="space-y-2">
            {["Design Review", "Sprint Planning", "Client Call"].map((t) => (
              <div key={t} className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-accent" />
                <span className="text-[11px] text-white/40">{t}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

const HeroSection = () => {
  const motionFx = useHomeMotion();

  return (
    <section className="relative overflow-hidden hero-dark noise">
      <div className="absolute inset-0 hero-mesh" />
      <div className="absolute inset-0 hero-grid" />

      <div className="container relative z-10 pt-20 pb-10 md:pt-28 md:pb-16 lg:pt-20 lg:pb-20">
        <motion.div
          {...motionFx.hero.container}
          className="mx-auto max-w-4xl text-center"
        >
          <motion.div
            {...motionFx.hero.badge}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-[13px] font-medium text-white/60 backdrop-blur-sm"
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent/20">
              <Zap size={11} className="text-accent" />
            </span>
            Built for agencies that move fast
            <ChevronRight size={14} className="text-white/30" />
          </motion.div>

          <h1 className="font-display text-[2.5rem] font-extrabold leading-[1.1] tracking-tight text-white sm:text-5xl md:text-6xl lg:text-[4.25rem]">
            Manage clients, projects
            <br className="hidden sm:block" />& billing in{" "}
            <span className="bg-linear-to-r from-[hsl(207,85%,68%)] via-[hsl(195,80%,60%)] to-[hsl(170,76%,55%)] bg-clip-text text-transparent">
              one platform
            </span>
          </h1>

          <motion.p
            {...motionFx.hero.lead}
            className="mx-auto mt-6 max-w-lg text-[15px] leading-relaxed text-white/50 md:text-base"
          >
            ClientFlow is the all-in-one SaaS platform for agencies and
            service-based teams. Stop juggling tools — start delivering results.
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
            className="mt-5 text-[12px] text-white/30"
          >
            No credit card required - 14-day free trial - Cancel anytime
          </motion.p>
        </motion.div>

        <motion.div
          {...motionFx.hero.mockup}
          className="mx-auto mt-12 max-w-4xl"
        >
          <DashboardMockup />
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
