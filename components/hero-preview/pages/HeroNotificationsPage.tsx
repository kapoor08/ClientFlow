"use client";

import { motion } from "framer-motion";
import {
  Bell,
  BellRing,
  CheckSquare,
  MessageSquare,
  Settings2,
  UserPlus,
} from "lucide-react";
import { HERO_NOTIFICATIONS } from "../data";

const typeIcon: Record<string, { icon: React.ElementType; color: string }> = {
  task_assigned: { icon: CheckSquare, color: "bg-blue-500/15 text-blue-600" },
  task_comment_added: { icon: MessageSquare, color: "bg-violet-500/15 text-violet-600" },
  task_due_soon: { icon: Bell, color: "bg-amber-500/15 text-amber-600" },
  invite_accepted: { icon: UserPlus, color: "bg-emerald-500/15 text-emerald-600" },
};

const itemAnim = {
  hidden: { opacity: 0, x: -6 },
  show: (i: number) => ({ opacity: 1, x: 0, transition: { delay: i * 0.05, duration: 0.25 } }),
};

export function HeroNotificationsPage() {
  return (
    <div className="hero-preview-scrollbar flex-1 overflow-y-auto p-5">
      {/* Header */}
      <div className="mb-2.5 flex items-start justify-between">
        <div>
          <h2 className="text-base font-bold font-display text-foreground">Notifications</h2>
          <p className="text-[11px] text-muted-foreground">Stay updated on activity across your organization</p>
        </div>
        <div className="flex items-center gap-1">
          <div className="flex items-center gap-0.5 rounded-md bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
            <BellRing size={7} /> Push enabled
          </div>
          <div className="flex items-center gap-0.5 rounded-md border border-border bg-background px-1.5 py-0.5 text-[10px] text-foreground">
            <Settings2 size={7} /> Preferences
          </div>
        </div>
      </div>

      {/* Notification feed */}
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        {HERO_NOTIFICATIONS.map((n, i) => {
          const cfg = typeIcon[n.type] ?? { icon: Bell, color: "bg-secondary text-muted-foreground" };
          const Icon = cfg.icon;
          return (
            <motion.div
              key={n.title}
              custom={i}
              variants={itemAnim}
              initial="hidden"
              animate="show"
              className={`flex items-start gap-2 border-b border-border px-3 py-2.5 last:border-0 transition-colors hover:bg-secondary/30 ${
                n.unread ? "border-l-2 border-l-primary bg-primary/[0.02]" : ""
              }`}
            >
              <div className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${cfg.color}`}>
                <Icon size={9} />
              </div>
              <div className="min-w-0 flex-1">
                <div className={`text-xs leading-snug ${n.unread ? "font-semibold text-foreground" : "text-foreground"}`}>
                  {n.title}
                </div>
                <div className="mt-0.5 truncate text-[10px] text-muted-foreground">{n.body}</div>
                <div className="mt-0.5 text-[9px] text-muted-foreground/60">{n.time}</div>
              </div>
              {n.unread && (
                <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
