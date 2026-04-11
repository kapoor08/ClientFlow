import "server-only";

import { writeAuditLog } from "@/lib/audit";
import { enforceMemberCap } from "@/lib/plan-enforcement";
import { createHash } from "crypto";
import { and, asc, desc, eq, gte, ilike, lt, lte, count } from "drizzle-orm";
import {
  organizationInvitations,
  organizationMemberships,
  organizations,
  roles,
} from "@/db/schema";
import { user } from "@/db/auth-schema";
import { db } from "@/lib/db";
import { getOrganizationSettingsContextForUser } from "@/lib/organization-settings";
import { onUserInvited, onInviteRevoked, onInviteAccepted } from "@/lib/email-triggers";
import { dispatchNotification } from "@/lib/notifications";
import { dispatchWebhookEvent } from "@/lib/webhook-dispatch";
import {
  getAssignableRoleKeys,
  INVITE_EXPIRY_DAYS,
  type InvitationStatus,
} from "@/lib/invitations-shared";
import {
  DEFAULT_PAGE_SIZE,
  buildPaginationMeta,
  paginationOffset,
  type PaginationMeta,
} from "@/lib/pagination";

// ─── Types ────────────────────────────────────────────────────────────────────

export type InvitationsModuleAccess = {
  organizationId: string;
  organizationName: string;
  roleKey: string | null;
  canWrite: boolean; // owner, admin, manager
};

export type InvitationListItem = {
  id: string;
  email: string;
  roleKey: string;
  roleName: string;
  status: InvitationStatus;
  invitedByName: string | null;
  expiresAt: Date;
  acceptedAt: Date | null;
  revokedAt: Date | null;
  createdAt: Date;
};

export type InvitationDetail = {
  id: string;
  email: string;
  organizationId: string;
  organizationName: string;
  roleKey: string;
  roleName: string;
  status: InvitationStatus;
  expiresAt: Date;
};

export type AssignableRole = { id: string; key: string; name: string };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

function generateToken(): { raw: string; hash: string } {
  const raw = crypto.randomUUID() + crypto.randomUUID().replace(/-/g, "");
  return { raw, hash: hashToken(raw) };
}

function resolveStatus(
  status: string,
  expiresAt: Date,
): InvitationStatus {
  if (status === "pending" && expiresAt < new Date()) return "expired";
  return status as InvitationStatus;
}

// ─── Access ───────────────────────────────────────────────────────────────────

export async function getInvitationsModuleAccessForUser(
  userId: string,
): Promise<InvitationsModuleAccess | null> {
  const context = await getOrganizationSettingsContextForUser(userId);
  if (!context) return null;
  const canWrite =
    context.roleKey === "owner" ||
    context.roleKey === "admin" ||
    context.roleKey === "manager";
  return {
    organizationId: context.organizationId,
    organizationName: context.organizationName,
    roleKey: context.roleKey,
    canWrite,
  };
}

// ─── List ─────────────────────────────────────────────────────────────────────

const SORTABLE_INVITATION_COLUMNS = {
  email: organizationInvitations.email,
  createdAt: organizationInvitations.createdAt,
  expiresAt: organizationInvitations.expiresAt,
} as const;

type InvitationSortKey = keyof typeof SORTABLE_INVITATION_COLUMNS;

function resolveInvitationSort(sort: string | undefined, order: "asc" | "desc") {
  const col =
    SORTABLE_INVITATION_COLUMNS[
      (sort as InvitationSortKey) in SORTABLE_INVITATION_COLUMNS
        ? (sort as InvitationSortKey)
        : "createdAt"
    ];
  return order === "asc" ? asc(col) : desc(col);
}

function resolveStatusWhereClause(status: string | undefined) {
  if (!status) return undefined;
  const now = new Date();
  if (status === "pending") return and(eq(organizationInvitations.status, "pending"), gte(organizationInvitations.expiresAt, now));
  if (status === "expired") return and(eq(organizationInvitations.status, "pending"), lt(organizationInvitations.expiresAt, now));
  if (status === "accepted") return eq(organizationInvitations.status, "accepted");
  if (status === "revoked") return eq(organizationInvitations.status, "revoked");
  return undefined;
}

