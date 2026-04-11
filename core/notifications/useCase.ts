import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryResult,
  type UseMutationResult,
} from "@tanstack/react-query";
import { useEffect } from "react";
import { HttpError } from "@/core/infrastructure";
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  deleteAllNotifications,
  fetchPreferences,
  updatePreference,
  bulkUpdatePreferences,
  subscribeToPush,
  unsubscribeFromPush,
} from "./repository";
import type {
  NotificationListResponse,
  NotificationPreferencesResponse,
} from "./entity";
import type { NotificationEventKey } from "@/lib/notifications-shared";

export const notificationKeys = {
  all: ["notifications"] as const,
  list: () => [...notificationKeys.all, "list"] as const,
  preferences: () => [...notificationKeys.all, "preferences"] as const,
};

export function useNotifications(): UseQueryResult<NotificationListResponse, HttpError> {
  return useQuery({
    queryKey: notificationKeys.list(),
    queryFn: fetchNotifications,
    refetchInterval: 30_000, // fallback poll every 30s (SSE handles real-time)
    refetchIntervalInBackground: false,
  });
}

/**
 * Opens a persistent SSE connection to /api/notifications/stream.
 * Invalidates the notifications query instantly when a new notification arrives.
 * Falls back gracefully if the connection drops - the polling interval acts as backup.
 */
export function useNotificationStream(): void {
  const qc = useQueryClient();

  useEffect(() => {
    // SSE doesn't work reliably through the Next.js dev-server proxy.
    // In development, the 30s polling interval in useNotifications is sufficient.
    if (process.env.NODE_ENV === "development") return;

    let es: EventSource;
    let retryTimeout: ReturnType<typeof setTimeout>;
    let retryDelay = 3_000;

    const connect = () => {
      es = new EventSource("/api/notifications/stream");

      es.onmessage = (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data as string) as { type: string };
          if (data.type === "new_notification") {
            void qc.invalidateQueries({ queryKey: notificationKeys.list() });
          }
          // Reset backoff on successful message
          retryDelay = 3_000;
        } catch {
          // Ignore malformed events
        }
      };

      es.onerror = () => {
        es.close();
        retryTimeout = setTimeout(() => {
          retryDelay = Math.min(retryDelay * 2, 60_000);
          connect();
        }, retryDelay);
      };
    };

    connect();

    return () => {
      clearTimeout(retryTimeout);
      es?.close();
    };
  }, [qc]);
}

export function useMarkRead(): UseMutationResult<
  void,
  HttpError,
  { id: string; isRead: boolean }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isRead }) => markNotificationRead(id, isRead),
    onSuccess: () => qc.invalidateQueries({ queryKey: notificationKeys.list() }),
  });
}

export function useMarkAllRead(): UseMutationResult<void, HttpError, void> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: notificationKeys.list() }),
  });
}

export function useDeleteNotification(): UseMutationResult<void, HttpError, string> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteNotification(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: notificationKeys.list() }),
  });
}

export function useDeleteAllNotifications(): UseMutationResult<void, HttpError, void> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteAllNotifications,
    onSuccess: () => qc.invalidateQueries({ queryKey: notificationKeys.list() }),
  });
}

export function useNotificationPreferences(): UseQueryResult<
  NotificationPreferencesResponse,
  HttpError
> {
  return useQuery({
    queryKey: notificationKeys.preferences(),
    queryFn: fetchPreferences,
  });
}

export function useUpdatePreference(): UseMutationResult<
  void,
  HttpError,
  { eventKey: NotificationEventKey; inAppEnabled?: boolean; emailEnabled?: boolean }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ eventKey, ...patch }) => updatePreference(eventKey, patch),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: notificationKeys.preferences() }),
  });
}

export function useBulkUpdatePreferences(): UseMutationResult<
  void,
  HttpError,
  { inAppEnabled?: boolean; emailEnabled?: boolean }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: bulkUpdatePreferences,
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: notificationKeys.preferences() }),
  });
}

// ─── Push helpers ─────────────────────────────────────────────────────────────

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export async function requestPushPermissionAndSubscribe(
  permissionAlreadyGranted = false,
): Promise<string | null> {
  if (!("Notification" in window) || !("serviceWorker" in navigator)) return null;

  if (!permissionAlreadyGranted) {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return null;
  } else if (Notification.permission !== "granted") {
    return null;
  }

  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!vapidKey) return null;

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidKey) as unknown as string,
  });

  const json = subscription.toJSON();
  const endpoint = json.endpoint!;
  const p256dh = json.keys?.p256dh ?? "";
  const auth = json.keys?.auth ?? "";

  await subscribeToPush({ endpoint, p256dh, auth });
  return endpoint;
}

export async function unsubscribeFromPushAndRemove(): Promise<void> {
  if (!("serviceWorker" in navigator)) return;

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (!subscription) return;

  await unsubscribeFromPush(subscription.endpoint);
  await subscription.unsubscribe();
}
