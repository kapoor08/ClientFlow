import type { Metadata } from "next";
import { getServerSession } from "@/server/auth/session";
import { listTeamMembersForUser } from "@/server/team";
import { getOrganizationSettingsContextForUser } from "@/server/organization-settings";
import TeamsPage from ".";
import type { TeamListResponse } from "@/core/team/entity";

export const metadata: Metadata = {
  title: "Team & Roles",
};

export default async function Page() {
  const session = await getServerSession();
  const [result, orgCtx] = await Promise.all([
    listTeamMembersForUser(session!.user.id),
    getOrganizationSettingsContextForUser(session!.user.id),
  ]);

  const initialData: TeamListResponse = {
    access: result.access
      ? {
          canManage: result.access.canManage,
          roleKey: result.access.roleKey,
          currentUserId: result.access.userId,
        }
      : { canManage: false, roleKey: null, currentUserId: session!.user.id },
    members: result.members.map((m) => ({
      ...m,
      joinedAt: m.joinedAt ? m.joinedAt.toISOString() : null,
    })),
    assignableRoles: result.assignableRoles,
  };

  return <TeamsPage initialData={initialData} orgRolePermissions={orgCtx?.rolePermissionsConfig ?? null} />;
}
