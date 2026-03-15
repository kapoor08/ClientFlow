"use client";

import { motion } from "framer-motion";
import { ArrowRight, Layers } from "lucide-react";
import Link from "next/link";
import { features } from "@/config/features";
import { useHomeMotion } from "@/hooks/use-home-motion";

const FeaturesSection = () => {
  const motionFx = useHomeMotion();

  return (
    <section className="py-20 border-b-brand" id="features">
      <div className="container">
        <motion.div
          {...motionFx.inView.fadeUp}
          className="mx-auto max-w-2xl text-center"
        >
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">
            <Layers size={12} /> Platform
          </span>
          <h2 className="mt-5 font-display text-2xl font-bold text-foreground md:text-3xl lg:text-[2.5rem] lg:leading-[1.15]">
            Everything your agency needs
          </h2>
          <p className="mt-3 text-[15px] text-muted-foreground max-w-md mx-auto">
            From client onboarding to invoice delivery — ClientFlow covers the
            full lifecycle.
          </p>
        </motion.div>

        <motion.div
          variants={motionFx.stagger.variants.container}
          {...motionFx.stagger.inViewWithMargin}
          className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={motionFx.stagger.variants.item}
              className="group relative rounded-xl border border-border bg-card p-5 transition-all duration-300 hover:border-primary/20 hover:-translate-y-1"
            >
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-xl ${feature.iconBg} transition-transform duration-300 group-hover:scale-110`}
              >
                <feature.icon size={20} className={feature.iconColor} />
              </div>
              <h3 className="mt-4 font-display text-[15px] font-semibold text-foreground">
                {feature.title}
              </h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
                {feature.desc}
              </p>
            </motion.div>
          ))}
        </motion.div>

        <motion.div {...motionFx.inView.fade} className="mt-12 text-center">
          <Link
            href="/features"
            className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-primary hover:underline"
          >
            Explore all features <ArrowRight size={14} />
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturesSection;
