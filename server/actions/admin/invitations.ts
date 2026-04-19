"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getServerSession } from "@/server/auth/session";
import { bulkRevokeInvitations } from "@/server/admin/invitations";

function unauthorized() {
  return { error: "Unauthorized." };
}

async function requirePlatformAdmin() {
  const session = await getServerSession();
  if (!session?.user?.isPlatformAdmin) return null;
  return session;
}

const bulkRevokeSchema = z.object({
  invitationIds: z
    .array(z.string().min(1))
    .min(1, "Select at least one invitation.")
    .max(200),
});

export async function bulkRevokeInvitationsAction(
  values: unknown,
): Promise<{ error?: string; count?: number }> {
  const session = await requirePlatformAdmin();
  if (!session) return unauthorized();

  const parsed = bulkRevokeSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const count = await bulkRevokeInvitations(parsed.data.invitationIds, session.user.id);
  revalidatePath("/admin/invitations");
  return { count };
}
