import "server-only";

import { and, asc, count, eq, ne } from "drizzle-orm";
import { user } from "@/db/auth-schema";
import { organizationMemberships, projectMembers, roles } from "@/db/schema";
import { db } from "@/lib/db";
import { getOrganizationSettingsContextForUser } from "@/lib/organization-settings";

export type TeamModuleAccess = {
  organizationId: string;
  userId: string;
  roleKey: string | null;
  canManage: boolean; // owner or admin
};

export type TeamMember = {
  membershipId: string;
  userId: string;
  name: string;
  email: string;
  image: string | null;
  roleKey: string;
  roleName: string;
  status: string;
  joinedAt: Date | null;
  projectCount: number;
};

export type AssignableRole = {
  id: string;
  key: string;
  name: string;
};

async function getTeamAccessForUser(userId: string): Promise<TeamModuleAccess | null> {
  const context = await getOrganizationSettingsContextForUser(userId);
  if (!context) return null;
  return {
    organizationId: context.organizationId,
    userId,
    roleKey: context.roleKey,
    canManage: context.roleKey === "owner" || context.roleKey === "admin",
  };
}

export async function listTeamMembersForUser(userId: string): Promise<{
  access: TeamModuleAccess | null;
  members: TeamMember[];
  assignableRoles: AssignableRole[];
}> {
  const access = await getTeamAccessForUser(userId);
  if (!access) return { access: null, members: [], assignableRoles: [] };

  const [rows, roleRows] = await Promise.all([
    db
      .select({
        membershipId: organizationMemberships.id,
        userId: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        roleKey: roles.key,
        roleName: roles.name,
        status: organizationMemberships.status,
        joinedAt: organizationMemberships.joinedAt,
      })
      .from(organizationMemberships)
      .innerJoin(user, eq(organizationMemberships.userId, user.id))
      .innerJoin(roles, eq(organizationMemberships.roleId, roles.id))
      .where(
        and(
          eq(organizationMemberships.organizationId, access.organizationId),
          ne(organizationMemberships.status, "invited"),
        ),
      )
      .orderBy(asc(user.name)),

    db
      .select({ id: roles.id, key: roles.key, name: roles.name })
      .from(roles)
      .where(eq(roles.scope, "organization"))
      .orderBy(asc(roles.name)),
  ]);

  // Count projects each member belongs to in this org
  const projectCounts = await db
    .select({
      userId: projectMembers.userId,
      total: count(projectMembers.projectId),
    })
    .from(projectMembers)
    .where(eq(projectMembers.organizationId, access.organizationId))
    .groupBy(projectMembers.userId);

  const countMap = new Map(projectCounts.map((r) => [r.userId, r.total]));

  return {
    access,
    members: rows.map((r) => ({
      ...r,
      projectCount: countMap.get(r.userId) ?? 0,
    })),
    assignableRoles: roleRows,
  };
}

export async function updateMemberRoleForUser(
  userId: string,
  targetMembershipId: string,
  newRoleKey: string,
): Promise<void> {
  const access = await getTeamAccessForUser(userId);
  if (!access) throw new Error("No active organization found.");
  if (!access.canManage) throw new Error("You do not have permission to change roles.");

  const roleRows = await db
    .select({ id: roles.id, key: roles.key })
    .from(roles)
    .where(and(eq(roles.scope, "organization"), eq(roles.key, newRoleKey)))
    .limit(1);

  const role = roleRows[0];
  if (!role) throw new Error("Invalid role.");
  if (newRoleKey === "owner" && access.roleKey !== "owner") {
    throw new Error("Only an owner can assign the Owner role.");
  }

  const existing = await db
    .select({ id: organizationMemberships.id, userId: organizationMemberships.userId })
    .from(organizationMemberships)
    .where(
      and(
        eq(organizationMemberships.id, targetMembershipId),
        eq(organizationMemberships.organizationId, access.organizationId),
      ),
    )
    .limit(1);

  if (!existing[0]) throw new Error("Member not found.");
  if (existing[0].userId === userId) throw new Error("You cannot change your own role.");

  await db
    .update(organizationMemberships)
    .set({ roleId: role.id, updatedAt: new Date() })
    .where(eq(organizationMemberships.id, targetMembershipId));
}

export async function updateMemberStatusForUser(
  userId: string,
  targetMembershipId: string,
  newStatus: "active" | "suspended",
): Promise<void> {
  const access = await getTeamAccessForUser(userId);
  if (!access) throw new Error("No active organization found.");
  if (!access.canManage) throw new Error("You do not have permission to manage members.");

  const existing = await db
    .select({ id: organizationMemberships.id, userId: organizationMemberships.userId })
    .from(organizationMemberships)
    .where(
      and(
        eq(organizationMemberships.id, targetMembershipId),
        eq(organizationMemberships.organizationId, access.organizationId),
      ),
    )
    .limit(1);

  if (!existing[0]) throw new Error("Member not found.");
  if (existing[0].userId === userId) throw new Error("You cannot change your own status.");

  await db
    .update(organizationMemberships)
    .set({ status: newStatus, updatedAt: new Date() })
    .where(eq(organizationMemberships.id, targetMembershipId));
}

export async function removeMemberForUser(
  userId: string,
  targetMembershipId: string,
): Promise<void> {
  const access = await getTeamAccessForUser(userId);
  if (!access) throw new Error("No active organization found.");
  if (!access.canManage) throw new Error("You do not have permission to remove members.");

  const existing = await db
    .select({ id: organizationMemberships.id, userId: organizationMemberships.userId })
    .from(organizationMemberships)
    .where(
      and(
        eq(organizationMemberships.id, targetMembershipId),
        eq(organizationMemberships.organizationId, access.organizationId),
      ),
    )
    .limit(1);

  if (!existing[0]) throw new Error("Member not found.");
  if (existing[0].userId === userId) throw new Error("You cannot remove yourself.");

  await db
    .delete(organizationMemberships)
    .where(eq(organizationMemberships.id, targetMembershipId));
}
