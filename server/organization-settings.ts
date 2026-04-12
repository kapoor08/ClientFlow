import { and, asc, eq, ne } from "drizzle-orm";
import { getActiveOrgIdFromCookie } from "@/server/auth/active-org";
import { user } from "@/db/auth-schema";
import {
  organizationMemberships,
  organizations,
  organizationSettings,
  roles,
} from "@/db/schema";
import type { RolePermissionsConfig, MemberPermissionOverrides } from "@/config/role-permissions";
import { db } from "@/server/db/client";
import { writeAuditLog } from "@/server/security/audit";

const ACTIVE_MEMBERSHIP_STATUS = "active";
const MANAGE_SETTINGS_ROLE_KEYS = new Set(["owner", "admin"]);
const ROLE_DISPLAY_NAMES = {
  owner: "Owner",
  admin: "Admin",
  manager: "Manager",
  member: "Member",
  client: "Client",
} as const;

export type OrganizationRoleKey = keyof typeof ROLE_DISPLAY_NAMES;

export type OrganizationSettingsContext = {
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
  timezone: string | null;
  currencyCode: string | null;
  requireEmailVerification: boolean;
  logoUrl: string | null;
  brandColor: string | null;
  sessionTimeoutHours: number | null;
  ipAllowlist: string[] | null;
  ssoConfig: Record<string, unknown> | null;
  roleKey: string | null;
  canManageSettings: boolean;
  rolePermissionsConfig: RolePermissionsConfig | null;
  memberPermissionOverrides: MemberPermissionOverrides | null;
  onboardingCompletedAt: Date | null;
};

export function getOrganizationRoleLabel(roleKey: string | null) {
  if (!roleKey) {
    return "Account";
  }

  return ROLE_DISPLAY_NAMES[roleKey as OrganizationRoleKey] ?? "Account";
}

export function getWorkspaceHomeHrefForRole(roleKey: string | null) {
  switch (roleKey) {
    case "client":
      return "/client-portal";
    case "owner":
    case "admin":
    case "manager":
    case "member":
    default:
      return "/dashboard";
  }
}

type BootstrapWorkspaceInput = {
  id: string;
  name: string;
  email: string;
};

type UpdateOrganizationSettingsInput = {
  name: string;
  slug: string;
  timezone: string;
  currencyCode: string;
  requireEmailVerification: boolean;
};

type EmailVerificationPolicy = {
  userId: string | null;
  name: string;
  createdAt: Date | null;
  updatedAt: Date | null;
  emailVerified: boolean;
  requireEmailVerification: boolean;
};

function createId() {
  return crypto.randomUUID();
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 48);
}

function getDefaultOrganizationName(name: string, email: string) {
  const cleanName = name.trim();

  if (cleanName) {
    const firstName = cleanName.split(/\s+/)[0];
    return `${firstName}'s Workspace`;
  }

  const emailPrefix = email.split("@")[0]?.trim() || "clientflow";
  return `${emailPrefix}'s Workspace`;
}

async function ensureRole(scope: string, key: string, name: string) {
  const existingRole = await db
    .select({
      id: roles.id,
    })
    .from(roles)
    .where(and(eq(roles.scope, scope), eq(roles.key, key)))
    .limit(1);

  if (existingRole[0]) {
    return existingRole[0].id;
  }

  const roleId = createId();

  try {
    await db.insert(roles).values({
      id: roleId,
      scope,
      key,
      name,
      isSystem: true,
    });

    return roleId;
  } catch {
    const retriedRole = await db
      .select({
        id: roles.id,
      })
      .from(roles)
      .where(and(eq(roles.scope, scope), eq(roles.key, key)))
      .limit(1);

    if (retriedRole[0]) {
      return retriedRole[0].id;
    }

    throw new Error("Unable to initialize the default role.");
  }
}

async function getUniqueOrganizationSlug(name: string) {
  const baseSlug = slugify(name) || "workspace";
  let candidate = baseSlug;

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const existingOrganization = await db
      .select({
        id: organizations.id,
      })
      .from(organizations)
      .where(eq(organizations.slug, candidate))
      .limit(1);

    if (!existingOrganization[0]) {
      return candidate;
    }

    candidate = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;
  }

  return `${baseSlug}-${Date.now().toString(36)}`;
}

