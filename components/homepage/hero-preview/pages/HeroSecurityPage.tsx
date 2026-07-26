"use client";

import { m as Motion } from "framer-motion";
import { Key, LogOut, Monitor, Shield } from "lucide-react";

const SESSIONS = [
  {
    device: "Desktop · Windows 10/11",
    browser: "Chrome · 0000:0000:0000:0000:0000:0000:0000:0000",
    time: "Last active 14h ago",
    current: true,
  },
  {
    device: "Desktop · Windows 10/11",
    browser: "Chrome · 0000:0000:0000:0000:0000:0000:0000:0000",
    time: "Last active 2d ago",
    current: false,
  },
  {
    device: "Desktop · Windows 10/11",
    browser: "Chrome · 49.43.92.126",
    time: "Last active 5d ago",
    current: false,
  },
  {
    device: "Desktop · Windows 10/11",
    browser: "Chrome · 49.43.92.126",
    time: "Last active 6d ago",
    current: false,
  },
  {
    device: "Desktop · Windows 10/11",
    browser: "Chrome · 0000:0000:0000:0000:0000:0000:0000:0000",
    time: "Last active 8d ago",
    current: false,
  },
];

const fadeIn = {
  hidden: { opacity: 0, y: 4 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.04, duration: 0.2 } }),
};

export function HeroSecurityPage() {
  return (
    <div className="hero-preview-scrollbar flex-1 overflow-y-auto p-5">
      <div className="mb-3">
        <h2 className="font-display text-foreground text-base font-bold">Security</h2>
        <p className="text-muted-foreground text-[11px]">Manage your active sessions and devices</p>
      </div>

      {/* Authentication */}
      <h3 className="text-foreground mb-1.5 text-[13px] font-bold">Authentication</h3>
      <div className="mb-3 space-y-1">
        <div className="border-border bg-card flex items-center justify-between rounded-lg border p-2.5">
          <div className="flex items-center gap-2">
            <div className="bg-secondary flex h-5 w-5 items-center justify-center rounded-lg">
              <Shield size={8} className="text-muted-foreground" />
            </div>
            <div>
              <div className="text-foreground text-xs font-medium">Two-Factor Authentication</div>
              <div className="text-muted-foreground text-[10px]">
                Not enabled - add an extra layer of security.
              </div>
            </div>
          </div>
          <div className="bg-primary text-primary-foreground rounded-md px-1.5 py-0.5 text-[10px] font-medium">
            Enable
          </div>
        </div>
        <div className="border-border bg-card flex items-center justify-between rounded-lg border p-2.5">
          <div className="flex items-center gap-2">
            <div className="bg-secondary flex h-5 w-5 items-center justify-center rounded-lg">
              <Key size={8} className="text-muted-foreground" />
            </div>
            <div>
              <div className="text-foreground text-xs font-medium">Password</div>
              <div className="text-muted-foreground text-[10px]">
                Update your account password regularly for better security.
              </div>
            </div>
          </div>
          <div className="border-border text-foreground rounded-md border px-1.5 py-0.5 text-[10px] font-medium">
            Change
          </div>
        </div>
      </div>

      {/* Organization Policies */}
      <h3 className="text-foreground mb-1.5 text-[13px] font-bold">Organization Policies</h3>
      <div className="border-border bg-card mb-3 rounded-lg border p-2.5">
        <div className="text-foreground text-xs font-bold">Security Policies</div>
        <div className="mt-1.5 grid grid-cols-2 gap-2">
          <div>
            <div className="text-foreground text-[10px] font-medium">Session Timeout</div>
            <div className="text-muted-foreground mb-1 text-[9px]">
              Auto sign-out members after this period of inactivity.
            </div>
            <div className="border-border bg-background text-foreground flex items-center justify-between rounded-md border px-2 py-1 text-[11px]">
              No timeout
            </div>
          </div>
          <div>
            <div className="text-foreground text-[10px] font-medium">IP Allowlist</div>
            <div className="text-muted-foreground mb-1 text-[9px]">
              Restrict access to these IP addresses or CIDR ranges.
            </div>
            <div className="flex items-center gap-1">
              <div className="border-border bg-background text-muted-foreground/40 flex-1 rounded-md border px-2 py-1 text-[11px]">
                192.168.1.0/24
              </div>
              <div className="border-border text-foreground rounded-md border px-1.5 py-1 text-[10px]">
                Add
              </div>
            </div>
          </div>
        </div>
        <div className="bg-primary text-primary-foreground mt-2 w-fit rounded-md px-2 py-0.5 text-[10px] font-medium">
          Save Policies
        </div>
      </div>

      {/* Active Sessions */}
      <div className="mb-1.5 flex items-center justify-between">
        <h3 className="text-foreground text-[13px] font-bold">Active Sessions</h3>
        <span className="text-muted-foreground text-[10px]">{SESSIONS.length} sessions</span>
      </div>
      <div className="space-y-1">
        {SESSIONS.map((s, i) => (
          <Motion.div
            key={i}
            custom={i}
            variants={fadeIn}
            initial="hidden"
            animate="show"
            className="border-border bg-card flex items-center justify-between rounded-lg border p-2"
          >
            <div className="flex items-center gap-1.5">
              <Monitor size={10} className="text-muted-foreground/40" />
              <div>
                <div className="flex items-center gap-1">
                  <span className="text-foreground text-[11px] font-medium">{s.device}</span>
                  {s.current && (
                    <span className="bg-success/10 text-success rounded-full px-1 py-px text-[4px] font-medium">
                      Current
                    </span>
                  )}
                </div>
                <div className="text-muted-foreground text-[9px]">{s.browser}</div>
                <div className="text-muted-foreground text-[9px]">{s.time}</div>
              </div>
            </div>
            {!s.current && (
              <div className="text-muted-foreground flex items-center gap-0.5 text-[10px]">
                <LogOut size={6} /> Revoke
              </div>
            )}
          </Motion.div>
        ))}
      </div>
    </div>
  );
}
