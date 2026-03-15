"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Briefcase, MapPin, ArrowRight } from "lucide-react";
import { useMotionStagger } from "@/hooks/use-home-motion";
import { openings, perks } from "@/config/careers";

const CareersPage = () => {
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
            <h1 className="font-display text-3xl font-bold tracking-tight text-foreground md:text-4xl lg:text-5xl">
              Join the{" "}
              <span className="text-primary text-glow">ClientFlow</span> team
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground">
              We&apos;re building the operating system for modern agencies. Come
              help us shape how teams work.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-12 md:py-16">
        <div className="container">
          <h2 className="font-display text-xl font-bold text-foreground">
            Open Positions
          </h2>
          <motion.div
            variants={motionStagger.container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="mt-6 space-y-2"
          >
            {openings.map((job) => (
              <motion.div
                key={job.title}
                variants={motionStagger.item}
                className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/30 hover:shadow-cf-2 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <h3 className="font-display text-sm font-semibold text-foreground">
                    {job.title}
                  </h3>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-[13px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Briefcase size={13} /> {job.team}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin size={13} /> {job.location}
                    </span>
                    <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-medium">
                      {job.type}
                    </span>
                  </div>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/contact">
                    Apply <ArrowRight size={13} className="ml-1" />
                  </Link>
                </Button>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="border-t border-border bg-card py-12 md:py-16">
        <div className="container">
          <h2 className="font-display text-xl font-bold text-foreground text-center">
            Why ClientFlow?
          </h2>
          <div className="mx-auto mt-6 grid max-w-2xl gap-2 sm:grid-cols-2">
            {perks.map((p) => (
              <div
                key={p}
                className="flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5 text-[13px] text-foreground"
              >
                <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                {p}
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

export default CareersPage;
