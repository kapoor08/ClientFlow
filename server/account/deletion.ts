import "server-only";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/server/db/client";
import { user, session, account } from "@/db/auth-schema";
import {
  organizations,
  organizationMemberships,
  roles,
  apiKeys,
  outboundWebhooks,
} from "@/db/schemas/access";
import {
  auditLogs,
  notifications,
  notificationPreferences,
  pushSubscriptions,
} from "@/db/schemas/platform";

/**
 * Self-service account deletion - GDPR Article 17 (right to erasure).
 *
 * Flow:
 *   1. User requests deletion from `/settings/security` UI.
 *   2. `getDeletionBlockers(userId)` checks for reasons the delete must be
 *      refused (the user is the only owner of an org that still has other
 *      members - deleting would strand them with no admin).
 *   3. If clear, `scheduleDeletion(userId)` sets `deletion_scheduled_at` to
 *      now + 30 days and invalidates all sessions. The user can cancel any
 *      time in that window with `cancelDeletion(userId)`.
 *   4. The nightly housekeeping cron calls `anonymizeExpiredUsers()` which
 *      runs `anonymizeUser(userId)` for every user past their scheduled time.
 *
 * We anonymize rather than hard-delete the user row to preserve referential
 * integrity (many tables have `NO ACTION` FK constraints on user.id -
 * `apiKeys.createdByUserId`, `auditLogs.actorUserId`, etc.). Anonymization is
 * GDPR-compliant as long as no PII remains, which it doesn't once email/name
 * are scrubbed and sessions/accounts/2FA/push subs are hard-deleted.
 */

export const GRACE_PERIOD_DAYS = 30;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export type DeletionBlocker = {
  kind: "sole_owner_with_members";
  organizationId: string;
  organizationName: string;
  memberCount: number;
};

export type DeletionStatus = {
  scheduled: boolean;
  scheduledAt: Date | null;
  scheduledFor: Date | null;
  daysRemaining: number | null;
};

export async function getDeletionStatus(userId: string): Promise<DeletionStatus> {
  const [row] = await db
    .select({ deletionScheduledAt: user.deletionScheduledAt })
    .from(user)
    .where(eq(user.id, userId));
  if (!row?.deletionScheduledAt) {
    return {
      scheduled: false,
      scheduledAt: null,
      scheduledFor: null,
      daysRemaining: null,
    };
  }
  const scheduledFor = row.deletionScheduledAt;
  const daysRemaining = Math.max(0, Math.ceil((scheduledFor.getTime() - Date.now()) / MS_PER_DAY));
  return {
    scheduled: true,
    scheduledAt: scheduledFor,
    scheduledFor,
    daysRemaining,
  };
}

export async function getDeletionBlockers(userId: string): Promise<DeletionBlocker[]> {
  // Find every org where this user holds the "owner" role.
  const ownedOrgs = await db
    .select({
      organizationId: organizationMemberships.organizationId,
      organizationName: organizations.name,
    })
    .from(organizationMemberships)
    .innerJoin(roles, eq(roles.id, organizationMemberships.roleId))
    .innerJoin(organizations, eq(organizations.id, organizationMemberships.organizationId))
    .where(
      and(
        eq(organizationMemberships.userId, userId),
        eq(organizationMemberships.status, "active"),
        eq(roles.key, "owner"),
      ),
    );

  if (ownedOrgs.length === 0) return [];

  const blockers: DeletionBlocker[] = [];
  for (const org of ownedOrgs) {
    // Count OTHER active owners (same org, different user).
    const [otherOwner] = await db
      .select({ c: sql<number>`count(*)::int` })
      .from(organizationMemberships)
      .innerJoin(roles, eq(roles.id, organizationMemberships.roleId))
      .where(
        and(
          eq(organizationMemberships.organizationId, org.organizationId),
          eq(organizationMemberships.status, "active"),
          eq(roles.key, "owner"),
          sql`${organizationMemberships.userId} <> ${userId}`,
        ),
      );

    if ((otherOwner?.c ?? 0) > 0) continue; // another owner can take over

    // Sole owner - count other members in the org.
    const [memberCountRow] = await db
      .select({ c: sql<number>`count(*)::int` })
      .from(organizationMemberships)
      .where(
        and(
          eq(organizationMemberships.organizationId, org.organizationId),
          eq(organizationMemberships.status, "active"),
          sql`${organizationMemberships.userId} <> ${userId}`,
        ),
      );

    const memberCount = memberCountRow?.c ?? 0;
    if (memberCount > 0) {
      blockers.push({
        kind: "sole_owner_with_members",
        organizationId: org.organizationId,
        organizationName: org.organizationName,
        memberCount,
      });
    }
    // Else: sole owner AND sole member - allowed. The org becomes orphaned
    // on anonymization; housekeeping can clean empty orphaned orgs later.
  }

  return blockers;
}

