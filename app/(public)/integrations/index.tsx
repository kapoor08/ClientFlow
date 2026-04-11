"use client";
import Link from "next/link";
import { useMotionStagger } from "@/hooks/use-home-motion";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Puzzle, ArrowRight, Zap } from "lucide-react";
import { categories } from "@/config/integrations";

const IntegrationsPage = () => {
  const motionStagger = useMotionStagger({
    step: 0.04,
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
            className="mx-auto max-w-3xl text-center"
          >
            <div className="mb-4 inline-flex items-center gap-2 rounded-pill border border-border bg-card px-4 py-1.5 text-xs font-medium text-muted-foreground shadow-cf-1">
              <Puzzle size={14} className="text-primary" />
              Connect your stack
            </div>
            <h1 className="font-display text-3xl font-bold tracking-tight text-foreground md:text-4xl lg:text-5xl">
              Integrations that{" "}
              <span className="text-primary text-glow">
                power your workflow
              </span>
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground">
              ClientFlow connects with the tools your agency already uses. No
              context switching - just seamless workflows.
            </p>
          </motion.div>
        </div>
      </section>

      {categories.map((cat, i) => (
        <section
          key={cat.name}
          className={`py-10 md:py-14 ${i % 2 === 1 ? "bg-card border-y border-border" : ""}`}
        >
          <div className="container">
            <h2 className="font-display text-lg font-bold text-foreground">
              {cat.name}
            </h2>
            <motion.div
              variants={motionStagger.container}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            >
              {cat.integrations.map((int) => (
                <motion.div
                  key={int.name}
                  variants={motionStagger.item}
                  className="rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/30 hover:shadow-cf-2"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/8 text-primary">
                    <Zap size={18} />
                  </div>
                  <h3 className="mt-3 font-display text-sm font-semibold text-foreground">
                    {int.name}
                  </h3>
                  <p className="mt-1.5 text-[13px] text-muted-foreground">
                    {int.desc}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      ))}

      <section className="py-12 md:py-16">
        <div className="container mx-auto max-w-2xl text-center">
          <h2 className="font-display text-xl font-bold text-foreground">
            Need a custom integration?
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Use the ClientFlow REST API and webhooks to build custom
            integrations for your unique workflows.
          </p>
          <div className="mt-5 flex justify-center gap-3">
            <Button size="sm" asChild>
              <Link href="/api-docs">
                API Documentation <ArrowRight size={14} className="ml-1" />
              </Link>
            </Button>
            <Button size="sm" variant="outline" asChild>
              <Link href="/contact">Talk to Us</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
};

export default IntegrationsPage;
