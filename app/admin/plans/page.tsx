import { db } from "@/lib/db";
import { plans, planFeatureLimits, planFeatureFlags } from "@/db/schema";
import { eq } from "drizzle-orm";
import { PLAN_LIMITS } from "@/config/plan-limits";
import { PageHeader } from "@/components/ui/page-header";

async function getPlansWithLimits() {
  const allPlans = await db.select().from(plans).orderBy(plans.code);
  const allLimits = await db.select().from(planFeatureLimits);
  const allFlags = await db.select().from(planFeatureFlags);

  return allPlans.map((plan) => ({
    ...plan,
    limits: allLimits.filter((l) => l.planId === plan.id),
    flags: allFlags.filter((f) => f.planId === plan.id),
    configLimits: PLAN_LIMITS[plan.code as keyof typeof PLAN_LIMITS] ?? null,
  }));
}

const LIMIT_LABELS: Record<string, string> = {
  team_members: "Team members",
  projects: "Projects",
  clients: "Clients",
  tasks_per_month: "Tasks / month",
  comments_per_month: "Comments / month",
  file_uploads_per_month: "File uploads / month",
};

export default async function AdminPlansPage() {
  const plansData = await getPlansWithLimits();

  return (
    <div>
      <PageHeader
        title="Plans & Limits"
        description="Feature limits per plan from the database and config"
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {plansData.map((plan) => (
          <div key={plan.id} className="rounded-xl border border-border bg-card p-5 shadow-cf-1">
            <div className="mb-4">
              <h2 className="font-display font-bold text-foreground capitalize">{plan.name}</h2>
              <p className="text-xs font-mono text-muted-foreground">{plan.code}</p>
              <div className="mt-1.5 flex gap-2 text-xs text-muted-foreground">
                {plan.monthlyPriceCents != null && (
                  <span>${(plan.monthlyPriceCents / 100).toFixed(0)}/mo</span>
                )}
                {plan.yearlyPriceCents != null && (
                  <span>${(plan.yearlyPriceCents / 100).toFixed(0)}/yr</span>
                )}
              </div>
            </div>

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
    </div>
  );
}
