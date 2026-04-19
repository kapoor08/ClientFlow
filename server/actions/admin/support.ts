"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/server/db/client";
import { contactSubmissions, supportTickets } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { guardAdmin } from "@/server/auth/admin-guard";
import { getServerSession } from "@/server/auth/session";
import {
  addTicketMessage,
  assignTicket,
  updateTicketStatus,
} from "@/server/support";
import {
  adminReplySchema,
  assignTicketSchema,
  processContactSubmissionSchema,
  updateTicketStatusSchema,
} from "@/schemas/admin/support";

async function getAdminUserId(): Promise<string | null> {
  const session = await getServerSession();
  return session?.user?.isPlatformAdmin ? session.user.id : null;
}

export async function adminReplyAction(
  values: unknown,
): Promise<{ error?: string }> {
  const admin = await guardAdmin();
  if (!admin) return { error: "Forbidden" };

  const parsed = adminReplySchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const { ticketId, body, isInternal } = parsed.data;

  try {
    await addTicketMessage(ticketId, admin.user.id, "admin", body, isInternal);
    revalidatePath(`/admin/support/${ticketId}`);
    return {};
  } catch {
    return { error: "Failed to post reply." };
  }
}

export async function updateTicketStatusAction(
  values: unknown,
): Promise<{ error?: string }> {
  const admin = await guardAdmin();
  if (!admin) return { error: "Forbidden" };

  const parsed = updateTicketStatusSchema.safeParse(values);
  if (!parsed.success) return { error: "Invalid input" };

  const { ticketId, status } = parsed.data;

  try {
    await updateTicketStatus(ticketId, status, admin.user.id);
    revalidatePath(`/admin/support/${ticketId}`);
    revalidatePath("/admin/support");
    return {};
  } catch {
    return { error: "Failed to update status." };
  }
}

export async function assignTicketAction(
  values: unknown,
): Promise<{ error?: string }> {
  const admin = await guardAdmin();
  if (!admin) return { error: "Forbidden" };

  const parsed = assignTicketSchema.safeParse(values);
  if (!parsed.success) return { error: "Invalid input" };

  const { ticketId, adminUserId } = parsed.data;

  try {
    await assignTicket(ticketId, adminUserId, admin.user.id);
    revalidatePath(`/admin/support/${ticketId}`);
    return {};
  } catch {
    return { error: "Failed to assign ticket." };
  }
}

export async function processContactSubmissionAction(
  values: unknown,
): Promise<{ error?: string }> {
  const admin = await guardAdmin();
  if (!admin) return { error: "Forbidden" };

  const parsed = processContactSubmissionSchema.safeParse(values);
  if (!parsed.success) return { error: "Invalid input" };

  const { submissionId, notes } = parsed.data;

  try {
    await db
      .update(contactSubmissions)
      .set({
        status: "processed",
        processedByUserId: admin.user.id,
        notes: notes ?? null,
        processedAt: new Date(),
      })
      .where(eq(contactSubmissions.id, submissionId));

    revalidatePath("/admin/contact-submissions");
    return {};
  } catch {
    return { error: "Failed to process submission." };
  }
}
