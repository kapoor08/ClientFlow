import "server-only";

import { broadcastTaskActivityToSlack } from "./slack/broadcasts";
// Microsoft Teams provider is built but disabled for now - testing requires
// a Microsoft 365 work account (personal/free accounts can't create the
// Power Automate flows the integration depends on). To re-enable: uncomment
// the import, the Teams arm in Promise.allSettled below, and the
// TeamsIntegrationCard render in app/(protected)/settings/integrations.
// import { broadcastTaskActivityToTeams } from "./teams/broadcasts";
import type { TaskBroadcastEvent } from "./broadcasts-types";

export type { TaskBroadcastBase, TaskBroadcastEvent } from "./broadcasts-types";

/**
 * Fan a single task event out to every connected outbound channel for the
 * org. Each provider is self-gated - if the org doesn't have a given
 * provider connected, that arm is a cheap no-op (one DB read).
 *
 * Runs the channels in parallel and swallows individual failures so one
 * provider being down doesn't block delivery to the others.
 */
export async function broadcastTaskActivity(event: TaskBroadcastEvent): Promise<void> {
  await Promise.allSettled([
    broadcastTaskActivityToSlack(event),
    // broadcastTaskActivityToTeams(event),
  ]);
}
