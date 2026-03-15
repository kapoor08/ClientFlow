"use client";
import Link from "next/link";
import { useMotionStagger } from "@/hooks/use-home-motion";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { CheckCircle2, Shield } from "lucide-react";
import { certifications, practices } from "@/config/security";

const SecurityPage = () => {
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
            <div className="mb-4 inline-flex items-center gap-2 rounded-pill border border-border bg-card px-4 py-1.5 text-xs font-medium text-muted-foreground shadow-cf-1">
              <Shield size={14} className="text-primary" />
              Enterprise-grade security
            </div>
            <h1 className="font-display text-3xl font-bold tracking-tight text-foreground md:text-4xl lg:text-5xl">
              Your data is our{" "}
              <span className="text-primary text-glow">top priority</span>
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground">
              ClientFlow is built with security-first architecture. We protect
              your agency&apos; data with industry-leading practices and
              certifications.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-12 md:py-16">
        <div className="container">
          <h2 className="font-display text-xl font-bold text-foreground text-center">
            Certifications & Compliance
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Independent verification of our security commitments.
          </p>
          <motion.div
            variants={motionStagger.container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            {certifications.map((c) => (
              <motion.div
                key={c.label}
                variants={motionStagger.item}
                className="rounded-xl border border-border bg-card p-5 text-center transition-all hover:border-primary/30 hover:shadow-cf-2"
              >
                <CheckCircle2 size={24} className="mx-auto text-primary" />
                <h3 className="mt-2.5 font-display text-sm font-semibold text-foreground">
                  {c.label}
                </h3>
                <p className="mt-1.5 text-[13px] text-muted-foreground">
                  {c.desc}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="border-t border-border bg-card py-12 md:py-16">
        <div className="container">
          <h2 className="font-display text-xl font-bold text-foreground text-center">
            Security Practices
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            How we keep your data safe every day.
          </p>
          <motion.div
            variants={motionStagger.container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {practices.map((p) => (
              <motion.div
                key={p.title}
                variants={motionStagger.item}
                className="rounded-xl border border-border bg-background p-5 transition-all hover:border-primary/30 hover:shadow-cf-2"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/8 text-primary">
                  <p.icon size={18} />
                </div>
                <h3 className="mt-3 font-display text-sm font-semibold text-foreground">
                  {p.title}
                </h3>
                <p className="mt-1.5 text-[13px] text-muted-foreground">
                  {p.desc}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="py-12 md:py-16">
        <div className="container mx-auto max-w-2xl text-center">
          <h2 className="font-display text-xl font-bold text-foreground">
            Report a Vulnerability
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            We welcome responsible security research. If you discover a
            vulnerability, please report it through our disclosure program.
          </p>
          <div className="mt-5 flex justify-center gap-3">
            <Button size="sm" asChild>
              <Link href="/legal/responsible-disclosure">
                Disclosure Program
              </Link>
            </Button>
            <Button size="sm" variant="outline" asChild>
              <Link href="/contact">Contact Security Team</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
};

export default SecurityPage;
