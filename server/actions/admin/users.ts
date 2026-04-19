"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getServerSession } from "@/server/auth/session";
import {
  bulkRevokeUserSessions,
  bulkDeleteUsers,
} from "@/server/admin/users";

function unauthorized() {
  return { error: "Unauthorized." };
}

async function requirePlatformAdmin() {
  const session = await getServerSession();
  if (!session?.user?.isPlatformAdmin) return null;
  return session;
}

const bulkRevokeSessionsSchema = z.object({
  userIds: z.array(z.string().min(1)).min(1, "Select at least one user.").max(200),
});

const bulkDeleteSchema = z.object({
  userIds: z.array(z.string().min(1)).min(1, "Select at least one user.").max(100),
});

export async function bulkRevokeUserSessionsAction(
  values: unknown,
): Promise<{ error?: string; count?: number }> {
  const session = await requirePlatformAdmin();
  if (!session) return unauthorized();

  const parsed = bulkRevokeSessionsSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const count = await bulkRevokeUserSessions(parsed.data.userIds, session.user.id);
  revalidatePath("/admin/users");
  return { count };
}

export async function bulkDeleteUsersAction(
  values: unknown,
): Promise<{ error?: string; count?: number }> {
  const session = await requirePlatformAdmin();
  if (!session) return unauthorized();

  const parsed = bulkDeleteSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  // Safety: never allow the admin to delete their own account in a bulk op
  const targetIds = parsed.data.userIds.filter((id) => id !== session.user.id);
  if (targetIds.length === 0) {
    return { error: "Cannot delete your own account." };
  }

  const count = await bulkDeleteUsers(targetIds, session.user.id);
  revalidatePath("/admin/users");
  return { count };
}
