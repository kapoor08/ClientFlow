"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "@/server/auth/session";
import {
  suspendOrganization,
  restoreOrganization,
  deleteOrganization,
  forceLogoutAllOrgMembers,
} from "@/server/admin/organizations";
import {
  suspendOrgSchema,
  deleteOrgSchema,
} from "@/schemas/admin/organizations";

function unauthorized() {
  return { error: "Unauthorized." };
}

async function requirePlatformAdmin() {
  const session = await getServerSession();
  if (!session?.user?.isPlatformAdmin) return null;
  return session;
}

export async function suspendOrgAction(
  orgId: string,
  reason: string,
): Promise<{ error?: string }> {
  const session = await requirePlatformAdmin();
  if (!session) return unauthorized();

  const parsed = suspendOrgSchema.safeParse({ orgId, reason });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  await suspendOrganization(orgId, reason, session.user.id);
  revalidatePath("/admin/organizations");
  revalidatePath(`/admin/organizations/${orgId}`);
  return {};
}

export async function restoreOrgAction(orgId: string): Promise<{ error?: string }> {
  const session = await requirePlatformAdmin();
  if (!session) return unauthorized();

  await restoreOrganization(orgId, session.user.id);
  revalidatePath("/admin/organizations");
  revalidatePath(`/admin/organizations/${orgId}`);
  return {};
}

export async function deleteOrgAction(
  orgId: string,
  orgName: string,
  confirmName: string,
): Promise<{ error?: string }> {
  const session = await requirePlatformAdmin();
  if (!session) return unauthorized();

  const parsed = deleteOrgSchema.safeParse({ orgId, orgName, confirmName });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  await deleteOrganization(orgId, session.user.id);
  revalidatePath("/admin/organizations");
  return {};
}

export async function forceLogoutOrgMembersAction(
  orgId: string,
): Promise<{ error?: string; count?: number }> {
  const session = await requirePlatformAdmin();
  if (!session) return unauthorized();

  await forceLogoutAllOrgMembers(orgId, session.user.id);
  revalidatePath(`/admin/organizations/${orgId}`);
  return {};
}
