"use client";

import { m as Motion } from "framer-motion";
import { ArrowRight, Layers } from "lucide-react";
import Link from "next/link";
import { features } from "@/config/features";
import { useHomeMotion } from "@/hooks/use-home-motion";

const FeaturesSection = () => {
  const motionFx = useHomeMotion();

  return (
    <section className="border-b-brand py-20" id="features">
      <div className="container">
        <Motion.div {...motionFx.inView.fadeUp} className="mx-auto max-w-2xl text-center">
          <span className="border-primary/20 bg-primary/5 text-primary inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold tracking-[0.12em] uppercase">
            <Layers size={12} /> Platform
          </span>
          <h2 className="font-display text-foreground mt-5 text-2xl font-bold md:text-3xl lg:text-[2.5rem] lg:leading-[1.15]">
            Everything your agency needs
          </h2>
          <p className="text-muted-foreground mx-auto mt-3 max-w-md text-[15px]">
            From client onboarding to invoice delivery - ClientFlow covers the full lifecycle.
          </p>
        </Motion.div>

        <Motion.div
          variants={motionFx.stagger.variants.container}
          {...motionFx.stagger.inViewWithMargin}
          className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {features.map((feature) => (
            <Motion.div
              key={feature.title}
              variants={motionFx.stagger.variants.item}
              className="group border-border bg-card hover:border-primary/20 relative rounded-xl border p-5 transition-all duration-300 hover:-translate-y-1"
            >
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-xl ${feature.iconBg} transition-transform duration-300 group-hover:scale-110`}
              >
                <feature.icon size={20} className={feature.iconColor} />
              </div>
              <h3 className="font-display text-foreground mt-4 text-[15px] font-semibold">
                {feature.title}
              </h3>
              <p className="text-muted-foreground mt-1.5 text-[13px] leading-relaxed">
                {feature.desc}
              </p>
            </Motion.div>
          ))}
        </Motion.div>

        <Motion.div {...motionFx.inView.fade} className="mt-12 text-center">
          <Link
            href="/features"
            className="text-primary inline-flex items-center gap-1.5 text-[13px] font-semibold hover:underline"
          >
            Explore all features <ArrowRight size={14} />
          </Link>
        </Motion.div>
      </div>
    </section>
  );
};

export default FeaturesSection;
