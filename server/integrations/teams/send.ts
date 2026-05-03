import "server-only";

import { getTeamsIntegration } from "./repository";
import { postToPowerAutomate } from "./client";

/**
 * Top-level helper for "deliver this Adaptive Card payload to the org's
 * connected Teams channel, if any." Safe to call unconditionally - bails
 * silently when the org has no Teams integration or it has been disabled.
 *
 * `payload` is sent verbatim. Build it with the helpers in `./payloads.ts`
 * (`buildSimpleMessage`, `buildTaskCard`).
 */
export type TeamsDeliveryResult = { delivered: boolean; reason?: string };

export async function sendTeamsMessage(
  organizationId: string,
  payload: Record<string, unknown>,
): Promise<TeamsDeliveryResult> {
  const integration = await getTeamsIntegration(organizationId);
  if (!integration) return { delivered: false, reason: "no_integration" };
  if (!integration.enabled) return { delivered: false, reason: "disabled" };
  if (!integration.config.webhookUrl) return { delivered: false, reason: "no_webhook_url" };

  const result = await postToPowerAutomate({
    webhookUrl: integration.config.webhookUrl,
    payload,
  });

  if (!result.ok) {
    return { delivered: false, reason: `teams_${result.status}_${result.body.slice(0, 80)}` };
  }
  return { delivered: true };
}
