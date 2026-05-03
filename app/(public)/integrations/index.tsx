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
      <section className="border-border relative overflow-hidden border-b">
        <div className="dot-grid dot-grid-fade absolute inset-0 opacity-40" />
        <div className="absolute inset-0" style={{ background: "var(--cf-hero-gradient)" }} />
        <div className="relative container py-14 md:py-20">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mx-auto max-w-3xl text-center"
          >
            <div className="rounded-pill border-border bg-card text-muted-foreground shadow-cf-1 mb-4 inline-flex items-center gap-2 border px-4 py-1.5 text-xs font-medium">
              <Puzzle size={14} className="text-primary" />
              Built on a serious stack
            </div>
            <h1 className="font-display text-foreground text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
              The services that <span className="text-primary text-glow">power ClientFlow</span>
            </h1>
            <p className="text-muted-foreground mx-auto mt-4 max-w-xl text-base">
              We build on best-in-class infrastructure so you don&apos;t have to. Here&apos;s what
              runs under the hood - billing, email, file storage, observability, and more.
            </p>
          </motion.div>
        </div>
      </section>

      {categories.map((cat, i) => (
        <section
          key={cat.name}
          className={`py-10 md:py-14 ${i % 2 === 1 ? "bg-card border-border border-y" : ""}`}
        >
          <div className="container">
            <h2 className="font-display text-foreground text-lg font-bold">{cat.name}</h2>
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
                  className="border-border bg-card hover:border-primary/30 hover:shadow-cf-2 rounded-xl border p-5 transition-all"
                >
                  <div className="bg-primary/8 text-primary flex h-9 w-9 items-center justify-center rounded-lg">
                    <Zap size={18} />
                  </div>
                  <h3 className="font-display text-foreground mt-3 text-sm font-semibold">
                    {int.name}
                  </h3>
                  <p className="text-muted-foreground mt-1.5 text-[13px]">{int.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      ))}

      <section className="py-12 md:py-16">
        <div className="container mx-auto max-w-2xl text-center">
          <h2 className="font-display text-foreground text-xl font-bold">
            Need to pull data into your own tools?
          </h2>
          <p className="text-muted-foreground mt-2 text-sm">
            Use the ClientFlow REST API to read clients, projects, tasks, and invoices from your own
            scripts and workflows. First-party Slack, Teams, and Zapier integrations are on the
            roadmap.
          </p>
          <div className="mt-5 flex justify-center gap-3">
            <Button size="sm" asChild>
              <Link href="/api-docs">
                API Documentation <ArrowRight size={14} className="ml-1" />
              </Link>
            </Button>
            <Button size="sm" variant="outline" asChild>
              <Link href="/contact">Request an Integration</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
};

export default IntegrationsPage;
