"use client";

import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, Star, Users, Zap } from "lucide-react";
import Link from "next/link";
import { useHomeMotion } from "@/hooks/use-home-motion";

const TRUST_ITEMS = [
  { icon: Users, label: "2,000+ agencies" },
  { icon: Star, label: "4.9 / 5 rating" },
  { icon: Zap, label: "Setup in minutes" },
];

const CTASection = () => {
  const motionFx = useHomeMotion();

  return (
    <section className="relative overflow-hidden bg-brand-900 py-28">
      {/* Radial glow at top */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,hsl(var(--primary)/0.22),transparent)]" />

      {/* Dot grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "radial-gradient(hsl(0 0% 100%) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* Corner glow blobs */}
      <div className="pointer-events-none absolute -left-32 top-1/2 h-96 w-96 -translate-y-1/2 rounded-full bg-primary/15 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 top-1/2 h-96 w-96 -translate-y-1/2 rounded-full bg-accent/10 blur-3xl" />

      {/* Accent line at top */}
      <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-primary/50 to-transparent" />

      <div className="container relative z-10">
        <motion.div
          {...motionFx.inView.fadeUp}
          className="mx-auto max-w-3xl text-center"
        >
          {/* Eyebrow badge */}
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/60 backdrop-blur-sm">
            <Zap size={10} className="text-accent" />
            Start for free today
          </span>

          {/* Headline */}
          <h2 className="mt-6 font-display text-3xl font-extrabold leading-[1.1] tracking-tight text-white md:text-4xl lg:text-[3.25rem]">
            Ready to streamline
            <br />
            <span className="bg-linear-to-r from-brand-300 via-[hsl(195,80%,65%)] to-accent bg-clip-text text-transparent">
              your agency?
            </span>
          </h2>

          {/* Subtext */}
          <p className="mx-auto mt-5 max-w-lg text-[15px] leading-relaxed text-white/45">
            Join thousands of agencies already using ClientFlow to manage clients,
            projects, and billing - all in one place.
          </p>

          {/* CTA buttons */}
          <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/auth/sign-up"
              className="group inline-flex items-center gap-2 rounded-full bg-white px-7 py-3 text-[14px] font-bold text-brand-900 shadow-[0_0_30px_hsl(var(--primary)/0.4)] transition-all duration-200 hover:bg-brand-100 hover:-translate-y-0.5 hover:shadow-[0_0_40px_hsl(var(--primary)/0.5)]"
            >
              Start Free Trial
              <ArrowRight
                size={16}
                className="transition-transform duration-200 group-hover:translate-x-0.5"
              />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-7 py-3 text-[14px] font-semibold text-white/80 backdrop-blur-sm transition-all duration-200 hover:border-white/30 hover:bg-white/10 hover:-translate-y-0.5"
            >
              Talk to Sales
            </Link>
          </div>

          {/* Trust strip */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-6">
            {TRUST_ITEMS.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-2 text-[12px] text-white/35"
              >
                <Icon size={13} className="text-white/25" />
                {label}
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Accent line at bottom */}
      <div className="absolute inset-x-0 bottom-0 h-px bg-linear-to-r from-transparent via-white/10 to-transparent" />
    </section>
  );
};

export default CTASection;
