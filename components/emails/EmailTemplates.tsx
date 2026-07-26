"use client";

import { categories } from "@/data/emailTemplates";
import { CategorySection } from "./CategorySection";
import { Mail, Search } from "lucide-react";
import * as Icons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useState, useMemo } from "react";
import { m as Motion } from "framer-motion";

const totalTemplates = categories.reduce((acc, c) => acc + c.templates.length, 0);

export default function EmailTemplates() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    let cats = activeCategory ? categories.filter((c) => c.id === activeCategory) : categories;

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

  const filteredCount = filtered.reduce((acc, c) => acc + c.templates.length, 0);

  return (
    <div className="bg-background flex min-h-screen">
      {/* Sidebar */}
      <aside className="border-border bg-card sticky top-0 hidden h-screen w-65 shrink-0 border-r lg:flex lg:flex-col">
        <div className="border-border flex items-center gap-2.5 border-b px-5 py-5">
          <div className="bg-primary flex h-8 w-8 items-center justify-center rounded-lg">
            <Mail className="text-primary-foreground h-4 w-4" />
          </div>
          <div>
            <h1 className="font-display text-foreground text-sm font-bold">Email Templates</h1>
            <p className="text-muted-foreground text-[11px]">{totalTemplates} templates</p>
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
            <span className="ml-auto text-[11px] opacity-60">{totalTemplates}</span>
          </button>

          <div className="bg-border my-3 h-px" />

          {categories.map((c) => {
            const Icon = (Icons as unknown as Record<string, LucideIcon>)[c.icon] || Icons.Mail;
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
                <span className="ml-auto text-[11px] opacity-60">{c.templates.length}</span>
              </button>
            );
          })}
        </nav>

        <div className="border-border border-t px-4 py-3">
          <p className="text-muted-foreground text-center text-[10px]">ClientFlow v1.5</p>
        </div>
      </aside>

      {/* Main content */}
      <main className="min-w-0 flex-1">
        {/* Top bar */}
        <header className="border-border bg-card/90 sticky top-0 z-30 border-b backdrop-blur-md">
          <div className="flex items-center gap-4 px-6 py-3 lg:px-8">
            {/* Mobile title */}
            <div className="flex items-center gap-2 lg:hidden">
              <div className="bg-primary flex h-7 w-7 items-center justify-center rounded-md">
                <Mail className="text-primary-foreground h-3.5 w-3.5" />
              </div>
              <span className="font-display text-foreground text-sm font-bold">Templates</span>
            </div>

            {/* Search */}
            <div className="relative max-w-md flex-1">
              <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search templates by name, slug, or trigger..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border-border bg-background text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:ring-primary/20 h-9 w-full rounded-lg border pr-3 pl-9 text-sm transition-all focus:ring-2 focus:outline-none"
              />
            </div>

            <div className="text-muted-foreground hidden text-xs sm:block">
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
              <div className="bg-muted mb-4 flex h-14 w-14 items-center justify-center rounded-2xl">
                <Search className="text-muted-foreground h-6 w-6" />
              </div>
              <p className="font-display text-foreground text-sm font-semibold">
                No templates found
              </p>
              <p className="text-muted-foreground mt-1 text-sm">
                Try a different search term or category
              </p>
            </div>
          ) : (
            <Motion.div
              className="space-y-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              {filtered.map((category) => (
                <CategorySection key={category.id} category={category} />
              ))}
            </Motion.div>
          )}
        </div>
      </main>
    </div>
  );
}