export async function bootstrapWorkspaceForUser(
  input: BootstrapWorkspaceInput,
) {
  const existingMembership = await db
    .select({
      id: organizationMemberships.id,
    })
    .from(organizationMemberships)
    .where(
      and(
        eq(organizationMemberships.userId, input.id),
        eq(organizationMemberships.status, ACTIVE_MEMBERSHIP_STATUS),
      ),
    )
    .limit(1);

  if (existingMembership[0]) {
    return;
  }

  const ownerRoleId = await ensureRole("organization", "owner", "Owner");
  const organizationId = createId();
  const organizationName = getDefaultOrganizationName(input.name, input.email);
  const organizationSlug = await getUniqueOrganizationSlug(organizationName);

  await db.insert(organizations).values({
    id: organizationId,
    name: organizationName,
    slug: organizationSlug,
    timezone: "UTC",
    currencyCode: "USD",
  });

  await db.insert(organizationSettings).values({
    id: createId(),
    organizationId,
    requireEmailVerification: false,
  });

  await db.insert(organizationMemberships).values({
    id: createId(),
    organizationId,
    userId: input.id,
    roleId: ownerRoleId,
    status: ACTIVE_MEMBERSHIP_STATUS,
    joinedAt: new Date(),
  });
}

export async function getOrganizationSettingsContextForUser(
  userId: string,
): Promise<OrganizationSettingsContext | null> {
  const [activeOrgId, rows] = await Promise.all([
    getActiveOrgIdFromCookie(),
    db
      .select({
        organizationId: organizations.id,
        organizationName: organizations.name,
        organizationSlug: organizations.slug,
        timezone: organizations.timezone,
        currencyCode: organizations.currencyCode,
        requireEmailVerification: organizationSettings.requireEmailVerification,
        logoUrl: organizationSettings.logoUrl,
        brandColor: organizationSettings.brandColor,
        sessionTimeoutHours: organizationSettings.sessionTimeoutHours,
        ipAllowlist: organizationSettings.ipAllowlist,
        ssoConfig: organizationSettings.ssoConfig,
        rolePermissionsConfig: organizationSettings.rolePermissionsConfig,
        onboardingCompletedAt: organizationSettings.onboardingCompletedAt,
        memberPermissionOverrides: organizationMemberships.permissionOverrides,
        roleKey: roles.key,
      })
      .from(organizationMemberships)
      .innerJoin(
        organizations,
        eq(organizationMemberships.organizationId, organizations.id),
      )
      .leftJoin(
        organizationSettings,
        eq(organizationSettings.organizationId, organizations.id),
      )
      .leftJoin(roles, eq(organizationMemberships.roleId, roles.id))
      .where(
        and(
          eq(organizationMemberships.userId, userId),
          eq(organizationMemberships.status, ACTIVE_MEMBERSHIP_STATUS),
          eq(organizations.isActive, true),
        ),
      )
      .orderBy(asc(organizationMemberships.createdAt)),
  ]);

  // Prefer the cookie-selected org; fall back to oldest membership
  const row =
    (activeOrgId ? rows.find((r) => r.organizationId === activeOrgId) : null) ??
    rows[0];

  if (!row) {
    return null;
  }

  const roleKey = row.roleKey ?? null;

  return {
    organizationId: row.organizationId,
    organizationName: row.organizationName,
    organizationSlug: row.organizationSlug,
    timezone: row.timezone,
    currencyCode: row.currencyCode,
    requireEmailVerification: row.requireEmailVerification ?? false,
    logoUrl: row.logoUrl ?? null,
    brandColor: row.brandColor ?? null,
    sessionTimeoutHours: row.sessionTimeoutHours ?? null,
    ipAllowlist: (row.ipAllowlist as string[] | null) ?? null,
    ssoConfig: (row.ssoConfig as Record<string, unknown> | null) ?? null,
    roleKey,
    canManageSettings: roleKey ? MANAGE_SETTINGS_ROLE_KEYS.has(roleKey) : false,
    rolePermissionsConfig: (row.rolePermissionsConfig as RolePermissionsConfig | null) ?? null,
    memberPermissionOverrides: (row.memberPermissionOverrides as MemberPermissionOverrides | null) ?? null,
    onboardingCompletedAt: row.onboardingCompletedAt ?? null,
  };
}

export type UserOrgOption = {
  id: string;
  name: string;
  roleKey: string | null;
  logoUrl: string | null;
};

