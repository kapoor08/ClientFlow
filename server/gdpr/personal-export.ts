import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import { user, session, account } from "@/db/auth-schema";
import { organizationMemberships, apiKeys } from "@/db/schemas/access";
import { taskComments, taskAssignees, timeEntries } from "@/db/schemas/work";
import {
  auditLogs,
  notifications,
  notificationPreferences,
  pushSubscriptions,
  emailSuppressions,
} from "@/db/schemas/platform";

/**
 * Builds a JSON dump of every row in the database keyed to the given user -
 * satisfying GDPR Article 20 (right to data portability).
 *
 * Intentionally excluded from each table:
 *
 *   - `session.token`                    - bearer; would hand a session on a plate
 *   - `account.accessToken / refreshToken / idToken / password` - OAuth tokens and pw hash
 *   - `two_factor.secret / backupCodes`  - compromise the user's own 2FA
 *   - `api_keys.keyHash`                 - lets the key be reconstructed offline
 *   - `push_subscriptions.p256dh / auth` - push encryption keys
 *
 * Everything else that references the user (`user_id`, `actor_user_id`,
 * `author_user_id`, `created_by_user_id`, `assignee_user_id`) is returned.
 */

export type PersonalDataExport = {
  exportInfo: {
    version: 1;
    generatedAt: string;
    userId: string;
    note: string;
  };
  account: {
    user: unknown;
    sessions: unknown[];
    connectedAccounts: unknown[];
    organizationMemberships: unknown[];
    twoFactorEnabled: boolean;
  };
  preferences: {
    notificationPreferences: unknown[];
    pushSubscriptions: unknown[];
    emailSuppression: unknown | null;
  };
  activity: {
    notifications: unknown[];
    auditLogEntries: unknown[];
    apiKeys: unknown[];
  };
  work: {
    taskAssignments: unknown[];
    taskComments: unknown[];
    timeEntries: unknown[];
  };
};

export async function buildPersonalDataExport(userId: string): Promise<PersonalDataExport> {
  const [userRow] = await db.select().from(user).where(eq(user.id, userId));
  if (!userRow) {
    throw new Error(`User ${userId} not found.`);
  }

  const [
    sessions,
    connectedAccounts,
    memberships,
    userNotificationPrefs,
    userPushSubs,
    suppressionRows,
    userNotifications,
    userAuditLogs,
    userApiKeys,
    assignments,
    comments,
    timeRows,
  ] = await Promise.all([
    db
      .select({
        id: session.id,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        expiresAt: session.expiresAt,
        ipAddress: session.ipAddress,
        userAgent: session.userAgent,
      })
      .from(session)
      .where(eq(session.userId, userId)),
    db
      .select({
        id: account.id,
        providerId: account.providerId,
        accountId: account.accountId,
        scope: account.scope,
        createdAt: account.createdAt,
        updatedAt: account.updatedAt,
        accessTokenExpiresAt: account.accessTokenExpiresAt,
        refreshTokenExpiresAt: account.refreshTokenExpiresAt,
      })
      .from(account)
      .where(eq(account.userId, userId)),
    db.select().from(organizationMemberships).where(eq(organizationMemberships.userId, userId)),
    db.select().from(notificationPreferences).where(eq(notificationPreferences.userId, userId)),
    db
      .select({
        id: pushSubscriptions.id,
        organizationId: pushSubscriptions.organizationId,
        endpoint: pushSubscriptions.endpoint,
        createdAt: pushSubscriptions.createdAt,
      })
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.userId, userId)),
    db
      .select()
      .from(emailSuppressions)
      .where(eq(emailSuppressions.email, userRow.email.toLowerCase()))
      .limit(1),
    db.select().from(notifications).where(eq(notifications.userId, userId)),
    db.select().from(auditLogs).where(eq(auditLogs.actorUserId, userId)),
    db
      .select({
        id: apiKeys.id,
        organizationId: apiKeys.organizationId,
        name: apiKeys.name,
        keyPrefix: apiKeys.keyPrefix,
        lastUsedAt: apiKeys.lastUsedAt,
        expiresAt: apiKeys.expiresAt,
        revokedAt: apiKeys.revokedAt,
        createdAt: apiKeys.createdAt,
        updatedAt: apiKeys.updatedAt,
      })
      .from(apiKeys)
      .where(eq(apiKeys.createdByUserId, userId)),
    db.select().from(taskAssignees).where(eq(taskAssignees.userId, userId)),
    db.select().from(taskComments).where(eq(taskComments.authorUserId, userId)),
    db.select().from(timeEntries).where(eq(timeEntries.userId, userId)),
  ]);

  return {
    exportInfo: {
      version: 1,
      generatedAt: new Date().toISOString(),
      userId,
      note: "Security-sensitive fields (session tokens, OAuth tokens, 2FA secrets, API-key hashes, push-encryption keys) are intentionally omitted. Contact support if you need those for a specific purpose.",
    },
    account: {
      user: userRow,
      sessions,
      connectedAccounts,
      organizationMemberships: memberships,
      twoFactorEnabled: Boolean(userRow.twoFactorEnabled),
    },
    preferences: {
      notificationPreferences: userNotificationPrefs,
      pushSubscriptions: userPushSubs,
      emailSuppression: suppressionRows[0] ?? null,
    },
    activity: {
      notifications: userNotifications,
      auditLogEntries: userAuditLogs,
      apiKeys: userApiKeys,
    },
    work: {
      taskAssignments: assignments,
      taskComments: comments,
      timeEntries: timeRows,
    },
  };
}
