"use client";

import Link from "next/link";
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
  Settings2,
  ArrowUpRight,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PushEnableButton } from "@/components/notifications/PushEnableButton";
import {
  useNotifications,
  useMarkRead,
  useMarkAllRead,
} from "@/core/notifications/useCase";

// ─── Icon/color maps ──────────────────────────────────────────────────────────

const TYPE_ICON: Record<string, React.ElementType> = {
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

const TYPE_COLOR: Record<string, string> = {
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

// ─── NotificationFeed ─────────────────────────────────────────────────────────

export function NotificationFeed() {
  const { data, isLoading } = useNotifications();
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();
  const router = useRouter();

  const items = data?.items ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  return (
    <div className="space-y-4">
      {/* Action bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {!isLoading && unreadCount > 0 && (
            <span className="rounded-pill bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
              {unreadCount} unread
            </span>
          )}
          {!isLoading && unreadCount === 0 && (
            <span className="text-xs text-muted-foreground">
              You&apos;re all caught up
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <PushEnableButton />
          <Button variant="outline" size="sm" asChild>
            <Link href="/notifications/preferences">
              <Settings2 size={14} className="mr-1.5" />
              Preferences
            </Link>
          </Button>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                markAllRead.mutate(undefined, {
                  onSuccess: () =>
                    toast.success("All notifications marked as read."),
                  onError: (err) =>
                    toast.error(
                      err instanceof Error
                        ? err.message
                        : "Something went wrong.",
                    ),
                })
              }
            >
              <Check size={14} className="mr-1.5" />
              Mark All Read
            </Button>
          )}
        </div>
      </div>

      {/* Feed */}
      <div className="overflow-hidden rounded-card border border-border bg-card shadow-cf-1">
        {isLoading ? (
          <div className="divide-y divide-border">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3 p-4">
                <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
                <div className="flex-1 space-y-2 pt-0.5">
                  <Skeleton className="h-3.5 w-48" />
                  <Skeleton className="h-3 w-64" />
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
              We&apos;ll notify you when something happens.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {items.map((n) => {
              const Icon = TYPE_ICON[n.type] ?? Bell;
              const colorClass =
                TYPE_COLOR[n.type] ?? "bg-secondary text-muted-foreground";
              return (
                <div
                  key={n.id}
                  className={`group flex cursor-pointer items-start gap-3 p-4 transition-colors hover:bg-secondary/30 ${!n.isRead ? "bg-brand-100/20" : ""}`}
                  onClick={() => {
                    if (!n.isRead)
                      markRead.mutate(
                        { id: n.id, isRead: true },
                        {
                          onError: (err) =>
                            toast.error(
                              err instanceof Error
                                ? err.message
                                : "Something went wrong.",
                            ),
                        },
                      );
                    if (n.actionUrl) router.push(n.actionUrl);
                  }}
                >
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm ${!n.isRead ? "bg-primary text-primary-foreground" : colorClass}`}
                  >
                    <Icon size={15} />
                  </div>
                  <div className="min-w-0 flex-1">
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
                  <div className="flex shrink-0 items-center gap-1.5 pt-0.5">
                    {n.actionUrl && (
                      <ArrowUpRight
                        size={14}
                        className="text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
                      />
                    )}
                    {!n.isRead && (
                      <div className="h-2 w-2 rounded-full bg-primary" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
