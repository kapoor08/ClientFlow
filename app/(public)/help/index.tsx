"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import Link from "next/link";
import { useMotionStagger } from "@/hooks/use-home-motion";
import { categories } from "@/config/help";

const HelpPage = () => {
  const motionStagger = useMotionStagger({
    step: 0.05,
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
            <h1 className="font-display text-3xl font-bold tracking-tight text-foreground md:text-4xl lg:text-5xl">
              Help Center
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground">
              Find answers, guides, and resources to get the most out of
              ClientFlow.
            </p>
            <div className="mx-auto mt-6 max-w-md">
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  placeholder="Search help articles..."
                  className="pl-9 bg-card shadow-cf-1"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-12 md:py-16">
        <div className="container">
          <motion.div
            variants={motionStagger.container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="mx-auto grid max-w-4xl gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {categories.map((c) => (
              <motion.div
                key={c.title}
                variants={motionStagger.item}
                className="cursor-pointer rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/30 hover:shadow-cf-2"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/8 text-primary">
                  <c.icon size={18} />
                </div>
                <h3 className="mt-3 font-display text-sm font-semibold text-foreground">
                  {c.title}
                </h3>
                <p className="mt-1.5 text-[13px] text-muted-foreground">
                  {c.desc}
                </p>
                <p className="mt-2 text-[11px] font-semibold text-primary">
                  {c.count} articles
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="border-t border-border bg-card py-12">
        <div className="container mx-auto max-w-2xl text-center">
          <h2 className="font-display text-lg font-bold text-foreground">
            Can&apos;t find what you&apos;re looking for?
          </h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Our support team is here to help.
          </p>
          <div className="mt-5 flex justify-center gap-3">
            <Button size="sm" asChild>
              <Link href="/contact">Contact Support</Link>
            </Button>
            <Button size="sm" variant="outline" asChild>
              <Link href="/docs">Browse Documentation</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
};

export default HelpPage;
