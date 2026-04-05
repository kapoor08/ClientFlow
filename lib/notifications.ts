import "server-only";

import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { emitNotificationEvent } from "@/lib/notification-stream";
import {
  notifications,
  notificationPreferences,
  organizationMemberships,
  pushSubscriptions,
} from "@/db/schema";
import { user as userTable } from "@/db/auth-schema";
import { getOrganizationSettingsContextForUser } from "@/lib/organization-settings";
import { sendPushToSubscription, type PushPayload } from "@/lib/push";
import { sendGenericNotification } from "@/lib/email";
import {
  ALL_EVENT_KEYS,
  type NotificationEventKey,
  type NotificationPreference,
} from "@/lib/notifications-shared";

export type NotificationModuleAccess = {
  organizationId: string;
  organizationName: string;
};

export type NotificationItem = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  data: Record<string, unknown> | null;
  isRead: boolean;
  readAt: Date | null;
  createdAt: Date;
};

// ─── Access helper ────────────────────────────────────────────────────────────

export async function getNotificationsModuleAccessForUser(
  userId: string,
): Promise<NotificationModuleAccess | null> {
  const ctx = await getOrganizationSettingsContextForUser(userId);
  if (!ctx) return null;
  return { organizationId: ctx.organizationId, organizationName: ctx.organizationName };
}

// ─── List notifications ───────────────────────────────────────────────────────

export async function listNotificationsForUser(
  userId: string,
  opts: { limit?: number; unreadOnly?: boolean } = {},
): Promise<{ access: NotificationModuleAccess | null; items: NotificationItem[]; unreadCount: number }> {
  const access = await getNotificationsModuleAccessForUser(userId);
  if (!access) return { access: null, items: [], unreadCount: 0 };

  const { limit = 50, unreadOnly = false } = opts;

  const where = and(
    eq(notifications.organizationId, access.organizationId),
    eq(notifications.userId, userId),
    unreadOnly ? eq(notifications.isRead, false) : undefined,
  );

  const [items, unreadRows] = await Promise.all([
    db
      .select()
      .from(notifications)
      .where(where)
      .orderBy(desc(notifications.createdAt))
      .limit(limit),
    db
      .select({ id: notifications.id })
      .from(notifications)
      .where(
        and(
          eq(notifications.organizationId, access.organizationId),
          eq(notifications.userId, userId),
          eq(notifications.isRead, false),
        ),
      ),
  ]);

  return {
    access,
    items: items.map((n) => ({
      ...n,
      data: n.data as Record<string, unknown> | null,
    })),
    unreadCount: unreadRows.length,
  };
}

// ─── Mark single notification read ───────────────────────────────────────────

export async function markNotificationReadForUser(
  userId: string,
  notificationId: string,
  isRead: boolean,
): Promise<void> {
  const access = await getNotificationsModuleAccessForUser(userId);
  if (!access) throw new Error("No active organization found.");

  await db
    .update(notifications)
    .set({
      isRead,
      readAt: isRead ? new Date() : null,
    })
    .where(
      and(
        eq(notifications.id, notificationId),
        eq(notifications.userId, userId),
        eq(notifications.organizationId, access.organizationId),
      ),
    );
}

// ─── Mark all read ────────────────────────────────────────────────────────────

export async function markAllNotificationsReadForUser(
  userId: string,
): Promise<void> {
  const access = await getNotificationsModuleAccessForUser(userId);
  if (!access) throw new Error("No active organization found.");

  await db
    .update(notifications)
    .set({ isRead: true, readAt: new Date() })
    .where(
      and(
        eq(notifications.organizationId, access.organizationId),
        eq(notifications.userId, userId),
        eq(notifications.isRead, false),
      ),
    );
}

// ─── Delete single notification ──────────────────────────────────────────────

export async function deleteNotificationForUser(
  userId: string,
  notificationId: string,
): Promise<void> {
  const access = await getNotificationsModuleAccessForUser(userId);
  if (!access) throw new Error("No active organization found.");

  await db
    .delete(notifications)
    .where(
      and(
        eq(notifications.id, notificationId),
        eq(notifications.userId, userId),
        eq(notifications.organizationId, access.organizationId),
      ),
    );
}

// ─── Delete all notifications ─────────────────────────────────────────────────

export async function deleteAllNotificationsForUser(
  userId: string,
): Promise<void> {
  const access = await getNotificationsModuleAccessForUser(userId);
  if (!access) throw new Error("No active organization found.");

  await db
    .delete(notifications)
    .where(
      and(
        eq(notifications.organizationId, access.organizationId),
        eq(notifications.userId, userId),
      ),
    );
}

// ─── Preferences ─────────────────────────────────────────────────────────────

