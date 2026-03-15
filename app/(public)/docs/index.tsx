import { Button } from "@/components/ui/button";
import { sections } from "@/config/docs";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

const DocsPage = () => (
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
            Documentation
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground">
            Everything you need to build, integrate, and scale with ClientFlow.
          </p>
        </motion.div>
      </div>
    </section>

    <section className="py-12 md:py-16">
      <div className="container mx-auto max-w-4xl">
        <div className="space-y-3">
          {sections.map((s) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex items-start gap-4 rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/30 hover:shadow-cf-2"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/8 text-primary">
                <s.icon size={18} />
              </div>
              <div className="flex-1">
                <h3 className="font-display text-sm font-semibold text-foreground">
                  {s.title}
                </h3>
                <p className="mt-1 text-[13px] text-muted-foreground">
                  {s.desc}
                </p>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href={s.link}>
                  <ArrowRight size={14} />
                </Link>
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  </>
);

export default DocsPage;
