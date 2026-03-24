import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryResult,
  type UseMutationResult,
} from "@tanstack/react-query";
import { HttpError } from "@/core/infrastructure";
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
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
    refetchInterval: 10_000, // poll every 10s
    refetchIntervalInBackground: false, // pause polling when tab is not focused
  });
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

export async function requestPushPermissionAndSubscribe(): Promise<string | null> {
  if (!("Notification" in window) || !("serviceWorker" in navigator)) return null;

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return null;

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