export async function getNotificationPreferencesForUser(
  userId: string,
): Promise<{ access: NotificationModuleAccess | null; preferences: NotificationPreference[] }> {
  const access = await getNotificationsModuleAccessForUser(userId);
  if (!access) return { access: null, preferences: [] };

  const rows = await db
    .select({
      eventKey: notificationPreferences.eventKey,
      inAppEnabled: notificationPreferences.inAppEnabled,
      emailEnabled: notificationPreferences.emailEnabled,
    })
    .from(notificationPreferences)
    .where(
      and(
        eq(notificationPreferences.organizationId, access.organizationId),
        eq(notificationPreferences.userId, userId),
      ),
    );

  // Merge DB rows with defaults for any events not yet saved
  const saved = new Map(rows.map((r) => [r.eventKey, r]));
  const preferences: NotificationPreference[] = ALL_EVENT_KEYS.map((key) => {
    const row = saved.get(key);
    return {
      eventKey: key,
      inAppEnabled: row?.inAppEnabled ?? true,
      emailEnabled: row?.emailEnabled ?? true,
    };
  });

  return { access, preferences };
}

export async function bulkUpdateNotificationPreferencesForUser(
  userId: string,
  patch: { inAppEnabled?: boolean; emailEnabled?: boolean },
): Promise<void> {
  const access = await getNotificationsModuleAccessForUser(userId);
  if (!access) throw new Error("No active organization found.");

  // Upsert a row for every known event key
  await Promise.all(
    ALL_EVENT_KEYS.map((eventKey) =>
      db
        .insert(notificationPreferences)
        .values({
          id: crypto.randomUUID(),
          organizationId: access.organizationId,
          userId,
          eventKey,
          inAppEnabled: patch.inAppEnabled ?? true,
          emailEnabled: patch.emailEnabled ?? true,
        })
        .onConflictDoUpdate({
          target: [
            notificationPreferences.organizationId,
            notificationPreferences.userId,
            notificationPreferences.eventKey,
          ],
          set: {
            ...(patch.inAppEnabled !== undefined && { inAppEnabled: patch.inAppEnabled }),
            ...(patch.emailEnabled !== undefined && { emailEnabled: patch.emailEnabled }),
            updatedAt: new Date(),
          },
        }),
    ),
  );
}

export async function updateNotificationPreferenceForUser(
  userId: string,
  eventKey: NotificationEventKey,
  patch: { inAppEnabled?: boolean; emailEnabled?: boolean },
): Promise<void> {
  const access = await getNotificationsModuleAccessForUser(userId);
  if (!access) throw new Error("No active organization found.");

  await db
    .insert(notificationPreferences)
    .values({
      id: crypto.randomUUID(),
      organizationId: access.organizationId,
      userId,
      eventKey,
      inAppEnabled: patch.inAppEnabled ?? true,
      emailEnabled: patch.emailEnabled ?? true,
    })
    .onConflictDoUpdate({
      target: [
        notificationPreferences.organizationId,
        notificationPreferences.userId,
        notificationPreferences.eventKey,
      ],
      set: {
        inAppEnabled: patch.inAppEnabled !== undefined
          ? patch.inAppEnabled
          : notificationPreferences.inAppEnabled,
        emailEnabled: patch.emailEnabled !== undefined
          ? patch.emailEnabled
          : notificationPreferences.emailEnabled,
        updatedAt: new Date(),
      },
    });
}

// ─── Push subscriptions ───────────────────────────────────────────────────────

export async function savePushSubscriptionForUser(
  userId: string,
  sub: { endpoint: string; p256dh: string; auth: string },
): Promise<void> {
  const access = await getNotificationsModuleAccessForUser(userId);
  if (!access) throw new Error("No active organization found.");

  // Upsert by endpoint (same device may re-subscribe)
  await db
    .insert(pushSubscriptions)
    .values({
      id: crypto.randomUUID(),
      userId,
      organizationId: access.organizationId,
      endpoint: sub.endpoint,
      p256dh: sub.p256dh,
      auth: sub.auth,
    })
    .onConflictDoNothing();
}

export async function deletePushSubscriptionForUser(
  userId: string,
  endpoint: string,
): Promise<void> {
  await db
    .delete(pushSubscriptions)
    .where(
      and(
        eq(pushSubscriptions.userId, userId),
        eq(pushSubscriptions.endpoint, endpoint),
      ),
    );
}

// ─── Send push to all user devices ───────────────────────────────────────────

export async function sendPushNotificationsToUser(
  userId: string,
  organizationId: string,
  payload: PushPayload,
): Promise<void> {
  const subs = await db
    .select()
    .from(pushSubscriptions)
    .where(
      and(
        eq(pushSubscriptions.userId, userId),
        eq(pushSubscriptions.organizationId, organizationId),
      ),
    );

  await Promise.allSettled(
    subs.map((sub) => sendPushToSubscription(sub, payload)),
  );
}

