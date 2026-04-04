"use client";

import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";
import { testimonials } from "@/config/testimonials";
import { useHomeMotion } from "@/hooks/use-home-motion";

const TestimonialsSection = () => {
  const motionFx = useHomeMotion();

  return (
    <section className="relative py-20 bg-muted">
      <div className="container">
        <motion.div
          {...motionFx.inView.fadeUp}
          className="mx-auto max-w-2xl text-center"
        >
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">
            <Star size={12} /> Testimonials
          </span>
          <h2 className="mt-5 font-display text-2xl font-bold text-foreground md:text-3xl">
            Loved by agencies worldwide
          </h2>
        </motion.div>

        <motion.div
          variants={motionFx.stagger.variants.container}
          {...motionFx.stagger.inView}
          className="mx-auto mt-12 grid max-w-7xl gap-5 md:grid-cols-3"
        >
          {testimonials.map((item) => (
            <motion.div
              key={item.name}
              variants={motionFx.stagger.variants.item}
              className="relative rounded-xl border border-border bg-card p-6 transition-all duration-300 hover:border-primary/15 hover:-translate-y-1"
            >
              <Quote size={20} className="text-primary/15 mb-3" />
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={14}
                    className="fill-amber-400 text-amber-400"
                  />
                ))}
              </div>
              <p className="text-[14px] leading-[1.7] text-foreground/85">
                “{item.quote}”
              </p>
              <div className="mt-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-display text-[12px] font-bold text-primary">
                  {item.avatar}
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-foreground">
                    {item.name}
                  </p>
                  <p className="text-[12px] text-muted-foreground">
                    {item.role}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
