"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Newspaper, Download, ArrowRight } from "lucide-react";
import { pressReleases } from "@/config/press";

const PressPage = () => (
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
          <h1 className="font-display text-foreground text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
            Press & Media
          </h1>
          <p className="text-muted-foreground mx-auto mt-4 max-w-xl text-base">
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
        <h2 className="font-display text-foreground text-lg font-bold">Press Releases</h2>
        <div className="mt-5 space-y-3">
          {pressReleases.map((pr) => (
            <motion.article
              key={pr.title}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="border-border bg-card hover:border-primary/30 rounded-xl border p-5 transition-all"
            >
              <time className="text-muted-foreground text-[11px] font-medium">{pr.date}</time>
              <h3 className="font-display text-foreground mt-1.5 text-sm font-semibold">
                {pr.title}
              </h3>
              <p className="text-muted-foreground mt-1.5 text-[13px]">{pr.excerpt}</p>
              <Button variant="link" className="text-primary mt-2 h-auto p-0 text-[13px]" asChild>
                <Link href="/contact">
                  Read More <ArrowRight size={13} className="ml-1" />
                </Link>
              </Button>
            </motion.article>
          ))}
        </div>
      </div>
    </section>

    <section className="border-border bg-card border-t py-12">
      <div className="container mx-auto max-w-2xl text-center">
        <Newspaper size={28} className="text-muted-foreground mx-auto" />
        <h2 className="font-display text-foreground mt-3 text-lg font-bold">Media Inquiries</h2>
        <p className="text-muted-foreground mt-1.5 text-sm">
          For press inquiries, interviews, or media partnerships, reach out to our communications
          team.
        </p>
        <p className="text-primary mt-2 text-[13px] font-semibold">press@clientflow.io</p>
      </div>
    </section>
  </>
);

export default PressPage;