export async function listOrganizationsForUser(userId: string): Promise<UserOrgOption[]> {
  const rows = await db
    .select({
      id: organizations.id,
      name: organizations.name,
      roleKey: roles.key,
      logoUrl: organizationSettings.logoUrl,
    })
    .from(organizationMemberships)
    .innerJoin(organizations, eq(organizationMemberships.organizationId, organizations.id))
    .leftJoin(organizationSettings, eq(organizationSettings.organizationId, organizations.id))
    .leftJoin(roles, eq(organizationMemberships.roleId, roles.id))
    .where(
      and(
        eq(organizationMemberships.userId, userId),
        eq(organizationMemberships.status, ACTIVE_MEMBERSHIP_STATUS),
        eq(organizations.isActive, true),
      ),
    )
    .orderBy(asc(organizationMemberships.createdAt));

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    roleKey: r.roleKey ?? null,
    logoUrl: r.logoUrl ?? null,
  }));
}

export async function getEmailVerificationPolicyForUserId(userId: string) {
  const memberships = await db
    .select({
      requireEmailVerification: organizationSettings.requireEmailVerification,
    })
    .from(organizationMemberships)
    .innerJoin(
      organizations,
      eq(organizationMemberships.organizationId, organizations.id),
    )
    .leftJoin(
      organizationSettings,
      eq(organizationSettings.organizationId, organizations.id),
    )
    .where(
      and(
        eq(organizationMemberships.userId, userId),
        eq(organizationMemberships.status, ACTIVE_MEMBERSHIP_STATUS),
        eq(organizations.isActive, true),
      ),
    );

  return memberships.some((membership) => membership.requireEmailVerification);
}

export async function getEmailVerificationPolicyForEmail(
  email: string,
): Promise<EmailVerificationPolicy> {
  const normalizedEmail = email.trim().toLowerCase();

  const matchedUsers = await db
    .select({
      userId: user.id,
      name: user.name,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      emailVerified: user.emailVerified,
    })
    .from(user)
    .where(eq(user.email, normalizedEmail))
    .limit(1);

  const firstRow = matchedUsers[0];

  if (!firstRow) {
    return {
      userId: null,
      name: "",
      createdAt: null,
      updatedAt: null,
      emailVerified: false,
      requireEmailVerification: false,
    };
  }

  const memberships = await db
    .select({
      requireEmailVerification: organizationSettings.requireEmailVerification,
    })
    .from(organizationMemberships)
    .innerJoin(
      organizations,
      eq(organizationMemberships.organizationId, organizations.id),
    )
    .leftJoin(
      organizationSettings,
      eq(organizationSettings.organizationId, organizations.id),
    )
    .where(
      and(
        eq(organizationMemberships.userId, firstRow.userId),
        eq(organizationMemberships.status, ACTIVE_MEMBERSHIP_STATUS),
        eq(organizations.isActive, true),
      ),
    );

  return {
    userId: firstRow.userId,
    name: firstRow.name,
    createdAt: firstRow.createdAt,
    updatedAt: firstRow.updatedAt,
    emailVerified: firstRow.emailVerified,
    requireEmailVerification: memberships.some(
      (membership) => membership.requireEmailVerification,
    ),
  };
}

export async function updateOrganizationSettingsForUser(
  userId: string,
  input: UpdateOrganizationSettingsInput,
) {
  const context = await getOrganizationSettingsContextForUser(userId);

  if (!context) {
    throw new Error("No active organization was found for this account.");
  }

  if (!context.canManageSettings) {
    throw new Error("Only organization admins can update these settings.");
  }

  const name = input.name.trim();
  const slug = slugify(input.slug || input.name);

  if (!name) {
    throw new Error("Organization name is required.");
  }

  if (!slug) {
    throw new Error("Enter a valid organization slug.");
  }

  const conflictingOrganization = await db
    .select({
      id: organizations.id,
    })
    .from(organizations)
    .where(
      and(
        eq(organizations.slug, slug),
        ne(organizations.id, context.organizationId),
      ),
    )
    .limit(1);

  if (conflictingOrganization[0]) {
    throw new Error("That organization slug is already in use.");
  }

  await db.update(organizations).set({
    name,
    slug,
    timezone: input.timezone.trim() || null,
    currencyCode: input.currencyCode.trim().toUpperCase() || null,
    updatedAt: new Date(),
  }).where(eq(organizations.id, context.organizationId));

  await db
    .insert(organizationSettings)
    .values({
      id: createId(),
      organizationId: context.organizationId,
      requireEmailVerification: input.requireEmailVerification,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: organizationSettings.organizationId,
      set: {
        requireEmailVerification: input.requireEmailVerification,
        updatedAt: new Date(),
      },
    });

  writeAuditLog({
    organizationId: context.organizationId,
    actorUserId: userId,
    action: "organization.updated",
    entityType: "organization",
    entityId: context.organizationId,
    metadata: { name: input.name.trim() },
  }).catch(console.error);
}

