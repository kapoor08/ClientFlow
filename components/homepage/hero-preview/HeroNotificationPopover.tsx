"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Check,
  CheckSquare,
  MessageSquare,
  UserPlus,
} from "lucide-react";
import { HERO_NOTIFICATIONS } from "./data";

const typeIcon: Record<string, React.ElementType> = {
  task_assigned: CheckSquare,
  task_comment_added: MessageSquare,
  task_due_soon: Bell,
  invite_accepted: UserPlus,
};

type HeroNotificationPopoverProps = {
  open: boolean;
  onClose: () => void;
};

export function HeroNotificationPopover({ open, onClose }: HeroNotificationPopoverProps) {
  const unreadCount = HERO_NOTIFICATIONS.filter((n) => n.unread).length;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            className="absolute inset-0 z-40"
            onClick={onClose}
          />

          {/* Popover - positioned below bell icon on right side */}
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.95 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="absolute right-12 top-12 z-50 w-72 overflow-hidden rounded-xl border border-border bg-card shadow-lg"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-foreground">Notifications</p>
                {unreadCount > 0 && (
                  <p className="text-xs text-muted-foreground">{unreadCount} unread</p>
                )}
              </div>
              {unreadCount > 0 && (
                <span className="flex items-center gap-1 text-xs text-primary">
                  <Check size={10} /> Mark all read
                </span>
              )}
            </div>

            {/* Items */}
            <div className="hero-preview-scrollbar max-h-52 overflow-y-auto">
              {HERO_NOTIFICATIONS.map((n, i) => {
                const Icon = typeIcon[n.type] ?? Bell;
                return (
                  <motion.div
                    key={n.title}
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.2 }}
                    className={`flex items-start gap-2.5 border-b border-border px-4 py-3 last:border-0 transition-colors hover:bg-secondary/50 ${n.unread ? "bg-primary/[0.03]" : ""}`}
                  >
                    <div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${n.unread ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
                      <Icon size={11} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-xs leading-snug ${n.unread ? "font-semibold text-foreground" : "text-foreground"}`}>
                        {n.title}
                      </p>
                      <p className="mt-0.5 truncate text-[10px] text-muted-foreground">{n.body}</p>
                      <p className="mt-0.5 text-[9px] text-muted-foreground/60">{n.time}</p>
                    </div>
                    {n.unread && (
                      <div className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />
                    )}
                  </motion.div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="border-t border-border px-4 py-2.5">
              <span className="text-xs text-primary">View all notifications</span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
