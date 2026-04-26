"use client";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { Search, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useMotionStagger } from "@/hooks/use-home-motion";
import { KB_ARTICLES, KB_CATEGORY_META, type KbCategory } from "@/config/kb-articles";

const HelpPage = () => {
  const motionStagger = useMotionStagger({
    step: 0.05,
    initialY: 10,
    duration: 0.3,
  });

  const [query, setQuery] = useState("");

  // Group articles by category for the section view.
  const grouped = useMemo(() => {
    const map = new Map<KbCategory, typeof KB_ARTICLES>();
    for (const article of KB_ARTICLES) {
      const list = map.get(article.category) ?? [];
      list.push(article);
      map.set(article.category, list);
    }
    return map;
  }, []);

  // Lightweight client-side search across title + excerpt. Good enough for
  // the current article count; a proper full-text search lands when the KB
  // grows past ~50 articles.
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    return KB_ARTICLES.filter(
      (a) => a.title.toLowerCase().includes(q) || a.excerpt.toLowerCase().includes(q),
    );
  }, [query]);

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
            <h1 className="font-display text-foreground text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
              Help Center
            </h1>
            <p className="text-muted-foreground mx-auto mt-4 max-w-xl text-base">
              Find answers, guides, and resources to get the most out of ClientFlow.
            </p>
            <div className="mx-auto mt-6 max-w-md">
              <div className="relative">
                <Search
                  size={16}
                  className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2"
                />
                <Input
                  placeholder="Search help articles..."
                  className="bg-card shadow-cf-1 pl-9"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-12 md:py-16">
        <div className="container mx-auto max-w-4xl">
          {matches ? (
            // ── Search results view ──────────────────────────────────────
            <div>
              <p className="text-muted-foreground mb-4 text-xs font-semibold tracking-widest uppercase">
                {matches.length} {matches.length === 1 ? "result" : "results"} for &quot;{query}
                &quot;
              </p>
              {matches.length === 0 ? (
                <div className="border-border bg-card rounded-xl border p-8 text-center">
                  <p className="text-foreground text-sm">No matching articles.</p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    Try a different keyword, or{" "}
                    <Link href="/contact" className="text-primary hover:underline">
                      contact support
                    </Link>
                    .
                  </p>
                </div>
              ) : (
                <ul className="divide-border border-border bg-card divide-y rounded-xl border">
                  {matches.map((a) => (
                    <li key={a.slug}>
                      <Link
                        href={`/help/${a.slug}`}
                        className="hover:bg-secondary/40 flex items-start justify-between gap-4 px-4 py-3 transition-colors"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-foreground text-sm font-medium">{a.title}</p>
                          <p className="text-muted-foreground mt-1 text-xs">{a.excerpt}</p>
                        </div>
                        <ChevronRight size={16} className="text-muted-foreground mt-1 shrink-0" />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            // ── Browse-by-category view ─────────────────────────────────
            <motion.div
              variants={motionStagger.container}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              className="space-y-10"
            >
              {(Object.keys(KB_CATEGORY_META) as KbCategory[]).map((category) => {
                const articles = grouped.get(category) ?? [];
                const meta = KB_CATEGORY_META[category];
                if (articles.length === 0) return null;

                return (
                  <motion.div key={category} variants={motionStagger.item}>
                    <div className="mb-3">
                      <h2 className="font-display text-foreground text-base font-semibold">
                        {meta.title}
                      </h2>
                      <p className="text-muted-foreground text-xs">{meta.description}</p>
                    </div>
                    <ul className="divide-border border-border bg-card divide-y rounded-xl border">
                      {articles.map((a) => (
                        <li key={a.slug}>
                          <Link
                            href={`/help/${a.slug}`}
                            className="hover:bg-secondary/40 flex items-start justify-between gap-4 px-4 py-3 transition-colors"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="text-foreground text-sm font-medium">{a.title}</p>
                              <p className="text-muted-foreground mt-1 text-xs">{a.excerpt}</p>
                            </div>
                            <ChevronRight
                              size={16}
                              className="text-muted-foreground mt-1 shrink-0"
                            />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </div>
      </section>

      <section className="border-border bg-card border-t py-12">
        <div className="container mx-auto max-w-2xl text-center">
          <h2 className="font-display text-foreground text-lg font-bold">
            Can&apos;t find what you&apos;re looking for?
          </h2>
          <p className="text-muted-foreground mt-1.5 text-sm">Our support team is here to help.</p>
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