export async function listInvitationsForOrg(
  userId: string,
  options: {
    page?: number;
    pageSize?: number;
    query?: string;
    status?: string;
    sort?: string;
    order?: "asc" | "desc";
    dateFrom?: Date;
    dateTo?: Date;
  } = {},
): Promise<{
  access: InvitationsModuleAccess | null;
  invitations: InvitationListItem[];
  pagination: PaginationMeta;
}> {
  const access = await getInvitationsModuleAccessForUser(userId);
  const emptyPagination = buildPaginationMeta(0, 1, DEFAULT_PAGE_SIZE);
  if (!access) return { access: null, invitations: [], pagination: emptyPagination };

  const {
    page = 1,
    pageSize = DEFAULT_PAGE_SIZE,
    query = "",
    status,
    sort,
    order = "desc",
    dateFrom,
    dateTo,
  } = options;

  const trimmedQuery = query.trim();

  const whereClause = and(
    eq(organizationInvitations.organizationId, access.organizationId),
    trimmedQuery ? ilike(organizationInvitations.email, `%${trimmedQuery}%`) : undefined,
    resolveStatusWhereClause(status),
    dateFrom ? gte(organizationInvitations.createdAt, dateFrom) : undefined,
    dateTo ? lte(organizationInvitations.createdAt, dateTo) : undefined,
  );

  const [{ total }] = await db
    .select({ total: count() })
    .from(organizationInvitations)
    .where(whereClause);

  const rows = await db
    .select({
      id: organizationInvitations.id,
      email: organizationInvitations.email,
      roleKey: roles.key,
      roleName: roles.name,
      status: organizationInvitations.status,
      invitedByName: user.name,
      expiresAt: organizationInvitations.expiresAt,
      acceptedAt: organizationInvitations.acceptedAt,
      revokedAt: organizationInvitations.revokedAt,
      createdAt: organizationInvitations.createdAt,
    })
    .from(organizationInvitations)
    .leftJoin(roles, eq(organizationInvitations.roleId, roles.id))
    .leftJoin(user, eq(organizationInvitations.invitedByUserId, user.id))
    .where(whereClause)
    .orderBy(resolveInvitationSort(sort, order))
    .limit(pageSize)
    .offset(paginationOffset(page, pageSize));

  return {
    access,
    invitations: rows.map((r) => ({
      ...r,
      roleKey: r.roleKey ?? "",
      roleName: r.roleName ?? "",
      status: resolveStatus(r.status, r.expiresAt),
    })),
    pagination: buildPaginationMeta(total, page, pageSize),
  };
}

// ─── Assignable roles ─────────────────────────────────────────────────────────

export async function getAssignableRolesForUser(
  userId: string,
): Promise<{ access: InvitationsModuleAccess | null; roles: AssignableRole[] }> {
  const access = await getInvitationsModuleAccessForUser(userId);
  if (!access || !access.canWrite) return { access, roles: [] };

  const assignableKeys = getAssignableRoleKeys(access.roleKey ?? "");

  const rows = await db
    .select({ id: roles.id, key: roles.key, name: roles.name })
    .from(roles)
    .where(eq(roles.scope, "organization"));

  return {
    access,
    roles: rows.filter((r) => assignableKeys.includes(r.key)),
  };
}

// ─── Send invitation ──────────────────────────────────────────────────────────

