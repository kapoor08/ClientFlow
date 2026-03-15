"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Handshake, ArrowRight } from "lucide-react";
import { useMotionStagger } from "@/hooks/use-home-motion";
import { tiers } from "@/config/partners";

const PartnersPage = () => {
  const motionStagger = useMotionStagger({
    step: 0.06,
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
              <Handshake size={14} className="text-primary" />
              Partner Program
            </div>
            <h1 className="font-display text-3xl font-bold tracking-tight text-foreground md:text-4xl lg:text-5xl">
              Grow with{" "}
              <span className="text-primary text-glow">ClientFlow</span>
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground">
              Join our partner ecosystem and earn recurring revenue while
              helping agencies succeed.
            </p>
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
            className="grid gap-4 md:grid-cols-3"
          >
            {tiers.map((t) => (
              <motion.div
                key={t.title}
                variants={motionStagger.item}
                className="flex flex-col rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/30 hover:shadow-cf-2"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/8 text-primary">
                  <t.icon size={18} />
                </div>
                <h3 className="mt-3 font-display text-sm font-semibold text-foreground">
                  {t.title}
                </h3>
                <p className="mt-1.5 text-[13px] text-muted-foreground">
                  {t.desc}
                </p>
                <ul className="mt-4 flex-1 space-y-1.5">
                  {t.benefits.map((b) => (
                    <li
                      key={b}
                      className="flex items-center gap-2 text-[13px] text-foreground"
                    >
                      <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      {b}
                    </li>
                  ))}
                </ul>
                <Button className="mt-5" variant="outline" size="sm" asChild>
                  <Link href="/contact">
                    Apply Now <ArrowRight size={13} className="ml-1" />
                  </Link>
                </Button>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    </>
  );
};

export default PartnersPage;
