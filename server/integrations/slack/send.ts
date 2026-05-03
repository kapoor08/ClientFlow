import "server-only";

import { getSlackIntegration } from "./repository";
import { postToIncomingWebhook } from "./client";

/**
 * Top-level helper for "deliver this Slack payload to the org's workspace,
 * if connected." Safe to call unconditionally - bails silently when the org
 * has no Slack integration or it has been disabled.
 *
 * `payload` is sent verbatim as the Slack incoming-webhook body. Build it
 * with the helpers in `./payloads.ts` (`buildSimpleMessage`, `buildTaskCard`)
 * rather than constructing inline.
 */
export type SlackDeliveryResult = { delivered: boolean; reason?: string };

export async function sendSlackMessage(
  organizationId: string,
  payload: Record<string, unknown>,
): Promise<SlackDeliveryResult> {
  const integration = await getSlackIntegration(organizationId);
  if (!integration) return { delivered: false, reason: "no_integration" };
  if (!integration.enabled) return { delivered: false, reason: "disabled" };
  if (!integration.config.webhookUrl) return { delivered: false, reason: "no_webhook_url" };

  const result = await postToIncomingWebhook({
    webhookUrl: integration.config.webhookUrl,
    payload,
  });

  if (!result.ok) {
    return { delivered: false, reason: `slack_${result.status}_${result.body.slice(0, 80)}` };
  }
  return { delivered: true };
}
