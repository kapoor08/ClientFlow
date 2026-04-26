"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { PlanFormDialog, PlanActions } from "@/components/admin/plans";
import type { getAdminPlansWithLimits } from "@/server/admin/plans";

type PlanWithLimits = Awaited<ReturnType<typeof getAdminPlansWithLimits>>[number];

const LIMIT_LABELS: Record<string, string> = {
  team_members: "Team members",
  projects: "Projects",
  clients: "Clients",
  tasks_per_month: "Tasks / month",
  comments_per_month: "Comments / month",
  file_uploads_per_month: "File uploads / month",
};

const BADGE_COLORS: Record<string, string> = {
  popular: "bg-brand-100 text-primary",
  enterprise: "bg-success/10 text-success",
};

type Props = { plansData: PlanWithLimits[] };

export default function AdminPlansPage({ plansData }: Props) {
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-foreground text-2xl font-bold">Plans &amp; Limits</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage plans, pricing, and feature limits.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-1.5">
          <Plus size={14} />
          New plan
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {plansData.map((plan) => (
          <div
            key={plan.id}
            className={`bg-card shadow-cf-1 rounded-xl border p-5 ${
              plan.isActive ? "border-border" : "border-border/50 opacity-60"
            }`}
          >
            <div className="mb-4 flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="font-display text-foreground font-bold capitalize">{plan.name}</h2>
                  {plan.recommendedBadge && (
                    <StatusBadge status={plan.recommendedBadge} colorMap={BADGE_COLORS} />
                  )}
                  {!plan.isActive && (
                    <span className="bg-secondary text-muted-foreground rounded-full px-1.5 py-0.5 text-[10px]">
                      inactive
                    </span>
                  )}
                </div>
                <p className="text-muted-foreground font-mono text-xs">{plan.code}</p>
                <div className="text-muted-foreground mt-1.5 flex gap-2 text-xs">
                  {plan.monthlyPriceCents != null && (
                    <span>${(plan.monthlyPriceCents / 100).toFixed(0)}/mo</span>
                  )}
                  {plan.yearlyPriceCents != null && (
                    <span>${(plan.yearlyPriceCents / 100).toFixed(0)}/yr</span>
                  )}
                </div>
                {plan.description && (
                  <p className="text-muted-foreground mt-1 line-clamp-2 text-xs">
                    {plan.description}
                  </p>
                )}
              </div>
              <PlanActions plan={plan} />
            </div>

            {plan.trialDays != null && (
              <p className="text-muted-foreground mb-3 text-xs">{plan.trialDays}-day trial</p>
            )}

            <div className="space-y-2">
              <p className="text-muted-foreground text-[10px] font-semibold tracking-wide uppercase">
                DB Limits
              </p>
              {plan.limits.length === 0 ? (
                <p className="text-muted-foreground text-xs italic">
                  No rows in plan_feature_limits
                </p>
              ) : (
                plan.limits.map((lim) => (
                  <div key={lim.id} className="flex items-center justify-between">
                    <span className="text-muted-foreground text-xs">
                      {LIMIT_LABELS[lim.featureKey] ?? lim.featureKey}
                    </span>
                    <span className="text-foreground text-xs font-medium">
                      {lim.limitValue ?? "∞"}
                    </span>
                  </div>
                ))
              )}
            </div>

            {plan.configLimits && (
              <div className="border-border mt-4 space-y-2 border-t pt-4">
                <p className="text-muted-foreground text-[10px] font-semibold tracking-wide uppercase">
                  Config Limits
                </p>
                {Object.entries(plan.configLimits).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-muted-foreground text-xs capitalize">
                      {key.replace(/([A-Z])/g, " $1").toLowerCase()}
                    </span>
                    <span className="text-foreground text-xs font-medium">{value ?? "∞"}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <PlanFormDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
