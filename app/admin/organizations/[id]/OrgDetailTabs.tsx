"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import type { getAdminOrgDetail } from "@/lib/admin-data";

type Detail = NonNullable<Awaited<ReturnType<typeof getAdminOrgDetail>>>;

const TABS = ["Overview", "Members", "Projects", "Clients", "Subscription", "Settings"] as const;
type Tab = typeof TABS[number];

const ROLE_BADGE: Record<string, string> = {
  owner: "bg-brand-100 text-primary",
  admin: "bg-cf-accent-100 text-cf-accent-600",
  manager: "bg-info/10 text-info",
  member: "bg-secondary text-muted-foreground",
};

export function OrgDetailTabs({ detail }: { detail: Detail }) {
  const [activeTab, setActiveTab] = useState<Tab>("Overview");
  const { org, settings, members, projects, clients, subscription } = detail;

  return (
    <div>
      {/* Tab bar */}
      <div className="mb-6 flex gap-1 border-b border-border">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Overview */}
      {activeTab === "Overview" && (
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            ["Name", org.name],
            ["Slug", org.slug],
            ["Status", org.isActive ? "Active" : "Suspended"],
            ["Created", new Date(org.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })],
            ["Timezone", org.timezone ?? "-"],
            ["Currency", org.currencyCode ?? "-"],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground mb-1">{label}</p>
              <p className="text-sm font-medium text-foreground">{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Members */}
      {activeTab === "Members" && (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Member</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Role</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Joined</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{m.userName}</p>
                    <p className="text-xs text-muted-foreground">{m.userEmail}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${ROLE_BADGE[m.roleKey] ?? "bg-secondary text-muted-foreground"}`}>
                      {m.roleName}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${m.status === "active" ? "bg-success/10 text-success" : "bg-secondary text-muted-foreground"}`}>
                      {m.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {m.joinedAt ? formatDistanceToNow(new Date(m.joinedAt), { addSuffix: true }) : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Projects */}
      {activeTab === "Projects" && (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Project</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Created</th>
              </tr>
            </thead>
            <tbody>
              {projects.length === 0 ? (
                <tr><td colSpan={3} className="px-4 py-8 text-center text-sm text-muted-foreground">No projects.</td></tr>
              ) : projects.map((p) => (
                <tr key={p.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium text-foreground">{p.name}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex rounded-full bg-secondary px-2 py-0.5 text-xs capitalize text-muted-foreground">{p.status}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(p.createdAt), { addSuffix: true })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Clients */}
      {activeTab === "Clients" && (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Client</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Created</th>
              </tr>
            </thead>
            <tbody>
              {clients.length === 0 ? (
                <tr><td colSpan={3} className="px-4 py-8 text-center text-sm text-muted-foreground">No clients.</td></tr>
              ) : clients.map((c) => (
                <tr key={c.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium text-foreground">{c.name}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex rounded-full bg-secondary px-2 py-0.5 text-xs capitalize text-muted-foreground">{c.status}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Subscription */}
      {activeTab === "Subscription" && (
        <div className="grid gap-4 sm:grid-cols-2">
          {subscription ? (
            <>
              {[
                ["Plan", subscription.planName],
                ["Status", subscription.status],
                ["Billing cycle", subscription.billingCycle ?? "-"],
                ["Current period end", subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toLocaleDateString() : "-"],
                ["Stripe Customer ID", subscription.stripeCustomerId ?? "-"],
                ["Stripe Subscription ID", subscription.stripeSubscriptionId ?? "-"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl border border-border bg-card p-4">
                  <p className="text-xs text-muted-foreground mb-1">{label}</p>
                  <p className="text-sm font-medium text-foreground font-mono">{value}</p>
                </div>
              ))}
            </>
          ) : (
            <div className="col-span-2 rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
              No active subscription.
            </div>
          )}
        </div>
      )}

      {/* Settings */}
      {activeTab === "Settings" && (
        <div className="grid gap-4 sm:grid-cols-2">
          {settings ? (
            <>
              {[
                ["Email verification required", settings.requireEmailVerification ? "Yes" : "No"],
                ["Session timeout", settings.sessionTimeoutHours ? `${settings.sessionTimeoutHours}h` : "None"],
                ["IP allowlist", settings.ipAllowlist?.length ? settings.ipAllowlist.join(", ") : "None"],
                ["Brand color", settings.brandColor ?? "Default"],
                ["Logo", settings.logoUrl ? "Set" : "None"],
                ["Onboarding completed", settings.onboardingCompletedAt ? new Date(settings.onboardingCompletedAt).toLocaleDateString() : "No"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl border border-border bg-card p-4">
                  <p className="text-xs text-muted-foreground mb-1">{label}</p>
                  <p className="text-sm font-medium text-foreground">{value}</p>
                </div>
              ))}
            </>
          ) : (
            <div className="col-span-2 rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
              No settings found.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
