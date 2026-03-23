import "server-only";
import webpush from "web-push";

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY!;
const vapidSubject = process.env.VAPID_SUBJECT ?? "mailto:admin@clientflow.io";

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
  icon?: string;
};

export type PushSubscriptionKeys = {
  endpoint: string;
  p256dh: string;
  auth: string;
};

export async function sendPushToSubscription(
  sub: PushSubscriptionKeys,
  payload: PushPayload,
): Promise<void> {
  await webpush.sendNotification(
    {
      endpoint: sub.endpoint,
      keys: { p256dh: sub.p256dh, auth: sub.auth },
    },
    JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: payload.icon ?? "/icon-192x192.png",
      badge: "/badge-72x72.png",
      data: { url: payload.url ?? "/" },
    }),
  );
}
