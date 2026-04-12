"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { useTeamMembers } from "@/core/team/useCase";
import type { TeamListResponse } from "@/core/team/entity";
import type { RolePermissionsConfig } from "@/config/role-permissions";
import { TeamMemberRow, SkeletonRow } from "@/components/teams";
import { SendInviteModal } from "@/components/invitations";

// ─── Page ─────────────────────────────────────────────────────────────────────

const TeamPage = ({ initialData, orgRolePermissions }: { initialData?: TeamListResponse; orgRolePermissions?: RolePermissionsConfig | null }) => {
  const { data, isLoading } = useTeamMembers(initialData);

  const members = data?.members ?? [];
  const access = data?.access;
  const assignableRoles = data?.assignableRoles ?? [];

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground">
            Team & Roles
          </h1>
          <p className="text-sm text-muted-foreground">
            {isLoading ? (
              <Skeleton className="inline-block h-3 w-20" />
            ) : (
              `${members.length} team member${members.length !== 1 ? "s" : ""}`
            )}
          </p>
        </div>
        {access?.canManage && <SendInviteModal />}
      </div>

      <div className="overflow-hidden rounded-card border border-border bg-card shadow-cf-1">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/50">
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                Member
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                Role
              </th>
              <th className="hidden px-4 py-3 text-left text-xs font-semibold text-muted-foreground sm:table-cell">
                Status
              </th>
              <th className="hidden px-4 py-3 text-left text-xs font-semibold text-muted-foreground md:table-cell">
                Projects
              </th>
              <th className="hidden px-4 py-3 text-left text-xs font-semibold text-muted-foreground lg:table-cell">
                Joined
              </th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)
            ) : members.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm text-muted-foreground">
                  No team members yet.
                </td>
              </tr>
            ) : (
              members.map((m) => (
                access && (
                  <TeamMemberRow
                    key={m.membershipId}
                    member={m}
                    access={access}
                    assignableRoles={assignableRoles}
                    orgRolePermissions={orgRolePermissions ?? null}
                  />
                )
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TeamPage;
