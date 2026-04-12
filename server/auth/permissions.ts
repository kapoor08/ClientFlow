import { eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import { organizationSettings } from "@/db/schema";
import {
  resolveRolePermissions,
  type RolePermissionsConfig,
} from "@/config/role-permissions";
import { getOrganizationSettingsContextForUser } from "@/server/organization-settings";
import { writeAuditLog } from "@/server/security/audit";

function createId() {
  return crypto.randomUUID();
}

export async function getRolePermissionsForOrg(
  organizationId: string,
): Promise<RolePermissionsConfig> {
  const rows = await db
    .select({ rolePermissionsConfig: organizationSettings.rolePermissionsConfig })
    .from(organizationSettings)
    .where(eq(organizationSettings.organizationId, organizationId))
    .limit(1);

  const saved = rows[0]?.rolePermissionsConfig as RolePermissionsConfig | null;
  return resolveRolePermissions(saved);
}

export async function updateRolePermissionsForUser(
  userId: string,
  config: RolePermissionsConfig,
): Promise<void> {
  const ctx = await getOrganizationSettingsContextForUser(userId);

  if (!ctx) throw new Error("No active organization found.");
  if (!ctx.canManageSettings)
    throw new Error("Only organization admins can update role permissions.");

  await db
    .insert(organizationSettings)
    .values({
      id: createId(),
      organizationId: ctx.organizationId,
      requireEmailVerification: ctx.requireEmailVerification,
      rolePermissionsConfig: config,
    })
    .onConflictDoUpdate({
      target: organizationSettings.organizationId,
      set: { rolePermissionsConfig: config, updatedAt: new Date() },
    });

  writeAuditLog({
    organizationId: ctx.organizationId,
    actorUserId: userId,
    action: "role_permissions.updated",
    entityType: "organization",
    entityId: ctx.organizationId,
  }).catch(console.error);
}
