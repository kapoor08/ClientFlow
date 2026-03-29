import { motion, type Variants } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

// ─── Skeleton ─────────────────────────────────────────────────────────────────

export function KpiSkeleton() {
  return (
    <div className="rounded-card border border-border bg-card p-5 shadow-cf-1">
      <div className="flex items-center justify-between mb-3">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-4 w-4" />
      </div>
      <Skeleton className="h-7 w-16 mb-2" />
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
    <motion.div
      variants={motionItem}
      className="rounded-card border border-border bg-card p-5 shadow-cf-1"
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <Icon size={18} className="text-muted-foreground" />
      </div>
      <div className="mt-2 font-display text-2xl font-bold text-foreground">
        {value}
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
    </motion.div>
  );
}