export async function sendInvitationForUser(
  userId: string,
  input: { email: string; roleId: string },
): Promise<{ invitationId: string }> {
  const access = await getInvitationsModuleAccessForUser(userId);
  if (!access) throw new Error("No active organization found.");
  if (!access.canWrite) throw new Error("You do not have permission to send invitations.");

  // Verify the role exists and is assignable by this user
  const [role] = await db
    .select({ id: roles.id, key: roles.key, name: roles.name })
    .from(roles)
    .where(and(eq(roles.id, input.roleId), eq(roles.scope, "organization")))
    .limit(1);

  if (!role) throw new Error("Invalid role selected.");

  const assignableKeys = getAssignableRoleKeys(access.roleKey ?? "");
  if (!assignableKeys.includes(role.key)) {
    throw new Error("You cannot assign this role.");
  }

  // Check for existing active invitation
  const existing = await db
    .select({ id: organizationInvitations.id, status: organizationInvitations.status, expiresAt: organizationInvitations.expiresAt })
    .from(organizationInvitations)
    .where(
      and(
        eq(organizationInvitations.organizationId, access.organizationId),
        eq(organizationInvitations.email, input.email.toLowerCase().trim()),
      ),
    );

  const activePending = existing.find(
    (i) => i.status === "pending" && i.expiresAt > new Date(),
  );
  if (activePending) throw new Error("A pending invitation already exists for this email.");

  // Check if already a member
  const [member] = await db
    .select({ id: organizationMemberships.id })
    .from(organizationMemberships)
    .innerJoin(user, eq(organizationMemberships.userId, user.id))
    .where(
      and(
        eq(organizationMemberships.organizationId, access.organizationId),
        eq(user.email, input.email.toLowerCase().trim()),
      ),
    )
    .limit(1);

  if (member) throw new Error("This user is already a member of your organization.");

  // Enforce member cap before proceeding
  await enforceMemberCap(access.organizationId);

  // Get inviter details
  const [inviter] = await db
    .select({ name: user.name, email: user.email })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  const { raw, hash } = generateToken();
  const invitationId = crypto.randomUUID();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + INVITE_EXPIRY_DAYS);

  await db.insert(organizationInvitations).values({
    id: invitationId,
    organizationId: access.organizationId,
    email: input.email.toLowerCase().trim(),
    roleId: input.roleId,
    tokenHash: hash,
    invitedByUserId: userId,
    status: "pending",
    expiresAt,
  });

  const actionUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${raw}`;

  writeAuditLog({
    organizationId: access.organizationId,
    actorUserId: userId,
    action: "invitation.sent",
    entityType: "invitation",
    entityId: invitationId,
    metadata: { email: input.email.toLowerCase().trim(), role: role.name },
  }).catch(console.error);

  // Fire-and-forget email
  onUserInvited({
    invitee: { id: invitationId, name: input.email.split("@")[0] ?? "there", email: input.email },
    org: { id: access.organizationId, name: access.organizationName },
    invitedBy: { id: userId, name: inviter?.name ?? "A team member", email: inviter?.email ?? "" },
    role: role.name,
    actionUrl,
    expiresAt,
  }).catch(console.error);

  return { invitationId };
}

// ─── Resend invitation ────────────────────────────────────────────────────────

export async function resendInvitationForUser(
  userId: string,
  invitationId: string,
): Promise<void> {
  const access = await getInvitationsModuleAccessForUser(userId);
  if (!access) throw new Error("No active organization found.");
  if (!access.canWrite) throw new Error("You do not have permission to resend invitations.");

  const [invitation] = await db
    .select({
      id: organizationInvitations.id,
      email: organizationInvitations.email,
      roleId: organizationInvitations.roleId,
      status: organizationInvitations.status,
      expiresAt: organizationInvitations.expiresAt,
      roleName: roles.name,
    })
    .from(organizationInvitations)
    .leftJoin(roles, eq(organizationInvitations.roleId, roles.id))
    .where(
      and(
        eq(organizationInvitations.id, invitationId),
        eq(organizationInvitations.organizationId, access.organizationId),
      ),
    )
    .limit(1);

  if (!invitation) throw new Error("Invitation not found.");
  if (invitation.status !== "pending" && resolveStatus(invitation.status, invitation.expiresAt) !== "expired") {
    throw new Error("Only pending or expired invitations can be resent.");
  }

  const { raw, hash } = generateToken();
  const newExpiresAt = new Date();
  newExpiresAt.setDate(newExpiresAt.getDate() + INVITE_EXPIRY_DAYS);

  await db
    .update(organizationInvitations)
    .set({ tokenHash: hash, status: "pending", expiresAt: newExpiresAt, updatedAt: new Date() })
    .where(eq(organizationInvitations.id, invitationId));

  const [inviter] = await db
    .select({ name: user.name, email: user.email })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  const actionUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${raw}`;

  writeAuditLog({
    organizationId: access.organizationId,
    actorUserId: userId,
    action: "invitation.resent",
    entityType: "invitation",
    entityId: invitationId,
    metadata: { email: invitation.email },
  }).catch(console.error);

  onUserInvited({
    invitee: { id: invitationId, name: invitation.email.split("@")[0] ?? "there", email: invitation.email },
    org: { id: access.organizationId, name: access.organizationName },
    invitedBy: { id: userId, name: inviter?.name ?? "A team member", email: inviter?.email ?? "" },
    role: invitation.roleName ?? "",
    actionUrl,
    expiresAt: newExpiresAt,
  }).catch(console.error);
}

