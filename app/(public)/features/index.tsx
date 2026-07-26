"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { m as Motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useMotionStagger } from "@/hooks/use-home-motion";
import { features } from "@/config/features";

// reusable motion config is consumed inside the component
const FeaturesPage = () => {
  const motionStagger = useMotionStagger({
    step: 0.05,
    initialY: 10,
    duration: 0.3,
  });
  return (
    <>
      <section className="border-border relative overflow-hidden border-b">
        <div className="dot-grid dot-grid-fade absolute inset-0 opacity-40" />
        <div className="absolute inset-0" style={{ background: "var(--cf-hero-gradient)" }} />
        <div className="relative container py-14 md:py-20">
          <Motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mx-auto max-w-2xl text-center"
          >
            <h1 className="font-display text-foreground text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
              Powerful features for <span className="text-primary text-glow">modern agencies</span>
            </h1>
            <p className="text-muted-foreground mt-4 text-base">
              Every module is designed for operational speed, role clarity, and scalability.
            </p>
          </Motion.div>
        </div>
      </section>

      <section className="py-12 md:py-16">
        <div className="container">
          <Motion.div
            variants={motionStagger.container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="mx-auto grid max-w-5xl gap-4 md:grid-cols-2"
          >
            {features.map((f) => (
              <Motion.div
                key={f.title}
                variants={motionStagger.item}
                className="border-border bg-card hover:border-primary/30 hover:shadow-cf-2 flex gap-4 rounded-xl border p-5 transition-all"
              >
                <div className="bg-primary/8 text-primary flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
                  <f.icon size={18} />
                </div>
                <div>
                  <h3 className="font-display text-foreground text-sm font-semibold">{f.title}</h3>
                  <p className="text-muted-foreground mt-1 text-[13px] leading-relaxed">{f.desc}</p>
                </div>
              </Motion.div>
            ))}
          </Motion.div>
          <div className="mt-10 text-center">
            <Button size="lg" asChild>
              <Link href="/auth/sign-up">
                Get Started Free <ArrowRight size={16} className="ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
};

export default FeaturesPage;