export async function updateOrganizationBrandingForUser(
  userId: string,
  input: { logoUrl?: string | null; brandColor?: string | null },
): Promise<{ logoUrl: string | null; brandColor: string | null }> {
  const context = await getOrganizationSettingsContextForUser(userId);
  if (!context) throw new Error("No active organization found.");
  if (!context.canManageSettings) throw new Error("Only admins can update branding.");

  const [saved] = await db
    .insert(organizationSettings)
    .values({
      id: createId(),
      organizationId: context.organizationId,
      requireEmailVerification: context.requireEmailVerification,
      logoUrl: input.logoUrl ?? null,
      brandColor: input.brandColor ?? null,
    })
    .onConflictDoUpdate({
      target: organizationSettings.organizationId,
      set: {
        ...(input.logoUrl !== undefined ? { logoUrl: input.logoUrl } : {}),
        ...(input.brandColor !== undefined ? { brandColor: input.brandColor } : {}),
        updatedAt: new Date(),
      },
    })
    .returning({
      logoUrl: organizationSettings.logoUrl,
      brandColor: organizationSettings.brandColor,
    });

  writeAuditLog({
    organizationId: context.organizationId,
    actorUserId: userId,
    action: "organization.branding_updated",
    entityType: "organization",
    entityId: context.organizationId,
  }).catch(console.error);

  return {
    logoUrl: saved?.logoUrl ?? null,
    brandColor: saved?.brandColor ?? null,
  };
}

export async function updateSsoConfigForUser(
  userId: string,
  ssoConfig: Record<string, unknown> | null,
) {
  const context = await getOrganizationSettingsContextForUser(userId);
  if (!context) throw new Error("No active organization found.");
  if (!context.canManageSettings) throw new Error("Only admins can update SSO settings.");

  await db
    .insert(organizationSettings)
    .values({
      id: createId(),
      organizationId: context.organizationId,
      requireEmailVerification: context.requireEmailVerification,
      ssoConfig,
    })
    .onConflictDoUpdate({
      target: organizationSettings.organizationId,
      set: { ssoConfig, updatedAt: new Date() },
    });

  writeAuditLog({
    organizationId: context.organizationId,
    actorUserId: userId,
    action: "organization.sso_updated",
    entityType: "organization",
    entityId: context.organizationId,
  }).catch(console.error);
}

export async function updateSecurityPoliciesForUser(
  userId: string,
  input: { sessionTimeoutHours?: number | null; ipAllowlist?: string[] | null },
) {
  const context = await getOrganizationSettingsContextForUser(userId);
  if (!context) throw new Error("No active organization found.");
  if (!context.canManageSettings) throw new Error("Only admins can update security policies.");

  await db
    .insert(organizationSettings)
    .values({
      id: createId(),
      organizationId: context.organizationId,
      requireEmailVerification: context.requireEmailVerification,
      sessionTimeoutHours: input.sessionTimeoutHours ?? null,
      ipAllowlist: input.ipAllowlist ?? null,
    })
    .onConflictDoUpdate({
      target: organizationSettings.organizationId,
      set: {
        ...(input.sessionTimeoutHours !== undefined ? { sessionTimeoutHours: input.sessionTimeoutHours } : {}),
        ...(input.ipAllowlist !== undefined ? { ipAllowlist: input.ipAllowlist } : {}),
        updatedAt: new Date(),
      },
    });

  writeAuditLog({
    organizationId: context.organizationId,
    actorUserId: userId,
    action: "organization.security_updated",
    entityType: "organization",
    entityId: context.organizationId,
  }).catch(console.error);
}

export async function completeOnboardingForUser(userId: string): Promise<void> {
  const context = await getOrganizationSettingsContextForUser(userId);
  if (!context) return;
  if (context.onboardingCompletedAt) return; // already done

  await db
    .insert(organizationSettings)
    .values({
      id: createId(),
      organizationId: context.organizationId,
      requireEmailVerification: context.requireEmailVerification,
      onboardingCompletedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: organizationSettings.organizationId,
      set: { onboardingCompletedAt: new Date(), updatedAt: new Date() },
    });
}
