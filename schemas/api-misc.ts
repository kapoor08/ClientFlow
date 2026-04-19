import { z } from "zod";

// ─── Role permissions (PATCH /api/role-permissions) ───────────────────────────

const modulePermissionsSchema = z.object({
  visible: z.boolean(),
  canCreate: z.boolean(),
  canEdit: z.boolean(),
  canDelete: z.boolean(),
});

export const rolePermissionsConfigSchema = z.object({
  manager: z.record(z.string(), modulePermissionsSchema),
  member: z.record(z.string(), modulePermissionsSchema),
  client: z.record(z.string(), modulePermissionsSchema),
});

export const updateRolePermissionsSchema = z.object({
  permissions: rolePermissionsConfigSchema,
});

// ─── Member permission overrides (PATCH /api/team/[memberId]/permissions) ─────

const partialModulePermissionsSchema = z.object({
  visible: z.boolean().optional(),
  canCreate: z.boolean().optional(),
  canEdit: z.boolean().optional(),
  canDelete: z.boolean().optional(),
});

export const memberPermissionOverridesSchema = z.record(
  z.string(),
  partialModulePermissionsSchema,
);

export const updateMemberPermissionsSchema = z.object({
  overrides: memberPermissionOverridesSchema.nullable(),
});

// ─── SSO config (PATCH /api/settings/sso) ─────────────────────────────────────
// Keys are intentionally open-ended (different providers need different fields),
// but we constrain the shape and cap string length to prevent abuse.

export const ssoConfigSchema = z
  .object({
    provider: z.enum(["oidc", "saml", "google", "azure", "okta"]).optional(),
    enabled: z.boolean().optional(),
    clientId: z.string().max(500).optional(),
    clientSecret: z.string().max(2000).optional(),
    domain: z.string().max(255).optional(),
    issuerUrl: z.string().url().max(500).optional(),
    callbackUrl: z.string().url().max(500).optional(),
    emailDomains: z.array(z.string().max(255)).max(20).optional(),
    metadataXml: z.string().max(100_000).optional(),
  })
  .catchall(z.union([z.string(), z.boolean(), z.number(), z.null()]));

export const updateSsoConfigSchema = z.object({
  ssoConfig: ssoConfigSchema.nullable(),
});

// ─── Task column (POST /api/task-columns) ─────────────────────────────────────

export const createTaskColumnSchema = z.object({
  name: z.string().trim().min(1, "Column name is required.").max(60),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Color must be a hex value like #3b82f6.")
    .optional(),
  columnType: z
    .enum(["todo", "in_progress", "in_review", "done", "none"])
    .nullable()
    .optional(),
  description: z.string().max(500).nullable().optional(),
});
