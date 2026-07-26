"use client";

import { m as Motion } from "framer-motion";
import { ALL_NAV_ITEMS } from "../data";

type HeroPlaceholderPageProps = {
  href: string;
};

export function HeroPlaceholderPage({ href }: HeroPlaceholderPageProps) {
  const navItem = ALL_NAV_ITEMS.find((n) => n.href === href);
  const Icon = navItem?.icon;
  const label = navItem?.label ?? "Page";

  return (
    <div className="flex-1 overflow-hidden p-4">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div>
          <div className="text-foreground text-[13px] font-bold">{label}</div>
          <div className="text-muted-foreground text-[10px]">Manage your {label.toLowerCase()}</div>
        </div>
      </div>

      {/* Placeholder content */}
      <Motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="border-border bg-card rounded-lg border p-6"
      >
        <div className="flex flex-col items-center justify-center gap-2 py-4">
          {Icon && (
            <Motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.3 }}
            >
              <Icon size={20} className="text-muted-foreground/30" />
            </Motion.div>
          )}
          <div className="text-muted-foreground text-[11px] font-medium">{label}</div>
          <div className="text-muted-foreground/60 text-[9px]">Content loads here</div>
        </div>

        {/* Skeleton rows */}
        <div className="mt-3 space-y-2">
          {[0.8, 0.65, 0.9, 0.5].map((w, i) => (
            <Motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 + i * 0.06 }}
              className="flex items-center gap-2"
            >
              <div className="bg-secondary h-3 w-3 rounded" />
              <div className="bg-secondary h-2 rounded-full" style={{ width: `${w * 100}%` }} />
            </Motion.div>
          ))}
        </div>
      </Motion.div>
    </div>
  );
}
