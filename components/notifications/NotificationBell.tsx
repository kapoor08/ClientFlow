"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Check,
  CheckSquare,
  MessageSquare,
  GitBranch,
  CreditCard,
  UserPlus,
  FileUp,
  Users,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
  useNotifications,
  useMarkRead,
  useMarkAllRead,
  useNotificationStream,
} from "@/core/notifications/useCase";

const typeIcon: Record<string, React.ElementType> = {
  task_assigned: CheckSquare,
  task_status_changed: GitBranch,
  task_comment_added: MessageSquare,
  task_mentioned: Bell,
  task_due_soon: CheckSquare,
  task_overdue: CheckSquare,
  project_membership_changed: Users,
  shared_file_uploaded: FileUp,
  invite_accepted: UserPlus,
  role_changed: CreditCard,
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { data } = useNotifications();
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();
  const router = useRouter();
  useNotificationStream();

  const items = data?.items ?? [];
  const unreadCount = data?.unreadCount ?? 0;
  const preview = items.slice(0, 8);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative cursor-pointer">
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="bg-accent text-accent-foreground absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={8} className="shadow-cf-2 w-80 p-0">
        {/* Header */}
        <div className="border-border flex items-center justify-between border-b px-4 py-3">
          <div>
            <p className="text-foreground text-sm font-semibold">Notifications</p>
            {unreadCount > 0 && (
              <p className="text-muted-foreground text-xs">{unreadCount} unread</p>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={() => markAllRead.mutate()}
              className="text-primary flex cursor-pointer items-center gap-1 text-xs hover:underline"
            >
              <Check size={11} /> Mark all read
            </button>
          )}
        </div>

        {/* List */}
        <div className="max-h-96 overflow-y-auto">
          {preview.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <Bell size={28} className="text-muted-foreground/30" />
              <p className="text-muted-foreground text-sm">You&apos;re all caught up!</p>
            </div>
          ) : (
            preview.map((n) => {
              const Icon = typeIcon[n.type] ?? Bell;
              return (
                <button
                  key={n.id}
                  onClick={() => {
                    if (!n.isRead) markRead.mutate({ id: n.id, isRead: true });
                    if (n.actionUrl) {
                      setOpen(false);
                      router.push(n.actionUrl);
                    }
                  }}
                  className={`hover:bg-secondary/50 border-border flex w-full cursor-pointer items-start gap-3 border-b px-4 py-3 text-left transition-colors last:border-0 ${!n.isRead ? "bg-brand-100/20" : ""}`}
                >
                  <div
                    className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${!n.isRead ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}
                  >
                    <Icon size={13} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-xs leading-snug ${!n.isRead ? "text-foreground font-semibold" : "text-foreground"}`}
                    >
                      {n.title}
                    </p>
                    {n.body && (
                      <p className="text-muted-foreground mt-0.5 truncate text-[11px]">{n.body}</p>
                    )}
                    <p className="text-muted-foreground mt-1 text-[10px]">
                      {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  {!n.isRead && (
                    <div className="bg-primary mt-2 h-1.5 w-1.5 shrink-0 rounded-full" />
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-border border-t px-4 py-2.5">
            <a
              href="/notifications"
              className="text-primary text-xs hover:underline"
              onClick={() => setOpen(false)}
            >
              View all notifications
            </a>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
