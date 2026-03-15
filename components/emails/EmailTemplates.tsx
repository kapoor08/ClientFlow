"use client";

import { categories } from "@/data/emailTemplates";
import { CategorySection } from "./CategorySection";
import { Mail, Search } from "lucide-react";
import * as Icons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useState, useMemo } from "react";
import { motion } from "framer-motion";

const totalTemplates = categories.reduce(
  (acc, c) => acc + c.templates.length,
  0,
);

export default function EmailTemplates() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    let cats = activeCategory
      ? categories.filter((c) => c.id === activeCategory)
      : categories;

    if (search.trim()) {
      const q = search.toLowerCase();
      cats = cats
        .map((c) => ({
          ...c,
          templates: c.templates.filter(
            (t) =>
              t.slug.toLowerCase().includes(q) ||
              t.subject.toLowerCase().includes(q) ||
              t.trigger.toLowerCase().includes(q) ||
              t.module.toLowerCase().includes(q),
          ),
        }))
        .filter((c) => c.templates.length > 0);
    }
    return cats;
  }, [activeCategory, search]);

  const filteredCount = filtered.reduce(
    (acc, c) => acc + c.templates.length,
    0,
  );

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="sticky top-0 hidden h-screen w-65 shrink-0 border-r border-border bg-card lg:flex lg:flex-col">
        <div className="flex items-center gap-2.5 border-b border-border px-5 py-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Mail className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display text-sm font-bold text-foreground">
              Email Templates
            </h1>
            <p className="text-[11px] text-muted-foreground">
              {totalTemplates} templates
            </p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <button
            onClick={() => setActiveCategory(null)}
            className={`mb-1 flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] font-medium transition-colors ${
              !activeCategory
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <Icons.LayoutGrid className="h-4 w-4" />
            All Categories
            <span className="ml-auto text-[11px] opacity-60">
              {totalTemplates}
            </span>
          </button>

          <div className="my-3 h-px bg-border" />

          {categories.map((c) => {
            const Icon =
              (Icons as unknown as Record<string, LucideIcon>)[c.icon] ||
              Icons.Mail;
            const isActive = activeCategory === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setActiveCategory(isActive ? null : c.id)}
                className={`mb-0.5 flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] font-medium transition-colors ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{c.label}</span>
                <span className="ml-auto text-[11px] opacity-60">
                  {c.templates.length}
                </span>
              </button>
            );
          })}
        </nav>

        <div className="border-t border-border px-4 py-3">
          <p className="text-[10px] text-muted-foreground text-center">
            ClientFlow v1.5
          </p>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 border-b border-border bg-card/90 backdrop-blur-md">
          <div className="flex items-center gap-4 px-6 py-3 lg:px-8">
            {/* Mobile title */}
            <div className="flex items-center gap-2 lg:hidden">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
                <Mail className="h-3.5 w-3.5 text-primary-foreground" />
              </div>
              <span className="font-display text-sm font-bold text-foreground">
                Templates
              </span>
            </div>

            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search templates by name, slug, or trigger..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>

            <div className="hidden text-xs text-muted-foreground sm:block">
              {filteredCount} {filteredCount === 1 ? "template" : "templates"}
            </div>
          </div>

          {/* Mobile category pills */}
          <div className="flex gap-1.5 overflow-x-auto px-6 pb-3 lg:hidden">
            <button
              onClick={() => setActiveCategory(null)}
              className={`shrink-0 rounded-full border px-3 py-1 text-[11px] font-medium transition-colors ${
                !activeCategory
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground"
              }`}
            >
              All
            </button>
            {categories.map((c) => {
              const isActive = activeCategory === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setActiveCategory(isActive ? null : c.id)}
                  className={`shrink-0 rounded-full border px-3 py-1 text-[11px] font-medium transition-colors ${
                    isActive
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground"
                  }`}
                >
                  {c.label}
                </button>
              );
            })}
          </div>
        </header>

        <div className="px-6 py-8 lg:px-8">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted mb-4">
                <Search className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="font-display text-sm font-semibold text-foreground">
                No templates found
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Try a different search term or category
              </p>
            </div>
          ) : (
            <motion.div
              className="space-y-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              {filtered.map((category) => (
                <CategorySection key={category.id} category={category} />
              ))}
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}


