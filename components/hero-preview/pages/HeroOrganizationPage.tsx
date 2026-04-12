"use client";

import { motion } from "framer-motion";
import {
  Building2,
  ChevronDown,
  Code2,
  Download,
  Globe,
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
        <motion.div
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-28 shrink-0"
        >
          <p className="mb-1 px-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">Settings</p>
          <div className="space-y-px">
            {SETTINGS_NAV.map(({ icon: Icon, label, active }) => (
              <div
                key={label}
                className={`flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium ${
                  active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-muted-foreground hover:bg-secondary/50"
                }`}
              >
                <Icon size={9} />
                {label}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Settings content */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex-1"
        >
          <h2 className="text-base font-bold font-display text-foreground">Organization Settings</h2>
          <p className="mb-3 text-[11px] text-muted-foreground">Manage your organization profile and authentication preferences.</p>

          {/* General section */}
          <div className="mb-3 rounded-lg border border-border bg-card p-3">
            <h3 className="text-[13px] font-bold text-foreground">General</h3>
            <p className="mb-2 text-[10px] text-muted-foreground">Your organization&apos;s public-facing name and URL slug.</p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-0.5 block text-[10px] font-medium text-foreground">Organization Name</label>
                <div className="rounded-md border border-border bg-background px-2 py-1 text-[11px] text-foreground">Lakshay&apos;s Workspace</div>
              </div>
              <div>
                <label className="mb-0.5 block text-[10px] font-medium text-foreground">Slug</label>
                <div className="rounded-md border border-border bg-background px-2 py-1 text-[11px] text-foreground">lakshay-s-workspace-ylon</div>
                <p className="mt-0.5 text-[9px] text-muted-foreground">Used for workspace URLs and internal organization references.</p>
              </div>
            </div>
          </div>

          {/* Localization */}
          <div className="mb-3 rounded-lg border border-border bg-card p-3">
            <h3 className="text-[13px] font-bold text-foreground">Localization</h3>
            <p className="mb-2 text-[10px] text-muted-foreground">Set the default timezone and currency for your organization.</p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-0.5 block text-[10px] font-medium text-foreground">Timezone</label>
                <div className="flex items-center justify-between rounded-md border border-border bg-background px-2 py-1 text-[11px] text-foreground">
                  UTC <ChevronDown size={6} className="text-muted-foreground" />
                </div>
              </div>
              <div>
                <label className="mb-0.5 block text-[10px] font-medium text-foreground">Currency</label>
                <div className="flex items-center justify-between rounded-md border border-border bg-background px-2 py-1 text-[11px] text-foreground">
                  USD - US Dollar <ChevronDown size={6} className="text-muted-foreground" />
                </div>
              </div>
            </div>
          </div>

          {/* Authentication Policy */}
          <div className="mb-3 rounded-lg border border-border bg-card p-3">
            <h3 className="text-[13px] font-bold text-foreground">Authentication Policy</h3>
            <p className="mb-2 text-[10px] text-muted-foreground">Control sign-in requirements for all members.</p>
            <div className="flex items-center justify-between rounded-lg border border-border p-2">
              <div>
                <div className="text-[11px] font-medium text-foreground">Require email verification before sign-in</div>
                <div className="text-[9px] text-muted-foreground">When enabled, unverified members are blocked at sign-in until they confirm their email address.</div>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[9px] font-medium text-muted-foreground">REQUIRED</span>
                <div className="h-3 w-6 rounded-full bg-primary relative">
                  <div className="absolute right-0.5 top-0.5 h-2 w-2 rounded-full bg-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Save button */}
          <div className="flex items-center gap-0.5 rounded-md bg-primary px-2 py-1 text-[11px] font-medium text-primary-foreground w-fit">
            <Save size={7} /> Save Changes
          </div>
        </motion.div>
      </div>
    </div>
  );
}