// ─── Revoke invitation ────────────────────────────────────────────────────────

export async function revokeInvitationForUser(
  userId: string,
  invitationId: string,
): Promise<void> {
  const access = await getInvitationsModuleAccessForUser(userId);
  if (!access) throw new Error("No active organization found.");
  if (!access.canWrite) throw new Error("You do not have permission to revoke invitations.");

  const [invitation] = await db
    .select({
      id: organizationInvitations.id,
      email: organizationInvitations.email,
      status: organizationInvitations.status,
      expiresAt: organizationInvitations.expiresAt,
    })
    .from(organizationInvitations)
    .where(
      and(
        eq(organizationInvitations.id, invitationId),
        eq(organizationInvitations.organizationId, access.organizationId),
      ),
    )
    .limit(1);

  if (!invitation) throw new Error("Invitation not found.");
  if (resolveStatus(invitation.status, invitation.expiresAt) !== "pending") {
    throw new Error("Only pending invitations can be revoked.");
  }

  const [actor] = await db
    .select({ name: user.name })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  await db
    .update(organizationInvitations)
    .set({ status: "revoked", revokedAt: new Date(), updatedAt: new Date() })
    .where(eq(organizationInvitations.id, invitationId));

  writeAuditLog({
    organizationId: access.organizationId,
    actorUserId: userId,
    action: "invitation.revoked",
    entityType: "invitation",
    entityId: invitationId,
    metadata: { email: invitation.email },
  }).catch(console.error);

  onInviteRevoked({
    invitee: { id: invitationId, name: invitation.email.split("@")[0] ?? "there", email: invitation.email },
    org: { id: access.organizationId, name: access.organizationName },
    actor: { id: userId, name: actor?.name ?? "An admin", email: "" },
    supportEmail: process.env.RESEND_FROM_EMAIL ?? "",
  }).catch(console.error);
}

// ─── Accept invitation (public) ───────────────────────────────────────────────

export async function getInvitationByToken(
  rawToken: string,
): Promise<InvitationDetail | null> {
  const hash = hashToken(rawToken);

  const [row] = await db
    .select({
      id: organizationInvitations.id,
      email: organizationInvitations.email,
      organizationId: organizationInvitations.organizationId,
      organizationName: organizations.name,
      roleKey: roles.key,
      roleName: roles.name,
      status: organizationInvitations.status,
      expiresAt: organizationInvitations.expiresAt,
    })
    .from(organizationInvitations)
    .leftJoin(roles, eq(organizationInvitations.roleId, roles.id))
    .leftJoin(organizations, eq(organizationInvitations.organizationId, organizations.id))
    .where(eq(organizationInvitations.tokenHash, hash))
    .limit(1);

  if (!row) return null;

  return {
    ...row,
    organizationName: row.organizationName ?? "",
    roleKey: row.roleKey ?? "",
    roleName: row.roleName ?? "",
    status: resolveStatus(row.status, row.expiresAt),
  };
}

