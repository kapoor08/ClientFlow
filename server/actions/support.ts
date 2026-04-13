"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getServerSession } from "@/server/auth/session";
import { getOrganizationSettingsContextForUser } from "@/server/organization-settings";
import { addTicketMessage, createSupportTicket } from "@/server/support";
import { addMessageSchema, createTicketSchema } from "@/schemas/support";

async function getPortalContext() {
  const session = await getServerSession();
  if (!session?.user) return null;
  const ctx = await getOrganizationSettingsContextForUser(session.user.id);
  if (!ctx || ctx.roleKey !== "client") return null;
  return { userId: session.user.id, orgId: ctx.organizationId };
}

export async function createTicketAction(
  values: unknown,
): Promise<{ error?: string; id?: string }> {
  const ctx = await getPortalContext();
  if (!ctx) return { error: "Unauthorized" };

  const parsed = createTicketSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  try {
    const id = await createSupportTicket(ctx.userId, ctx.orgId, parsed.data);
    revalidatePath("/client-portal/support");
    return { id };
  } catch {
    return { error: "Failed to create ticket." };
  }
}

export async function replyToTicketAction(
  values: unknown,
): Promise<{ error?: string }> {
  const ctx = await getPortalContext();
  if (!ctx) return { error: "Unauthorized" };

  const parsed = addMessageSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const { ticketId, body } = parsed.data;

  try {
    await addTicketMessage(ticketId, ctx.userId, "user", body, false);
    revalidatePath(`/client-portal/support/${ticketId}`);
    return {};
  } catch {
    return { error: "Failed to send reply." };
  }
}
