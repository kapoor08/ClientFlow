"use client";

import Link from "next/link";
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
  Settings2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PushEnableButton } from "@/components/notifications/PushEnableButton";
import {
  useNotifications,
  useMarkRead,
  useMarkAllRead,
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

const typeColor: Record<string, string> = {
  task_assigned: "bg-info/10 text-info",
  task_status_changed: "bg-success/10 text-success",
  task_comment_added: "bg-cf-accent-100 text-cf-accent-600",
  task_mentioned: "bg-brand-100 text-primary",
  task_due_soon: "bg-warning/10 text-warning",
  task_overdue: "bg-danger/10 text-danger",
  project_membership_changed: "bg-info/10 text-info",
  shared_file_uploaded: "bg-secondary text-muted-foreground",
  invite_accepted: "bg-success/10 text-success",
  role_changed: "bg-warning/10 text-warning",
};

const NotificationsPage = () => {
  const { data, isLoading } = useNotifications();
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();

  const items = data?.items ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground">
            Notifications
          </h1>
          <p className="text-sm text-muted-foreground">
            {isLoading
              ? "Loading…"
              : unreadCount > 0
                ? `${unreadCount} unread`
                : "You're all caught up"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <PushEnableButton />
          <Button variant="outline" size="sm" asChild>
            <Link href="/notifications/preferences">
              <Settings2 size={14} className="mr-1.5" /> Preferences
            </Link>
          </Button>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAllRead.mutate(undefined, {
                onSuccess: () => toast.success("All notifications marked as read."),
                onError: (err) => toast.error(err instanceof Error ? err.message : "Something went wrong."),
              })}
            >
              <Check size={14} className="mr-1.5" /> Mark All Read
            </Button>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-card border border-border bg-card shadow-cf-1">
        {isLoading ? (
          <div className="space-y-px p-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3 rounded-lg p-3">
                <div className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-secondary" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-48 animate-pulse rounded bg-secondary" />
                  <div className="h-2.5 w-64 animate-pulse rounded bg-secondary" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <Bell size={36} className="text-muted-foreground/30" />
            <p className="text-sm font-medium text-muted-foreground">
              No notifications yet
            </p>
            <p className="text-xs text-muted-foreground/70">
              We'll notify you when something happens.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {items.map((n) => {
              const Icon = typeIcon[n.type] ?? Bell;
              const colorClass =
                typeColor[n.type] ?? "bg-secondary text-muted-foreground";
              return (
                <div
                  key={n.id}
                  className={`flex items-start gap-3 p-4 transition-colors cursor-pointer hover:bg-secondary/30 ${!n.isRead ? "bg-brand-100/20" : ""}`}
                  onClick={() => {
                    if (!n.isRead) markRead.mutate(
                      { id: n.id, isRead: true },
                      {
                        onError: (err) => toast.error(err instanceof Error ? err.message : "Something went wrong."),
                      },
                    );
                  }}
                >
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm ${!n.isRead ? "bg-primary text-primary-foreground" : colorClass}`}
                  >
                    <Icon size={15} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm ${!n.isRead ? "font-semibold text-foreground" : "text-foreground"}`}
                    >
                      {n.title}
                    </p>
                    {n.body && (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {n.body}
                      </p>
                    )}
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {formatDistanceToNow(new Date(n.createdAt), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                  {!n.isRead && (
                    <div className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
