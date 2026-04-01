import IORedis from "ioredis";
import { requireAuth, apiErrorResponse } from "@/lib/api-helpers";
import { notifChannel } from "@/lib/notification-stream";

export const dynamic = "force-dynamic";
// Vercel Hobby: 60s max. Pro: 300s. Client auto-reconnects via EventSource.
export const maxDuration = 55;

export async function GET() {
  try {
    const { userId } = await requireAuth();
    const encoder = new TextEncoder();

    // One dedicated ioredis connection per SSE request (subscribe mode locks the
    // connection — it cannot be shared with the publisher).
    const subscriber = new IORedis(process.env.UPSTASH_REDIS_URL!, {
      tls: {},
      maxRetriesPerRequest: 1,
      enableReadyCheck: false,
    });

    let heartbeatTimer: ReturnType<typeof setInterval> | undefined;

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const send = (data: string) => {
          try {
            controller.enqueue(encoder.encode(data));
          } catch {
            // Stream already closed
          }
        };

        // Tell the client the connection is live
        send(`data: {"type":"connected"}\n\n`);

        // Heartbeat every 25s to prevent proxy/browser timeouts
        heartbeatTimer = setInterval(() => send(": heartbeat\n\n"), 25_000);

        subscriber.on("error", () => {
          clearInterval(heartbeatTimer);
          subscriber.disconnect();
        });

        await subscriber.subscribe(notifChannel(userId));

        subscriber.on("message", () => {
          send(`data: {"type":"new_notification"}\n\n`);
        });
      },

      cancel() {
        clearInterval(heartbeatTimer);
        subscriber.disconnect();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