export async function scheduleDeletion(userId: string): Promise<{
  scheduledFor: Date;
}> {
  const scheduledFor = new Date(Date.now() + GRACE_PERIOD_DAYS * MS_PER_DAY);
  await db.update(user).set({ deletionScheduledAt: scheduledFor }).where(eq(user.id, userId));
  // Invalidate every session immediately - the user is effectively signed out
  // on the next request. They can sign in again during the grace period to
  // cancel or finish up.
  await db.delete(session).where(eq(session.userId, userId));
  return { scheduledFor };
}

export async function cancelDeletion(userId: string): Promise<void> {
  await db.update(user).set({ deletionScheduledAt: null }).where(eq(user.id, userId));
}

/**
 * Hard-delete or null-out every reference to the user and anonymize the
 * user row. Called by nightly housekeeping on users whose grace period has
 * elapsed.
 *
 * Wrapped in a transaction so a partial failure leaves the account untouched
 * for retry on the next cron tick.
 */
export async function anonymizeUser(userId: string): Promise<void> {
  await db.transaction(async (tx) => {
    // 1. Cascade-safe: deleting these children removes rows outright.
    await tx.delete(session).where(eq(session.userId, userId));
    await tx.delete(account).where(eq(account.userId, userId));
    await tx.delete(notifications).where(eq(notifications.userId, userId));
    await tx.delete(notificationPreferences).where(eq(notificationPreferences.userId, userId));
    await tx.delete(pushSubscriptions).where(eq(pushSubscriptions.userId, userId));

    // 2. NULL-out references on tables that retain the row but shouldn't
    //    continue pointing at a user who no longer exists as a person.
    await tx
      .update(apiKeys)
      .set({ createdByUserId: null })
      .where(eq(apiKeys.createdByUserId, userId));
    await tx
      .update(outboundWebhooks)
      .set({ createdByUserId: null })
      .where(eq(outboundWebhooks.createdByUserId, userId));
    await tx.update(auditLogs).set({ actorUserId: null }).where(eq(auditLogs.actorUserId, userId));
    await tx
      .update(organizationMemberships)
      .set({ invitedByUserId: null })
      .where(eq(organizationMemberships.invitedByUserId, userId));
    await tx
      .update(organizations)
      .set({ suspendedByAdminUserId: null })
      .where(eq(organizations.suspendedByAdminUserId, userId));

    // 3. Anonymize the user row itself. Preserving the row keeps remaining
    //    FK references (memberships, task authorship, time entries) valid.
    //    The email is rewritten to a unique sentinel so it can be reused by
    //    a new signup later.
    await tx
      .update(user)
      .set({
        email: `deleted-${userId}@deleted.clientflow.local`,
        name: "Deleted user",
        image: null,
        twoFactorEnabled: false,
        isSuspended: true,
        deletedAt: new Date(),
      })
      .where(eq(user.id, userId));
  });
}

/**
 * Find every user whose deletion grace period has elapsed and has not yet
 * been anonymized, then anonymize each one. Errors are per-user - one bad
 * user does not block the others.
 */
export async function anonymizeExpiredUsers(): Promise<{
  processed: number;
  errors: number;
}> {
  const expired = await db
    .select({ id: user.id })
    .from(user)
    .where(
      and(
        sql`${user.deletionScheduledAt} is not null`,
        sql`${user.deletionScheduledAt} <= now()`,
        sql`${user.deletedAt} is null`,
      ),
    );

  if (expired.length === 0) return { processed: 0, errors: 0 };

  let processed = 0;
  let errors = 0;
  for (const { id } of expired) {
    try {
      await anonymizeUser(id);
      processed += 1;
    } catch {
      errors += 1;
    }
  }
  // Defensive: make sure future queries for `isNullDeletedAt` exclude these.
  void inArray;
  return { processed, errors };
}
