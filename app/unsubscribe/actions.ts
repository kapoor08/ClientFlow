"use server";

import { verifyUnsubscribeToken } from "@/server/email/unsubscribe-token";
import { addSuppression, removeSuppression } from "@/server/email/suppressions";
import { logger } from "@/server/observability/logger";

type ActionResult = { ok: true } | { ok: false; error: string };

export async function unsubscribeAction(token: string): Promise<ActionResult> {
  const email = verifyUnsubscribeToken(token);
  if (!email) return { ok: false, error: "Invalid token." };

  try {
    await addSuppression({
      email,
      reason: "unsubscribe",
      source: "user-click",
    });
    logger.info("email.unsubscribe", { emailHash: hashEmail(email) });
    return { ok: true };
  } catch (err) {
    logger.error("email.unsubscribe.failed", err, {
      emailHash: hashEmail(email),
    });
    return { ok: false, error: "Could not record unsubscribe. Please retry." };
  }
}

export async function resubscribeAction(token: string): Promise<ActionResult> {
  const email = verifyUnsubscribeToken(token);
  if (!email) return { ok: false, error: "Invalid token." };

  try {
    await removeSuppression(email);
    logger.info("email.resubscribe", { emailHash: hashEmail(email) });
    return { ok: true };
  } catch (err) {
    logger.error("email.resubscribe.failed", err, {
      emailHash: hashEmail(email),
    });
    return { ok: false, error: "Could not resubscribe. Please retry." };
  }
}

/**
 * Log only a short hash of the email - we don't want raw addresses in Vercel
 * logs / Sentry breadcrumbs, but we do want enough to correlate support tickets.
 */
function hashEmail(email: string): string {
  let h = 5381;
  for (let i = 0; i < email.length; i++) {
    h = (h * 33) ^ email.charCodeAt(i);
  }
  return (h >>> 0).toString(36);
}
