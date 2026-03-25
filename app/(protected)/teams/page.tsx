import type { Metadata } from "next";
import { getServerSession } from "@/lib/get-session";
import { listTeamMembersForUser } from "@/lib/team";
import TeamsPage from ".";
import type { TeamListResponse } from "@/core/team/entity";

export const metadata: Metadata = {
  title: "Team & Roles",
};

export default async function Page() {
  const session = await getServerSession();
  const result = await listTeamMembersForUser(session!.user.id);

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

  return <TeamsPage initialData={initialData} />;
}
