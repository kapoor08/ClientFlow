// ─── Types ────────────────────────────────────────────────────────────────────

export type ModulePermissions = {
  visible: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
};

/** Stored per-member in organizationMemberships.permissionOverrides */
export type MemberPermissionOverride = Partial<ModulePermissions>;

/** Full overrides map: moduleKey → overrides for that module */
export type MemberPermissionOverrides = Record<string, MemberPermissionOverride>;

export type RolePermissionsConfig = {
  manager: Record<string, ModulePermissions>;
  member: Record<string, ModulePermissions>;
  client: Record<string, ModulePermissions>;
};

export type ConfigurableRole = keyof RolePermissionsConfig;

// ─── Module definitions ───────────────────────────────────────────────────────

export type ModuleDef = {
  key: string;
  label: string;
  href: string;
  hasCreate: boolean;
  hasEdit: boolean;
  hasDelete: boolean;
};

/** Modules visible in the admin sidebar for manager/member roles */
export const WORKSPACE_MODULES: ModuleDef[] = [
  { key: "clients",       label: "Clients",       href: "/clients",       hasCreate: true,  hasEdit: true,  hasDelete: true },
  { key: "projects",      label: "Projects",      href: "/projects",      hasCreate: true,  hasEdit: true,  hasDelete: true },
  { key: "tasks",         label: "Tasks",         href: "/tasks",         hasCreate: true,  hasEdit: true,  hasDelete: true },
  { key: "files",         label: "Files",         href: "/files",         hasCreate: true,  hasEdit: false, hasDelete: true },
  { key: "activity-logs", label: "Activity Logs", href: "/activity-logs", hasCreate: false, hasEdit: false, hasDelete: false },
  { key: "notifications", label: "Notifications", href: "/notifications", hasCreate: false, hasEdit: false, hasDelete: false },
  { key: "invitations",   label: "Invitations",   href: "/invitations",   hasCreate: true,  hasEdit: false, hasDelete: false },
  { key: "analytics",     label: "Analytics",     href: "/analytics",     hasCreate: false, hasEdit: false, hasDelete: false },
];

/** Modules visible in the client portal sidebar */
export const PORTAL_MODULES: ModuleDef[] = [
  { key: "portal-projects", label: "Projects", href: "/client-portal/projects", hasCreate: false, hasEdit: false, hasDelete: false },
  { key: "portal-tasks",    label: "Tasks",    href: "/client-portal/tasks",    hasCreate: false, hasEdit: false, hasDelete: false },
  { key: "portal-files",    label: "Files",    href: "/client-portal/files",    hasCreate: false, hasEdit: false, hasDelete: false },
  { key: "portal-invoices", label: "Invoices", href: "/client-portal/invoices", hasCreate: false, hasEdit: false, hasDelete: false },
];

/** Hrefs that owner/admin always see - not configurable for other roles */
export const ADMIN_ONLY_HREFS = new Set([
  "/settings", "/teams", "/billing", "/invoices", "/activity-logs", "/org-security", "/developer",
]);

// ─── Defaults ─────────────────────────────────────────────────────────────────