export async function acceptInvitationForUser(
  userId: string,
  rawToken: string,
): Promise<{ organizationId: string; roleKey: string | null }> {
  const hash = hashToken(rawToken);

  const [invitation] = await db
    .select({
      id: organizationInvitations.id,
      email: organizationInvitations.email,
      organizationId: organizationInvitations.organizationId,
      roleId: organizationInvitations.roleId,
      roleKey: roles.key,
      invitedByUserId: organizationInvitations.invitedByUserId,
      status: organizationInvitations.status,
      expiresAt: organizationInvitations.expiresAt,
    })
    .from(organizationInvitations)
    .leftJoin(roles, eq(organizationInvitations.roleId, roles.id))
    .where(eq(organizationInvitations.tokenHash, hash))
    .limit(1);

  if (!invitation) throw new Error("Invalid or expired invitation link.");
  if (resolveStatus(invitation.status, invitation.expiresAt) !== "pending") {
    throw new Error("This invitation is no longer valid.");
  }

  // Enforce that only the invited email can accept
  const [acceptorRow] = await db
    .select({ email: user.email })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  if (!acceptorRow) throw new Error("User not found.");
  if (acceptorRow.email.toLowerCase() !== invitation.email.toLowerCase()) {
    throw new Error(
      `This invitation was sent to ${invitation.email}. You are signed in as ${acceptorRow.email}. Please sign in with the correct account.`,
    );
  }

  // Check if already a member
  const [existing] = await db
    .select({ id: organizationMemberships.id })
    .from(organizationMemberships)
    .where(
      and(
        eq(organizationMemberships.organizationId, invitation.organizationId),
        eq(organizationMemberships.userId, userId),
      ),
    )
    .limit(1);

  if (existing) throw new Error("You are already a member of this organization.");

  await db.insert(organizationMemberships).values({
    id: crypto.randomUUID(),
    organizationId: invitation.organizationId,
    userId,
    roleId: invitation.roleId,
    status: "active",
    joinedAt: new Date(),
    invitedByUserId: invitation.invitedByUserId ?? null,
  });

  await db
    .update(organizationInvitations)
    .set({ status: "accepted", acceptedAt: new Date(), updatedAt: new Date() })
    .where(eq(organizationInvitations.id, invitation.id));

  // Fire-and-forget: notify the inviter that their invite was accepted
  if (invitation.invitedByUserId) {
    dispatchNotification({
      organizationId: invitation.organizationId,
      recipientUserIds: [invitation.invitedByUserId],
      eventKey: "invite_accepted",
      title: "Invitation accepted",
      body: "Someone you invited has joined your organization.",
      url: "/invitations",
    }).catch(console.error);
  }

  // Email trigger: notify inviter with full details
  Promise.all([
    db.select({ name: user.name, email: user.email }).from(user).where(eq(user.id, userId)).limit(1),
    invitation.invitedByUserId
      ? db.select({ name: user.name, email: user.email }).from(user).where(eq(user.id, invitation.invitedByUserId)).limit(1)
      : Promise.resolve([null] as const),
    db.select({ id: organizations.id, name: organizations.name }).from(organizations).where(eq(organizations.id, invitation.organizationId)).limit(1),
    db.select({ name: roles.name }).from(roles).where(eq(roles.id, invitation.roleId)).limit(1),
  ]).then(([acceptedRows, inviterRows, orgRows, roleRows]) => {
    const accepted = acceptedRows[0];
    const inviter = inviterRows[0];
    const org = orgRows[0];
    if (!accepted?.email || !inviter?.email || !org) return;
    return onInviteAccepted({
      acceptedUser: { id: userId, name: accepted.name ?? "A new member", email: accepted.email },
      org: { id: org.id, name: org.name },
      role: roleRows?.[0]?.name ?? "Member",
      recipients: [{ id: invitation.invitedByUserId!, name: inviter.name ?? "Team admin", email: inviter.email }],
    });
  }).catch(console.error);

  writeAuditLog({
    organizationId: invitation.organizationId,
    actorUserId: userId,
    action: "invitation.accepted",
    entityType: "invitation",
    entityId: invitation.id,
  }).catch(console.error);

  dispatchWebhookEvent(invitation.organizationId, "team.member_added", {
    userId,
    email: invitation.email,
    roleKey: invitation.roleKey ?? null,
    invitationId: invitation.id,
  }).catch(console.error);

  return { organizationId: invitation.organizationId, roleKey: invitation.roleKey ?? null };
}
