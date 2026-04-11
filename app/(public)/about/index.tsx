"use client";
import { motion } from "framer-motion";
import { useMotionStagger } from "@/hooks/use-home-motion";
import { stats, values } from "@/config/about";

const AboutPage = () => {
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
            <h1 className="font-display text-3xl font-bold tracking-tight text-foreground md:text-4xl lg:text-5xl">
              Built by agency people,{" "}
              <span className="text-primary text-glow">for agencies</span>
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground">
              We started ClientFlow because we were tired of stitching together
              project management, billing, and client communication across five
              different tools. There had to be a better way.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="border-b border-border bg-card py-8">
        <div className="container">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <div className="font-display text-2xl font-bold text-primary md:text-3xl">
                  {s.value}
                </div>
                <div className="mt-0.5 text-[13px] text-muted-foreground">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 md:py-16">
        <div className="container">
          <div className="mx-auto max-w-3xl">
            <h2 className="font-display text-xl font-bold text-foreground">
              Our Story
            </h2>
            <div className="mt-4 space-y-3 text-[13px] leading-relaxed text-muted-foreground md:text-sm">
              <p>
                ClientFlow was founded in 2024 by a team of agency operators and
                engineers who experienced firsthand the chaos of managing client
                relationships, project delivery, and billing across disconnected
                tools.
              </p>
              <p>
                We set out to build the platform we wished we had - one that
                unifies client management, project tracking, task workflows, and
                invoicing into a single, thoughtfully designed system.
              </p>
              <p>
                Today, ClientFlow serves over 2,000 agencies worldwide, from
                boutique design studios to large-scale digital consultancies.
                Our multi-tenant architecture ensures that every team gets
                enterprise-grade security and performance, regardless of size.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-card py-12 md:py-16">
        <div className="container">
          <h2 className="font-display text-xl font-bold text-foreground text-center">
            Our Values
          </h2>
          <motion.div
            variants={motionStagger.container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            {values.map((v) => (
              <motion.div
                key={v.title}
                variants={motionStagger.item}
                className="rounded-xl border border-border bg-background p-5 transition-all hover:border-primary/30 hover:shadow-cf-2"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/8 text-primary">
                  <v.icon size={18} />
                </div>
                <h3 className="mt-3 font-display text-sm font-semibold text-foreground">
                  {v.title}
                </h3>
                <p className="mt-1.5 text-[13px] text-muted-foreground">
                  {v.desc}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    </>
  );
};

export default AboutPage;
