"use client";

import { m as Motion } from "framer-motion";
import {
  Building2,
  ChevronDown,
  Download,
  Key,
  Palette,
  Save,
  Shield,
  Users,
  Webhook,
} from "lucide-react";

const SETTINGS_NAV = [
  { icon: Building2, label: "Organization", active: true },
  { icon: Palette, label: "Branding" },
  { icon: Users, label: "Role Permissions" },
  { icon: Key, label: "API Keys" },
  { icon: Download, label: "Data Export" },
  { icon: Webhook, label: "Webhooks" },
  { icon: Shield, label: "SSO" },
];

export function HeroOrganizationPage() {
  return (
    <div className="hero-preview-scrollbar flex-1 overflow-y-auto p-5">
      <div className="flex gap-3">
        {/* Settings sidebar */}
        <Motion.div
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-28 shrink-0"
        >
          <p className="text-muted-foreground/50 mb-1 px-2 text-[10px] font-bold tracking-widest uppercase">
            Settings
          </p>
          <div className="space-y-px">
            {SETTINGS_NAV.map(({ icon: Icon, label, active }) => (
              <div
                key={label}
                className={`flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium ${
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-muted-foreground hover:bg-secondary/50"
                }`}
              >
                <Icon size={9} />
                {label}
              </div>
            ))}
          </div>
        </Motion.div>

        {/* Settings content */}
        <Motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex-1"
        >
          <h2 className="font-display text-foreground text-base font-bold">
            Organization Settings
          </h2>
          <p className="text-muted-foreground mb-3 text-[11px]">
            Manage your organization profile and authentication preferences.
          </p>

          {/* General section */}
          <div className="border-border bg-card mb-3 rounded-lg border p-3">
            <h3 className="text-foreground text-[13px] font-bold">General</h3>
            <p className="text-muted-foreground mb-2 text-[10px]">
              Your organization&apos;s public-facing name and URL slug.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-foreground mb-0.5 block text-[10px] font-medium">
                  Organization Name
                </label>
                <div className="border-border bg-background text-foreground rounded-md border px-2 py-1 text-[11px]">
                  Lakshay&apos;s Workspace
                </div>
              </div>
              <div>
                <label className="text-foreground mb-0.5 block text-[10px] font-medium">Slug</label>
                <div className="border-border bg-background text-foreground rounded-md border px-2 py-1 text-[11px]">
                  lakshay-s-workspace-ylon
                </div>
                <p className="text-muted-foreground mt-0.5 text-[9px]">
                  Used for workspace URLs and internal organization references.
                </p>
              </div>
            </div>
          </div>

          {/* Localization */}
          <div className="border-border bg-card mb-3 rounded-lg border p-3">
            <h3 className="text-foreground text-[13px] font-bold">Localization</h3>
            <p className="text-muted-foreground mb-2 text-[10px]">
              Set the default timezone and currency for your organization.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-foreground mb-0.5 block text-[10px] font-medium">
                  Timezone
                </label>
                <div className="border-border bg-background text-foreground flex items-center justify-between rounded-md border px-2 py-1 text-[11px]">
                  UTC <ChevronDown size={6} className="text-muted-foreground" />
                </div>
              </div>
              <div>
                <label className="text-foreground mb-0.5 block text-[10px] font-medium">
                  Currency
                </label>
                <div className="border-border bg-background text-foreground flex items-center justify-between rounded-md border px-2 py-1 text-[11px]">
                  USD - US Dollar <ChevronDown size={6} className="text-muted-foreground" />
                </div>
              </div>
            </div>
          </div>

          {/* Authentication Policy */}
          <div className="border-border bg-card mb-3 rounded-lg border p-3">
            <h3 className="text-foreground text-[13px] font-bold">Authentication Policy</h3>
            <p className="text-muted-foreground mb-2 text-[10px]">
              Control sign-in requirements for all members.
            </p>
            <div className="border-border flex items-center justify-between rounded-lg border p-2">
              <div>
                <div className="text-foreground text-[11px] font-medium">
                  Require email verification before sign-in
                </div>
                <div className="text-muted-foreground text-[9px]">
                  When enabled, unverified members are blocked at sign-in until they confirm their
                  email address.
                </div>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground text-[9px] font-medium">REQUIRED</span>
                <div className="bg-primary relative h-3 w-6 rounded-full">
                  <div className="absolute top-0.5 right-0.5 h-2 w-2 rounded-full bg-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Save button */}
          <div className="bg-primary text-primary-foreground flex w-fit items-center gap-0.5 rounded-md px-2 py-1 text-[11px] font-medium">
            <Save size={7} /> Save Changes
          </div>
        </Motion.div>
      </div>
    </div>
  );
}
