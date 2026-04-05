import { http } from "@/core/infrastructure";
import type {
  NotificationListResponse,
  NotificationPreferencesResponse,
  PushSubscribeInput,
} from "./entity";
import type { NotificationEventKey } from "@/lib/notifications-shared";

export async function fetchNotifications(): Promise<NotificationListResponse> {
  return http<NotificationListResponse>("/api/notifications");
}

export async function markNotificationRead(
  id: string,
  isRead: boolean,
): Promise<void> {
  return http<void>(`/api/notifications/${id}`, {
    method: "PATCH",
    body: { isRead },
  });
}

export async function markAllNotificationsRead(): Promise<void> {
  return http<void>("/api/notifications", { method: "POST" });
}

export async function deleteNotification(id: string): Promise<void> {
  return http<void>(`/api/notifications/${id}`, { method: "DELETE" });
}

export async function deleteAllNotifications(): Promise<void> {
  return http<void>("/api/notifications", { method: "DELETE" });
}

export async function fetchPreferences(): Promise<NotificationPreferencesResponse> {
  return http<NotificationPreferencesResponse>("/api/notifications/preferences");
}

export async function updatePreference(
  eventKey: NotificationEventKey,
  patch: { inAppEnabled?: boolean; emailEnabled?: boolean },
): Promise<void> {
  return http<void>("/api/notifications/preferences", {
    method: "PATCH",
    body: { eventKey, ...patch },
  });
}

export async function bulkUpdatePreferences(
  patch: { inAppEnabled?: boolean; emailEnabled?: boolean },
): Promise<void> {
  return http<void>("/api/notifications/preferences/bulk", {
    method: "POST",
    body: patch,
  });
}

export async function subscribeToPush(sub: PushSubscribeInput): Promise<void> {
  return http<void>("/api/notifications/push/subscribe", {
    method: "POST",
    body: sub,
  });
}

export async function unsubscribeFromPush(endpoint: string): Promise<void> {
  return http<void>("/api/notifications/push/subscribe", {
    method: "DELETE",
    body: { endpoint },
  });
}
