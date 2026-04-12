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
  Trash2,
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
  useDeleteNotification,
  useDeleteAllNotifications,
} from "@/core/notifications/useCase";
import type { NotificationItem } from "@/core/notifications/entity";
import { groupItemsByDateLabel } from "@/utils/notifications";

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
  task_assigned: "bg-blue-100 text-blue-600",
  task_status_changed: "bg-emerald-100 text-emerald-600",
  task_comment_added: "bg-violet-100 text-violet-600",
  task_mentioned: "bg-indigo-100 text-indigo-600",
  task_due_soon: "bg-amber-100 text-amber-600",
  task_overdue: "bg-red-100 text-red-600",
  project_membership_changed: "bg-blue-100 text-blue-600",
  shared_file_uploaded: "bg-slate-100 text-slate-600",
  invite_accepted: "bg-emerald-100 text-emerald-600",
  role_changed: "bg-amber-100 text-amber-600",
};

function NotificationRow({
  n,
  onDelete,
  onMarkRead,
  onClick,
}: {
  n: NotificationItem;
  onDelete: () => void;
  onMarkRead: () => void;
  onClick: () => void;
}) {
  const Icon = TYPE_ICON[n.type] ?? Bell;
  const colorClass = TYPE_COLOR[n.type] ?? "bg-slate-100 text-slate-600";

  return (
    <div
      className={`group relative flex cursor-pointer items-start gap-3.5 px-4 py-3.5 transition-colors hover:bg-secondary/40 ${!n.isRead ? "bg-primary/30" : ""}`}
      onClick={onClick}
    >
      {!n.isRead && (
        <div className="absolute inset-y-0 left-0 w-0.5 rounded-r-full bg-primary" />
      )}

      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${!n.isRead ? "bg-primary text-primary-foreground" : colorClass}`}
      >
        <Icon size={15} strokeWidth={2} />
      </div>

      <div className="min-w-0 flex-1 pt-0.5">
        <p
          className={`text-sm leading-snug ${!n.isRead ? "font-semibold text-foreground" : "font-medium text-foreground"}`}
        >
          {n.title}
        </p>
        {n.body && (
          <p className="mt-0.5 text-xs text-muted-foreground">{n.body}</p>
        )}
        <p className="mt-1 text-[11px] text-muted-foreground/70">
          {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2 pt-0.5">
        {!n.isRead && (
          <button
            className="cursor-pointer rounded p-0.5 text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
            title="Mark as read"
            onClick={(e) => {
              e.stopPropagation();
              onMarkRead();
            }}
          >
            <Check size={13} />
          </button>
        )}
        <button
          className="cursor-pointer rounded p-0.5 text-muted-foreground opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100"
          title="Delete notification"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          <Trash2 size={13} />
        </button>
        {!n.isRead && (
          <div className="h-2 w-2 shrink-0 rounded-full bg-primary group-hover:opacity-0" />
        )}
      </div>
    </div>
  );
}

export function NotificationFeed() {
  const { data, isLoading } = useNotifications();
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();
  const deleteOne = useDeleteNotification();
  const deleteAll = useDeleteAllNotifications();
  const router = useRouter();

  const items = data?.items ?? [];
  const unreadCount = data?.unreadCount ?? 0;
  const groups = groupItemsByDateLabel(items);

  function handleMarkRead(id: string) {
    markRead.mutate(
      { id, isRead: true },
      {
        onError: (err) =>
          toast.error(
            err instanceof Error ? err.message : "Something went wrong.",
          ),
      },
    );
  }

  function handleDelete(id: string) {
    deleteOne.mutate(id, {
      onError: (err) =>
        toast.error(
          err instanceof Error ? err.message : "Something went wrong.",
        ),
    });
  }

  function handleDeleteAll() {
    deleteAll.mutate(undefined, {
      onSuccess: () => toast.success("All notifications cleared."),
      onError: (err) =>
        toast.error(
          err instanceof Error ? err.message : "Something went wrong.",
        ),
    });
  }

  function handleMarkAllRead() {
    markAllRead.mutate(undefined, {
      onSuccess: () => toast.success("All notifications marked as read."),
      onError: (err) =>
        toast.error(
          err instanceof Error ? err.message : "Something went wrong.",
        ),
    });
  }

  function handleRowClick(n: NotificationItem) {
    if (!n.isRead) handleMarkRead(n.id);
    if (n.actionUrl) router.push(n.actionUrl);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          {!isLoading && unreadCount > 0 && (
            <span className="rounded-pill bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
              {unreadCount} unread
            </span>
          )}
          {!isLoading && unreadCount === 0 && items.length > 0 && (
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
              onClick={handleMarkAllRead}
              disabled={markAllRead.isPending}
            >
              <Check size={14} className="mr-1.5" />
              Mark all read
            </Button>
          )}
          {items.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:border-destructive/50 hover:text-destructive cursor-pointer"
              onClick={handleDeleteAll}
              disabled={deleteAll.isPending}
            >
              <Trash2 size={14} className="mr-1.5" />
              Clear all
            </Button>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-card border border-border bg-card shadow-cf-1">
        {isLoading ? (
          <div className="divide-y divide-border">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3.5 px-4 py-3.5">
                <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
                <div className="flex-1 space-y-2 pt-1">
                  <Skeleton className="h-3.5 w-52" />
                  <Skeleton className="h-3 w-36" />
                  <Skeleton className="h-2.5 w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
              <Bell size={24} className="text-muted-foreground/40" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                No notifications yet
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground/60">
                We&apos;ll notify you when something happens.
              </p>
            </div>
          </div>
        ) : (
          <div>
            {groups.map((group, gi) => (
              <div key={group.label}>
                <div
                  className={`border-b border-border bg-secondary/30 px-4 py-2 ${gi > 0 ? "border-t" : ""}`}
                >
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {group.label}
                  </p>
                </div>
                <div className="divide-y divide-border">
                  {group.items.map((n) => (
                    <NotificationRow
                      key={n.id}
                      n={n}
                      onDelete={() => handleDelete(n.id)}
                      onMarkRead={() => handleMarkRead(n.id)}
                      onClick={() => handleRowClick(n)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
