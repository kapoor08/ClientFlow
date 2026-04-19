"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "@/server/auth/session";
import {
  suspendOrganization,
  restoreOrganization,
  deleteOrganization,
  forceLogoutAllOrgMembers,
  bulkSuspendOrganizations,
  bulkRestoreOrganizations,
} from "@/server/admin/organizations";
import {
  suspendOrgSchema,
  deleteOrgSchema,
} from "@/schemas/admin/organizations";
import { z } from "zod";

const bulkSuspendSchema = z.object({
  orgIds: z.array(z.string().min(1)).min(1, "Select at least one organization.").max(100),
  reason: z.string().trim().min(3, "Reason is required.").max(500),
});

const bulkRestoreSchema = z.object({
  orgIds: z.array(z.string().min(1)).min(1, "Select at least one organization.").max(100),
});

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

export async function bulkSuspendOrgsAction(
  values: unknown,
): Promise<{ error?: string; count?: number }> {
  const session = await requirePlatformAdmin();
  if (!session) return unauthorized();

  const parsed = bulkSuspendSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const count = await bulkSuspendOrganizations(
    parsed.data.orgIds,
    parsed.data.reason,
    session.user.id,
  );
  revalidatePath("/admin/organizations");
  return { count };
}

export async function bulkRestoreOrgsAction(
  values: unknown,
): Promise<{ error?: string; count?: number }> {
  const session = await requirePlatformAdmin();
  if (!session) return unauthorized();

  const parsed = bulkRestoreSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const count = await bulkRestoreOrganizations(parsed.data.orgIds, session.user.id);
  revalidatePath("/admin/organizations");
  return { count };
}
