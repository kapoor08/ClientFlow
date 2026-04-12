"use client";

import { motion } from "framer-motion";
import { Key, LogOut, Monitor, Shield } from "lucide-react";

const SESSIONS = [
  { device: "Desktop · Windows 10/11", browser: "Chrome · 0000:0000:0000:0000:0000:0000:0000:0000", time: "Last active 14h ago", current: true },
  { device: "Desktop · Windows 10/11", browser: "Chrome · 0000:0000:0000:0000:0000:0000:0000:0000", time: "Last active 2d ago", current: false },
  { device: "Desktop · Windows 10/11", browser: "Chrome · 49.43.92.126", time: "Last active 5d ago", current: false },
  { device: "Desktop · Windows 10/11", browser: "Chrome · 49.43.92.126", time: "Last active 6d ago", current: false },
  { device: "Desktop · Windows 10/11", browser: "Chrome · 0000:0000:0000:0000:0000:0000:0000:0000", time: "Last active 8d ago", current: false },
];

const fadeIn = {
  hidden: { opacity: 0, y: 4 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.04, duration: 0.2 } }),
};

export function HeroSecurityPage() {
  return (
    <div className="hero-preview-scrollbar flex-1 overflow-y-auto p-5">
      <div className="mb-3">
        <h2 className="text-base font-bold font-display text-foreground">Security</h2>
        <p className="text-[11px] text-muted-foreground">Manage your active sessions and devices</p>
      </div>

      {/* Authentication */}
      <h3 className="mb-1.5 text-[13px] font-bold text-foreground">Authentication</h3>
      <div className="mb-3 space-y-1">
        <div className="flex items-center justify-between rounded-lg border border-border bg-card p-2.5">
          <div className="flex items-center gap-2">
            <div className="flex h-5 w-5 items-center justify-center rounded-lg bg-secondary">
              <Shield size={8} className="text-muted-foreground" />
            </div>
            <div>
              <div className="text-xs font-medium text-foreground">Two-Factor Authentication</div>
              <div className="text-[10px] text-muted-foreground">Not enabled - add an extra layer of security.</div>
            </div>
          </div>
          <div className="rounded-md bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">Enable</div>
        </div>
        <div className="flex items-center justify-between rounded-lg border border-border bg-card p-2.5">
          <div className="flex items-center gap-2">
            <div className="flex h-5 w-5 items-center justify-center rounded-lg bg-secondary">
              <Key size={8} className="text-muted-foreground" />
            </div>
            <div>
              <div className="text-xs font-medium text-foreground">Password</div>
              <div className="text-[10px] text-muted-foreground">Update your account password regularly for better security.</div>
            </div>
          </div>
          <div className="rounded-md border border-border px-1.5 py-0.5 text-[10px] font-medium text-foreground">Change</div>
        </div>
      </div>

      {/* Organization Policies */}
      <h3 className="mb-1.5 text-[13px] font-bold text-foreground">Organization Policies</h3>
      <div className="mb-3 rounded-lg border border-border bg-card p-2.5">
        <div className="text-xs font-bold text-foreground">Security Policies</div>
        <div className="mt-1.5 grid grid-cols-2 gap-2">
          <div>
            <div className="text-[10px] font-medium text-foreground">Session Timeout</div>
            <div className="text-[9px] text-muted-foreground mb-1">Auto sign-out members after this period of inactivity.</div>
            <div className="flex items-center justify-between rounded-md border border-border bg-background px-2 py-1 text-[11px] text-foreground">
              No timeout
            </div>
          </div>
          <div>
            <div className="text-[10px] font-medium text-foreground">IP Allowlist</div>
            <div className="text-[9px] text-muted-foreground mb-1">Restrict access to these IP addresses or CIDR ranges.</div>
            <div className="flex items-center gap-1">
              <div className="flex-1 rounded-md border border-border bg-background px-2 py-1 text-[11px] text-muted-foreground/40">192.168.1.0/24</div>
              <div className="rounded-md border border-border px-1.5 py-1 text-[10px] text-foreground">Add</div>
            </div>
          </div>
        </div>
        <div className="mt-2 w-fit rounded-md bg-primary px-2 py-0.5 text-[10px] font-medium text-primary-foreground">Save Policies</div>
      </div>

      {/* Active Sessions */}
      <div className="mb-1.5 flex items-center justify-between">
        <h3 className="text-[13px] font-bold text-foreground">Active Sessions</h3>
        <span className="text-[10px] text-muted-foreground">{SESSIONS.length} sessions</span>
      </div>
      <div className="space-y-1">
        {SESSIONS.map((s, i) => (
          <motion.div
            key={i}
            custom={i}
            variants={fadeIn}
            initial="hidden"
            animate="show"
            className="flex items-center justify-between rounded-lg border border-border bg-card p-2"
          >
            <div className="flex items-center gap-1.5">
              <Monitor size={10} className="text-muted-foreground/40" />
              <div>
                <div className="flex items-center gap-1">
                  <span className="text-[11px] font-medium text-foreground">{s.device}</span>
                  {s.current && (
                    <span className="rounded-full bg-success/10 px-1 py-px text-[4px] font-medium text-success">Current</span>
                  )}
                </div>
                <div className="text-[9px] text-muted-foreground">{s.browser}</div>
                <div className="text-[9px] text-muted-foreground">{s.time}</div>
              </div>
            </div>
            {!s.current && (
              <div className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                <LogOut size={6} /> Revoke
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
