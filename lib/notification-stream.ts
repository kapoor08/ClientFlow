/**
 * Notification streaming via Upstash Redis pub/sub.
 *
 * - PUBLISH: @upstash/redis (HTTP REST) - works in any serverless function.
 * - SUBSCRIBE: ioredis (TCP) - used only inside the SSE streaming route,
 *   which keeps the connection open for the duration of the request.
 */

import { Redis } from "@upstash/redis";

const publisher = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export const notifChannel = (userId: string) => `cf:notif:${userId}`;

/**
 * Publish a "new_notification" signal to all connected SSE clients for the
 * given user IDs. Fire-and-forget - does not block the caller.
 */
export function emitNotificationEvent(userIds: string[]): void {
  for (const userId of userIds) {
    publisher
      .publish(notifChannel(userId), "new_notification")
      .catch(console.error);
  }
}
