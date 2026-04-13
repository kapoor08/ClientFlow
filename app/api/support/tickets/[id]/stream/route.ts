import { type NextRequest } from "next/server";
import { and, eq, gte } from "drizzle-orm";
import { db } from "@/server/db/client";
import { supportTicketMessages, supportTickets } from "@/db/schema";
import { user } from "@/db/auth-schema";
import { getServerSession } from "@/server/auth/session";
import { getOrganizationSettingsContextForUser } from "@/server/organization-settings";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: ticketId } = await params;
  const session = await getServerSession();

  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Verify access: admin OR member of the ticket's org
  const isAdmin = session.user.isPlatformAdmin;

  if (!isAdmin) {
    const ctx = await getOrganizationSettingsContextForUser(session.user.id);
    if (!ctx || ctx.roleKey !== "client") {
      return new Response("Forbidden", { status: 403 });
    }
    // Verify ticket belongs to user's org
    const [ticket] = await db
      .select({ organizationId: supportTickets.organizationId })
      .from(supportTickets)
      .where(eq(supportTickets.id, ticketId));
    if (!ticket || ticket.organizationId !== ctx.organizationId) {
      return new Response("Forbidden", { status: 403 });
    }
  }

  const sinceParam = new URL(req.url).searchParams.get("since");
  let lastCheck = sinceParam ? new Date(sinceParam) : new Date(0);

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: string) => {
        try {
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        } catch {
          // client disconnected
        }
      };

      const keepalive = () => {
        try {
          controller.enqueue(encoder.encode(": keepalive\n\n"));
        } catch {
          // ignore
        }
      };

      while (!req.signal.aborted) {
        await new Promise((resolve) => setTimeout(resolve, 3000));
        if (req.signal.aborted) break;

        try {
          const conditions = [
            eq(supportTicketMessages.ticketId, ticketId),
            gte(supportTicketMessages.createdAt, lastCheck),
          ];

          if (!isAdmin) {
            conditions.push(eq(supportTicketMessages.isInternal, false));
          }

          const messages = await db
            .select({
              id: supportTicketMessages.id,
              authorName: user.name,
              authorRole: supportTicketMessages.authorRole,
              body: supportTicketMessages.body,
              createdAt: supportTicketMessages.createdAt,
            })
            .from(supportTicketMessages)
            .leftJoin(user, eq(user.id, supportTicketMessages.authorUserId))
            .where(and(...conditions))
            .orderBy(supportTicketMessages.createdAt);

          if (messages.length > 0) {
            lastCheck = new Date();
            for (const msg of messages) {
              send(JSON.stringify(msg));
            }
          } else {
            keepalive();
          }
        } catch {
          break;
        }
      }

      try {
        controller.close();
      } catch {
        // already closed
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
