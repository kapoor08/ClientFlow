import { useState } from "react";
import { mockNotifications } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import {
  Bell,
  CheckSquare,
  MessageSquare,
  GitBranch,
  CreditCard,
  UserPlus,
  Check,
} from "lucide-react";

const typeIcon: Record<string, typeof Bell> = {
  task_assigned: CheckSquare,
  comment: MessageSquare,
  status_change: GitBranch,
  mention: Bell,
  billing: CreditCard,
  invite: UserPlus,
};

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState(mockNotifications);

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground">
            Notifications
          </h1>
          <p className="text-sm text-muted-foreground">{unreadCount} unread</p>
        </div>
        <Button variant="outline" size="sm" onClick={markAllRead}>
          <Check size={14} className="mr-1.5" /> Mark All Read
        </Button>
      </div>

      <div className="space-y-1">
        {notifications.map((n) => {
          const Icon = typeIcon[n.type] || Bell;
          return (
            <div
              key={n.id}
              className={`flex items-start gap-3 rounded-lg p-3 transition-colors cursor-pointer hover:bg-secondary/50 ${
                !n.read ? "bg-brand-100/30" : ""
              }`}
              onClick={() =>
                setNotifications((prev) =>
                  prev.map((item) =>
                    item.id === n.id ? { ...item, read: true } : item,
                  ),
                )
              }
            >
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${!n.read ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}
              >
                <Icon size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm ${!n.read ? "font-medium text-foreground" : "text-foreground"}`}
                >
                  {n.title}
                </p>
                <p className="text-xs text-muted-foreground">{n.description}</p>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  {n.timestamp}
                </p>
              </div>
              {!n.read && (
                <div className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default NotificationsPage;
