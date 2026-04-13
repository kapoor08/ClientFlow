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
          <h1 className="font-display text-2xl font-bold text-foreground">Plans &amp; Limits</h1>
          <p className="mt-1 text-sm text-muted-foreground">
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
            className={`rounded-xl border bg-card p-5 shadow-cf-1 ${
              plan.isActive ? "border-border" : "border-border/50 opacity-60"
            }`}
          >
            <div className="mb-4 flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="font-display font-bold text-foreground capitalize">{plan.name}</h2>
                  {plan.recommendedBadge && (
                    <StatusBadge
                      status={plan.recommendedBadge}
                      colorMap={BADGE_COLORS}
                    />
                  )}
                  {!plan.isActive && (
                    <span className="rounded-full bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground">
                      inactive
                    </span>
                  )}
                </div>
                <p className="text-xs font-mono text-muted-foreground">{plan.code}</p>
                <div className="mt-1.5 flex gap-2 text-xs text-muted-foreground">
                  {plan.monthlyPriceCents != null && (
                    <span>${(plan.monthlyPriceCents / 100).toFixed(0)}/mo</span>
                  )}
                  {plan.yearlyPriceCents != null && (
                    <span>${(plan.yearlyPriceCents / 100).toFixed(0)}/yr</span>
                  )}
                </div>
                {plan.description && (
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{plan.description}</p>
                )}
              </div>
              <PlanActions plan={plan} />
            </div>

            {plan.trialDays != null && (
              <p className="mb-3 text-xs text-muted-foreground">
                {plan.trialDays}-day trial
              </p>
            )}

            <div className="space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                DB Limits
              </p>
              {plan.limits.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">No rows in plan_feature_limits</p>
              ) : (
                plan.limits.map((lim) => (
                  <div key={lim.id} className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {LIMIT_LABELS[lim.featureKey] ?? lim.featureKey}
                    </span>
                    <span className="text-xs font-medium text-foreground">
                      {lim.limitValue ?? "∞"}
                    </span>
                  </div>
                ))
              )}
            </div>

            {plan.configLimits && (
              <div className="mt-4 space-y-2 border-t border-border pt-4">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Config Limits
                </p>
                {Object.entries(plan.configLimits).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground capitalize">
                      {key.replace(/([A-Z])/g, " $1").toLowerCase()}
                    </span>
                    <span className="text-xs font-medium text-foreground">{value ?? "∞"}</span>
                  </div>
                ))}
              </div>
            )}

            {plan.flags.length > 0 && (
              <div className="mt-4 space-y-2 border-t border-border pt-4">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Feature Flags
                </p>
                {plan.flags.map((flag) => (
                  <div key={flag.id} className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{flag.featureKey}</span>
                    <span
                      className={`text-xs font-medium ${flag.isEnabled ? "text-success" : "text-muted-foreground"}`}
                    >
                      {flag.isEnabled ? "On" : "Off"}
                    </span>
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