// ─── Create in-app notification ───────────────────────────────────────────────

export async function createNotificationForUser(opts: {
  organizationId: string;
  userId: string;
  type: string;
  title: string;
  body?: string;
  data?: Record<string, unknown>;
}): Promise<void> {
  await db.insert(notifications).values({
    id: crypto.randomUUID(),
    organizationId: opts.organizationId,
    userId: opts.userId,
    type: opts.type,
    title: opts.title,
    body: opts.body ?? null,
    data: opts.data ?? null,
    isRead: false,
  });
}

// ─── Get org member IDs ───────────────────────────────────────────────────────

export async function getOrgMemberUserIds(
  organizationId: string,
  excludeUserId?: string,
): Promise<string[]> {
  const rows = await db
    .select({ userId: organizationMemberships.userId })
    .from(organizationMemberships)
    .where(
      and(
        eq(organizationMemberships.organizationId, organizationId),
        eq(organizationMemberships.status, "active"),
      ),
    );

  return rows
    .map((r) => r.userId)
    .filter((id) => id !== excludeUserId);
}

// ─── Central dispatch ─────────────────────────────────────────────────────────

/**
 * Dispatch an in-app + push notification to one or more recipients.
 * Respects per-user inAppEnabled preference. Fire-and-forget safe.
 */
export async function dispatchNotification(opts: {
  organizationId: string;
  recipientUserIds: string[];
  eventKey: NotificationEventKey;
  title: string;
  body?: string;
  url?: string;
  data?: Record<string, unknown>;
}): Promise<void> {
  if (opts.recipientUserIds.length === 0) return;

  // Load saved preferences for these users + this event in one query
  const savedPrefs = await db
    .select({
      userId: notificationPreferences.userId,
      inAppEnabled: notificationPreferences.inAppEnabled,
      emailEnabled: notificationPreferences.emailEnabled,
    })
    .from(notificationPreferences)
    .where(
      and(
        eq(notificationPreferences.organizationId, opts.organizationId),
        eq(notificationPreferences.eventKey, opts.eventKey),
        inArray(notificationPreferences.userId, opts.recipientUserIds),
      ),
    );

  const prefMap = new Map(savedPrefs.map((p) => [p.userId, p]));

  // Determine who gets in-app notifications (default true if no saved pref)
  const inAppRecipients = opts.recipientUserIds.filter(
    (id) => prefMap.get(id)?.inAppEnabled !== false,
  );

  // Determine who gets email notifications (default true if no saved pref)
  const emailRecipientIds = opts.recipientUserIds.filter(
    (id) => prefMap.get(id)?.emailEnabled !== false,
  );

  // Bulk insert in-app notifications
  if (inAppRecipients.length > 0) {
    await db.insert(notifications).values(
      inAppRecipients.map((userId) => ({
        id: crypto.randomUUID(),
        organizationId: opts.organizationId,
        userId,
        type: opts.eventKey,
        title: opts.title,
        body: opts.body ?? null,
        actionUrl: opts.url ?? null,
        data: opts.data ?? null,
        isRead: false,
      })),
    );

    // Push SSE event to all connected recipients so their UI updates instantly
    emitNotificationEvent(inAppRecipients);
  }

  // Send push to all recipients who have subscriptions (regardless of inApp pref)
  if (opts.recipientUserIds.length > 0) {
    const subs = await db
      .select()
      .from(pushSubscriptions)
      .where(
        and(
          eq(pushSubscriptions.organizationId, opts.organizationId),
          inArray(pushSubscriptions.userId, opts.recipientUserIds),
        ),
      );

    await Promise.allSettled(
      subs.map((sub) =>
        sendPushToSubscription(sub, {
          title: opts.title,
          body: opts.body ?? "",
          url: opts.url ?? "/notifications",
        }),
      ),
    );
  }

  // Send email notifications to email-enabled recipients
  if (emailRecipientIds.length > 0) {
    const emailUsers = await db
      .select({ id: userTable.id, name: userTable.name, email: userTable.email })
      .from(userTable)
      .where(inArray(userTable.id, emailRecipientIds));

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
    const actionUrl = opts.url
      ? opts.url.startsWith("http")
        ? opts.url
        : `${appUrl}${opts.url}`
      : undefined;

    await Promise.allSettled(
      emailUsers.map((u) =>
        sendGenericNotification(u.email, {
          recipient_name: u.name,
          title: opts.title,
          body: opts.body,
          action_url: actionUrl,
        }),
      ),
    );
  }
}