export const DEFAULT_ROLE_PERMISSIONS: RolePermissionsConfig = {
  manager: {
    clients:        { visible: true,  canCreate: true,  canEdit: true,  canDelete: false },
    projects:       { visible: true,  canCreate: true,  canEdit: true,  canDelete: false },
    tasks:          { visible: true,  canCreate: true,  canEdit: true,  canDelete: true  },
    files:          { visible: true,  canCreate: true,  canEdit: false, canDelete: false },
    "activity-logs":{ visible: true,  canCreate: false, canEdit: false, canDelete: false },
    notifications:  { visible: true,  canCreate: false, canEdit: false, canDelete: false },
    invitations:    { visible: true,  canCreate: true,  canEdit: false, canDelete: false },
    analytics:      { visible: true,  canCreate: false, canEdit: false, canDelete: false },
  },
  member: {
    clients:        { visible: true,  canCreate: false, canEdit: false, canDelete: false },
    projects:       { visible: true,  canCreate: false, canEdit: false, canDelete: false },
    tasks:          { visible: true,  canCreate: true,  canEdit: true,  canDelete: false },
    files:          { visible: true,  canCreate: true,  canEdit: false, canDelete: false },
    "activity-logs":{ visible: false, canCreate: false, canEdit: false, canDelete: false },
    notifications:  { visible: true,  canCreate: false, canEdit: false, canDelete: false },
    invitations:    { visible: false, canCreate: false, canEdit: false, canDelete: false },
    analytics:      { visible: false, canCreate: false, canEdit: false, canDelete: false },
  },
  client: {
    "portal-projects": { visible: true,  canCreate: false, canEdit: false, canDelete: false },
    "portal-tasks":    { visible: true,  canCreate: false, canEdit: false, canDelete: false },
    "portal-files":    { visible: true,  canCreate: false, canEdit: false, canDelete: false },
    "portal-invoices": { visible: false, canCreate: false, canEdit: false, canDelete: false },
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Merges saved config with defaults so missing keys are filled in */
export function resolveRolePermissions(
  saved: RolePermissionsConfig | null | undefined,
): RolePermissionsConfig {
  if (!saved) return DEFAULT_ROLE_PERMISSIONS;
  return {
    manager: { ...DEFAULT_ROLE_PERMISSIONS.manager, ...saved.manager },
    member:  { ...DEFAULT_ROLE_PERMISSIONS.member,  ...saved.member  },
    client:  { ...DEFAULT_ROLE_PERMISSIONS.client,  ...saved.client  },
  };
}

/** Returns whether a nav href should be visible for a given role */
export function isNavHrefVisibleForRole(
  href: string,
  roleKey: string | null | undefined,
  config: RolePermissionsConfig | null | undefined,
): boolean {
  if (!roleKey || roleKey === "owner" || roleKey === "admin") return true;
  if (ADMIN_ONLY_HREFS.has(href)) return false;

  const resolved = resolveRolePermissions(config ?? null);

  if (roleKey === "manager" || roleKey === "member") {
    const mod = WORKSPACE_MODULES.find((m) => m.href === href);
    if (!mod) return true; // dashboard and unknown hrefs are always visible
    return resolved[roleKey as "manager" | "member"][mod.key]?.visible ?? true;
  }

  return true;
}

/** Returns portal nav hrefs visible for the client role */
export function getVisiblePortalHrefs(
  config: RolePermissionsConfig | null | undefined,
  memberOverrides?: MemberPermissionOverrides | null,
): Set<string> {
  const resolved = resolveRolePermissions(config ?? null);
  const visible = new Set<string>();
  for (const mod of PORTAL_MODULES) {
    const base = resolved.client[mod.key] ?? { visible: true, canCreate: false, canEdit: false, canDelete: false };
    const effective = { ...base, ...(memberOverrides?.[mod.key] ?? {}) };
    if (effective.visible !== false) {
      visible.add(mod.href);
    }
  }
  return visible;
}

/**
 * Resolves effective permissions for a specific member.
 * Priority: member overrides > org role config > system defaults.
 */
export function resolveMemberEffectivePermissions(
  roleKey: string,
  orgRoleConfig: RolePermissionsConfig | null,
  memberOverrides: MemberPermissionOverrides | null,
): Record<string, ModulePermissions> {
  const resolved = resolveRolePermissions(orgRoleConfig);
  const role = roleKey as ConfigurableRole;
  const base: Record<string, ModulePermissions> = { ...(resolved[role] ?? {}) };

  if (!memberOverrides) return base;

  const result: Record<string, ModulePermissions> = { ...base };
  for (const [moduleKey, override] of Object.entries(memberOverrides)) {
    const existing = result[moduleKey] ?? { visible: true, canCreate: false, canEdit: false, canDelete: false };
    result[moduleKey] = { ...existing, ...override };
  }
  return result;
}

/** Whether a nav href is visible for a member, considering both role config and personal overrides */
export function isNavHrefVisibleForMember(
  href: string,
  roleKey: string | null | undefined,
  orgRoleConfig: RolePermissionsConfig | null | undefined,
  memberOverrides: MemberPermissionOverrides | null | undefined,
): boolean {
  if (!roleKey || roleKey === "owner" || roleKey === "admin") return true;
  if (ADMIN_ONLY_HREFS.has(href)) return false;

  const mod = WORKSPACE_MODULES.find((m) => m.href === href);
  if (!mod) return true; // dashboard and unknown hrefs are always visible

  const effective = resolveMemberEffectivePermissions(
    roleKey,
    orgRoleConfig ?? null,
    memberOverrides ?? null,
  );
  return effective[mod.key]?.visible !== false;
}
