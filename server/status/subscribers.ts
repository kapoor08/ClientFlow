import "server-only";

import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import { statusSubscribers } from "@/db/schema";
import { isSuppressed } from "@/server/email/suppressions";

const VERIFICATION_TTL_HOURS = 24;

export class SubscriberError extends Error {
  constructor(
    message: string,
    public readonly code: "suppressed" | "already_verified" | "internal" = "internal",
  ) {
    super(message);
    this.name = "SubscriberError";
  }
}

/**
 * Create a new subscriber row (or refresh the verification token on an
 * existing unverified row). Returns the verification token the caller can
 * embed in the confirm email.
 *
 * Throws `SubscriberError("suppressed")` if the email is on the global
 * suppression list - we honor previous unsubscribes / bounces / complaints
 * even on the public form.
 *
 * Returns `alreadyVerified: true` (with empty token) when the address has
 * an active verified subscription - the API layer can then return a
 * "you're already subscribed" response instead of sending a duplicate
 * verification email.
 */
export async function createOrRefreshSubscriber(
  email: string,
): Promise<{ verificationToken: string; alreadyVerified: boolean }> {
  const normalized = email.toLowerCase().trim();

  if (await isSuppressed(normalized)) {
    throw new SubscriberError(
      "This email is on our suppression list and can't be subscribed.",
      "suppressed",
    );
  }

  const [existing] = await db
    .select({
      id: statusSubscribers.id,
      verifiedAt: statusSubscribers.verifiedAt,
    })
    .from(statusSubscribers)
    .where(eq(statusSubscribers.email, normalized))
    .limit(1);

  if (existing?.verifiedAt) {
    return { verificationToken: "", alreadyVerified: true };
  }

  const verificationToken = randomBytes(32).toString("base64url");
  const verificationExpiresAt = new Date(Date.now() + VERIFICATION_TTL_HOURS * 3600 * 1000);

  if (existing) {
    await db
      .update(statusSubscribers)
      .set({ verificationToken, verificationExpiresAt })
      .where(eq(statusSubscribers.id, existing.id));
  } else {
    await db.insert(statusSubscribers).values({
      id: crypto.randomUUID(),
      email: normalized,
      verificationToken,
      verificationExpiresAt,
    });
  }

  return { verificationToken, alreadyVerified: false };
}

/**
 * Resolve a verification token to a subscriber and mark them verified.
 * One-shot: token is cleared on success so the link can't be replayed.
 * Returns null on invalid / expired tokens.
 */
export async function verifySubscriberByToken(token: string): Promise<{ email: string } | null> {
  if (!token || typeof token !== "string") return null;

  const [row] = await db
    .select()
    .from(statusSubscribers)
    .where(eq(statusSubscribers.verificationToken, token))
    .limit(1);

  if (!row) return null;
  if (!row.verificationExpiresAt || row.verificationExpiresAt.getTime() < Date.now()) {
    return null;
  }

  await db
    .update(statusSubscribers)
    .set({
      verifiedAt: new Date(),
      verificationToken: null,
      verificationExpiresAt: null,
    })
    .where(eq(statusSubscribers.id, row.id));

  return { email: row.email };
}

/**
 * Hard delete on unsubscribe - rows here are public, unauthenticated
 * subscriptions, not user accounts. No tombstone required.
 */
export async function unsubscribeStatusByEmail(email: string): Promise<void> {
  const normalized = email.toLowerCase().trim();
  await db.delete(statusSubscribers).where(eq(statusSubscribers.email, normalized));
}
