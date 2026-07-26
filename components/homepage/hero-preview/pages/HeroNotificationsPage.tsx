"use client";

import { m as Motion } from "framer-motion";
import { Bell, BellRing, CheckSquare, MessageSquare, Settings2, UserPlus } from "lucide-react";
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
          <h2 className="font-display text-foreground text-base font-bold">Notifications</h2>
          <p className="text-muted-foreground text-[11px]">
            Stay updated on activity across your organization
          </p>
        </div>
        <div className="flex items-center gap-1">
          <div className="bg-primary text-primary-foreground flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[10px] font-medium">
            <BellRing size={7} /> Push enabled
          </div>
          <div className="border-border bg-background text-foreground flex items-center gap-0.5 rounded-md border px-1.5 py-0.5 text-[10px]">
            <Settings2 size={7} /> Preferences
          </div>
        </div>
      </div>

      {/* Notification feed */}
      <div className="border-border bg-card overflow-hidden rounded-lg border">
        {HERO_NOTIFICATIONS.map((n, i) => {
          const cfg = typeIcon[n.type] ?? {
            icon: Bell,
            color: "bg-secondary text-muted-foreground",
          };
          const Icon = cfg.icon;
          return (
            <Motion.div
              key={n.title}
              custom={i}
              variants={itemAnim}
              initial="hidden"
              animate="show"
              className={`border-border hover:bg-secondary/30 flex items-start gap-2 border-b px-3 py-2.5 transition-colors last:border-0 ${
                n.unread ? "border-l-primary bg-primary/[0.02] border-l-2" : ""
              }`}
            >
              <div
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${cfg.color}`}
              >
                <Icon size={9} />
              </div>
              <div className="min-w-0 flex-1">
                <div
                  className={`text-xs leading-snug ${n.unread ? "text-foreground font-semibold" : "text-foreground"}`}
                >
                  {n.title}
                </div>
                <div className="text-muted-foreground mt-0.5 truncate text-[10px]">{n.body}</div>
                <div className="text-muted-foreground/60 mt-0.5 text-[9px]">{n.time}</div>
              </div>
              {n.unread && <div className="bg-primary mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" />}
            </Motion.div>
          );
        })}
      </div>
    </div>
  );
}
