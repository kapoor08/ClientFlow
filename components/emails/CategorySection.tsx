"use client";

import type { EmailCategory } from "@/data/emailTemplates";
import { EmailTemplateCard } from "./EmailTemplateCard";
import * as Icons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { m as Motion } from "framer-motion";

export function CategorySection({ category }: { category: EmailCategory }) {
  const IconComponent =
    (Icons as unknown as Record<string, LucideIcon>)[category.icon] || Icons.Mail;

  return (
    <Motion.section
      id={category.id}
      className="scroll-mt-24"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
    >
      <div className="mb-5 flex items-center gap-3">
        <div className="bg-primary/10 ring-primary/10 flex h-10 w-10 items-center justify-center rounded-xl ring-1">
          <IconComponent className="text-primary h-5 w-5" />
        </div>
        <div className="flex-1">
          <h2 className="font-display text-foreground text-base font-semibold">{category.label}</h2>
          <p className="text-muted-foreground text-xs">{category.description}</p>
        </div>
        <div className="bg-primary/10 text-primary flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold">
          {category.templates.length}
        </div>
      </div>
      <div className="space-y-2.5">
        {category.templates.map((t, i) => (
          <Motion.div
            key={t.slug}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: i * 0.03 }}
          >
            <EmailTemplateCard template={t} />
          </Motion.div>
        ))}
      </div>
    </Motion.section>
  );
}
