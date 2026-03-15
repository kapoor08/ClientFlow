"use client";

import { motion } from "framer-motion";
import { stats } from "@/config/stats";
import { useHomeMotion } from "@/hooks/use-home-motion";

const StatsSection = () => {
  const motionFx = useHomeMotion();

  return (
    <section className="py-20">
      <div className="container">
        <div className="mx-auto max-w-4xl rounded-2xl border border-border bg-card p-10 md:p-14">
          <div className="grid grid-cols-2 gap-y-10 gap-x-6 md:grid-cols-4">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                {...motionFx.fadeUpByIndex(index)}
                className="text-center"
              >
                <div className="font-display text-3xl font-extrabold text-foreground md:text-4xl lg:text-5xl">
                  {stat.value}
                </div>
                <div className="mt-2 text-[13px] font-medium text-muted-foreground">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
