"use client";

import { m as Motion, type Variants } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

// ─── Skeleton ─────────────────────────────────────────────────────────────────

export function KpiSkeleton() {
  return (
    <div className="rounded-card border-border bg-card shadow-cf-1 border p-5">
      <div className="mb-3 flex items-center justify-between">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-4 w-4" />
      </div>
      <Skeleton className="mb-2 h-7 w-16" />
      <Skeleton className="h-3 w-20" />
    </div>
  );
}

// ─── KpiCard ──────────────────────────────────────────────────────────────────

type KpiCardProps = {
  label: string;
  value: string | number;
  icon: LucideIcon;
  description: string;
  motionItem: Variants;
};

export function KpiCard({ label, value, icon: Icon, description, motionItem }: KpiCardProps) {
  return (
    <Motion.div
      variants={motionItem}
      className="rounded-card border-border bg-card shadow-cf-1 border p-5"
    >
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground text-sm font-medium">{label}</span>
        <Icon size={18} className="text-muted-foreground" />
      </div>
      <div className="font-display text-foreground mt-2 text-2xl font-bold">{value}</div>
      <p className="text-muted-foreground mt-1 text-xs">{description}</p>
    </Motion.div>
  );
}
