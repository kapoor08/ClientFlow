import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import { emailSuppressions } from "@/db/schema";

export type SuppressionReason = "unsubscribe" | "bounce" | "complaint";

export async function isSuppressed(email: string): Promise<boolean> {
  const rows = await db
    .select({ email: emailSuppressions.email })
    .from(emailSuppressions)
    .where(eq(emailSuppressions.email, email.toLowerCase()))
    .limit(1);
  return rows.length > 0;
}

export async function addSuppression(opts: {
  email: string;
  reason: SuppressionReason;
  source?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await db
    .insert(emailSuppressions)
    .values({
      email: opts.email.toLowerCase(),
      reason: opts.reason,
      source: opts.source,
      metadata: opts.metadata,
    })
    .onConflictDoNothing();
}

export async function removeSuppression(email: string): Promise<void> {
  await db.delete(emailSuppressions).where(eq(emailSuppressions.email, email.toLowerCase()));
}
