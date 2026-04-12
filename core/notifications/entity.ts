import type {
  NotificationEventKey,
  NotificationPreference,
} from "@/schemas/notifications";

export type { NotificationEventKey, NotificationPreference };

export type NotificationItem = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  actionUrl: string | null;
  data: Record<string, unknown> | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
};

export type NotificationListResponse = {
  access: { organizationId: string; organizationName: string } | null;
  items: NotificationItem[];
  unreadCount: number;
};

export type NotificationPreferencesResponse = {
  access: { organizationId: string; organizationName: string } | null;
  preferences: NotificationPreference[];
};

export type PushSubscribeInput = {
  endpoint: string;
  p256dh: string;
  auth: string;
};
