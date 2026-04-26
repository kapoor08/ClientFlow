import { eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import { organizationSettings } from "@/db/schema";
import {
  resolveMemberEffectivePermissions,
  resolveRolePermissions,
  type MemberPermissionOverrides,
  type ModulePermissions,
  type RolePermissionsConfig,
} from "@/config/role-permissions";
import { getOrganizationSettingsContextForUser } from "@/server/organization-settings";
import { writeAuditLog } from "@/server/security/audit";

function createId() {
  return crypto.randomUUID();
}

const FULL_PERMISSIONS: ModulePermissions = {
  visible: true,
  canCreate: true,
  canEdit: true,
  canDelete: true,
};

const NO_PERMISSIONS: ModulePermissions = {
  visible: false,
  canCreate: false,
  canEdit: false,
  canDelete: false,
};

/**
 * Resolves the effective `ModulePermissions` for a (role, org, member-override)
 * triple. Owner / admin always returns full access; everyone else is gated by
 * the org's saved `RolePermissionsConfig` (and optional per-member overrides).
 *
 * Use this as a defence-in-depth check inside mutating routes - the module
 * access helpers (`getClientModuleAccessForUser`, etc.) already gate writes,
 * but those helpers historically computed `canWrite` from `roleKey` alone.
 * Calling this helper directly forces a re-check against the role config so a
 * misconfigured / tampered context can never silently permit a mutation.
 */
export async function resolveModulePermissionsForUser(opts: {
  organizationId: string;
  roleKey: string | null;
  moduleKey: string;
  memberOverrides?: MemberPermissionOverrides | null;
}): Promise<ModulePermissions> {
  if (opts.roleKey === "owner" || opts.roleKey === "admin") {
    return FULL_PERMISSIONS;
  }
  if (!opts.roleKey) return NO_PERMISSIONS;

  const orgRoleConfig = await getRolePermissionsForOrg(opts.organizationId);
  const effective = resolveMemberEffectivePermissions(
    opts.roleKey,
    orgRoleConfig,
    opts.memberOverrides ?? null,
  );
  return effective[opts.moduleKey] ?? NO_PERMISSIONS;
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
