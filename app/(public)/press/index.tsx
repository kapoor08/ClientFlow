import Link from "next/link";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Newspaper, Download, ArrowRight } from "lucide-react";
import { pressReleases } from "@/config/press";

const PressPage = () => (
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
            Press & Media
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground">
            News, press releases, and media resources from ClientFlow.
          </p>
          <div className="mt-5">
            <Button variant="outline" size="sm" asChild>
              <Link href="/contact">
                <Download size={14} className="mr-2" /> Download Press Kit
              </Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>

    <section className="py-12 md:py-16">
      <div className="container mx-auto max-w-3xl">
        <h2 className="font-display text-lg font-bold text-foreground">
          Press Releases
        </h2>
        <div className="mt-5 space-y-3">
          {pressReleases.map((pr) => (
            <motion.article
              key={pr.title}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/30"
            >
              <time className="text-[11px] font-medium text-muted-foreground">
                {pr.date}
              </time>
              <h3 className="mt-1.5 font-display text-sm font-semibold text-foreground">
                {pr.title}
              </h3>
              <p className="mt-1.5 text-[13px] text-muted-foreground">
                {pr.excerpt}
              </p>
              <Button
                variant="link"
                className="mt-2 h-auto p-0 text-[13px] text-primary"
                asChild
              >
                <Link href="/contact">
                  Read More <ArrowRight size={13} className="ml-1" />
                </Link>
              </Button>
            </motion.article>
          ))}
        </div>
      </div>
    </section>

    <section className="border-t border-border bg-card py-12">
      <div className="container mx-auto max-w-2xl text-center">
        <Newspaper size={28} className="mx-auto text-muted-foreground" />
        <h2 className="mt-3 font-display text-lg font-bold text-foreground">
          Media Inquiries
        </h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          For press inquiries, interviews, or media partnerships, reach out to
          our communications team.
        </p>
        <p className="mt-2 text-[13px] font-semibold text-primary">
          press@clientflow.io
        </p>
      </div>
    </section>
  </>
);

export default PressPage;
