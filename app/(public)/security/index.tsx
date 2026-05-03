"use client";
import Link from "next/link";
import { useMotionStagger } from "@/hooks/use-home-motion";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Shield } from "lucide-react";
import { dataHandling, practices } from "@/config/security";

const SecurityPage = () => {
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
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mx-auto max-w-3xl text-center"
          >
            <div className="rounded-pill border-border bg-card text-muted-foreground shadow-cf-1 mb-4 inline-flex items-center gap-2 border px-4 py-1.5 text-xs font-medium">
              <Shield size={14} className="text-primary" />
              Security at ClientFlow
            </div>
            <h1 className="font-display text-foreground text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
              Built with <span className="text-primary text-glow">security in mind</span>
            </h1>
            <p className="text-muted-foreground mx-auto mt-4 max-w-xl text-base">
              ClientFlow is engineered with strict tenant isolation, audited access controls, and
              modern transport security. Below is the honest list of what ships today.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-12 md:py-16">
        <div className="container">
          <h2 className="font-display text-foreground text-center text-xl font-bold">
            Security Practices
          </h2>
          <p className="text-muted-foreground mt-2 text-center text-sm">
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
                className="border-border bg-card hover:border-primary/30 hover:shadow-cf-2 rounded-xl border p-5 transition-all"
              >
                <div className="bg-primary/8 text-primary flex h-9 w-9 items-center justify-center rounded-lg">
                  <p.icon size={18} />
                </div>
                <h3 className="font-display text-foreground mt-3 text-sm font-semibold">
                  {p.title}
                </h3>
                <p className="text-muted-foreground mt-1.5 text-[13px]">{p.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="border-border bg-card border-t py-12 md:py-16">
        <div className="container mx-auto max-w-4xl">
          <h2 className="font-display text-foreground text-center text-xl font-bold">
            Data Handling
          </h2>
          <p className="text-muted-foreground mt-2 text-center text-sm">
            Where your data lives, who touches it, and how you stay in control.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {dataHandling.map((d) => (
              <div key={d.label} className="border-border bg-background rounded-xl border p-5">
                <h3 className="font-display text-foreground text-sm font-semibold">{d.label}</h3>
                <p className="text-muted-foreground mt-1.5 text-[13px]">{d.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 md:py-16">
        <div className="container mx-auto max-w-2xl text-center">
          <h2 className="font-display text-foreground text-xl font-bold">Report a Vulnerability</h2>
          <p className="text-muted-foreground mt-2 text-sm">
            We welcome responsible security research. If you discover a vulnerability, please report
            it through our disclosure program.
          </p>
          <div className="mt-5 flex justify-center gap-3">
            <Button size="sm" asChild>
              <Link href="/legal/responsible-disclosure">Disclosure Program</Link>
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
