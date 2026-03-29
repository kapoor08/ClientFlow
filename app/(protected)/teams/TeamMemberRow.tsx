"use client";

import { useState } from "react";
import {
  MoreHorizontal,
  UserX,
  ShieldCheck,
  UserCheck,
  Settings2,
} from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useUpdateMemberRole,
  useSuspendMember,
  useReactivateMember,
  useRemoveMember,
} from "@/core/team/useCase";
import type { TeamMemberItem, AssignableRole, TeamAccess } from "@/core/team/entity";
import type { RolePermissionsConfig, MemberPermissionOverrides } from "@/config/role-permissions";
import { MemberPermissionsDialog } from "@/components/settings/MemberPermissionsDialog";

// ─── Badges ───────────────────────────────────────────────────────────────────

export const ROLE_BADGE: Record<string, string> = {
  owner: "bg-brand-100 text-primary",
  admin: "bg-cf-accent-100 text-cf-accent-600",
  manager: "bg-info/10 text-info",
  member: "bg-secondary text-muted-foreground",
  client: "bg-warning/10 text-warning",
};

export const STATUS_BADGE: Record<string, string> = {
  active: "bg-success/10 text-success",
  suspended: "bg-danger/10 text-danger",
  invited: "bg-warning/10 text-warning",
};

// ─── Avatar ───────────────────────────────────────────────────────────────────

function MemberAvatar({ name, image }: { name: string; image: string | null }) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (image) {
    return (
      <img
        src={image}
        alt={name}
        className="h-8 w-8 rounded-full object-cover"
      />
    );
  }
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-primary">
      {initials}
    </div>
  );
}

// ─── Member actions dropdown ──────────────────────────────────────────────────

type MemberActionsProps = {
  member: TeamMemberItem;
  access: TeamAccess;
  assignableRoles: AssignableRole[];
  orgRolePermissions: RolePermissionsConfig | null;
  onOpenPermissions: () => void;
};

function MemberActions({ member, access, assignableRoles, onOpenPermissions }: MemberActionsProps) {
  const updateRole = useUpdateMemberRole();
  const suspend = useSuspendMember();
  const reactivate = useReactivateMember();
  const remove = useRemoveMember();

  const isSelf = member.userId === access.currentUserId;
  const isPending =
    updateRole.isPending ||
    suspend.isPending ||
    remove.isPending ||
    reactivate.isPending;

  if (!access.canManage || isSelf) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="rounded-lg p-1 text-muted-foreground hover:bg-secondary transition-colors"
          disabled={isPending}
        >
          <MoreHorizontal size={16} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {/* Custom permissions */}
        <DropdownMenuItem onClick={onOpenPermissions} className="gap-2">
          <Settings2 size={14} />
          Custom permissions
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Change role submenu */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="gap-2">
            <ShieldCheck size={14} />
            Change role
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            {assignableRoles.map((role) => (
              <DropdownMenuItem
                key={role.key}
                disabled={role.key === member.roleKey}
                onClick={() =>
                  updateRole.mutate(
                    { membershipId: member.membershipId, roleKey: role.key },
                    {
                      onSuccess: () => toast.success(`Role updated to ${role.name}`),
                      onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to update role."),
                    },
                  )
                }
              >
                {role.name}
                {role.key === member.roleKey && (
                  <span className="ml-auto text-xs text-muted-foreground">Current</span>
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        {/* Suspend / Reactivate */}
        {member.status === "suspended" ? (
          <DropdownMenuItem
            onClick={() =>
              reactivate.mutate(
                { membershipId: member.membershipId },
                {
                  onSuccess: () => toast.success("Member reactivated."),
                  onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to reactivate member."),
                },
              )
            }
            className="gap-2"
          >
            <UserCheck size={14} />
            Reactivate
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem
            onClick={() =>
              suspend.mutate(
                { membershipId: member.membershipId },
                {
                  onSuccess: () => toast.success("Member suspended."),
                  onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to suspend member."),
                },
              )
            }
            className="gap-2"
          >
            <UserX size={14} />
            Suspend
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        {/* Remove */}
        <DropdownMenuItem
          onClick={() =>
            remove.mutate(
              { membershipId: member.membershipId },
              {
                onSuccess: () => toast.success("Team member removed."),
                onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to remove member."),
              },
            )
          }
          className="gap-2 text-danger focus:text-danger"
        >
          <UserX size={14} />
          Remove member
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ─── Skeleton row ─────────────────────────────────────────────────────────────

export function SkeletonRow() {
  return (
    <tr className="border-b border-border last:border-0">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-3 w-36" />
          </div>
        </div>
      </td>
      <td className="px-4 py-3"><Skeleton className="h-5 w-16 rounded-full" /></td>
      <td className="hidden px-4 py-3 sm:table-cell"><Skeleton className="h-5 w-16 rounded-full" /></td>
      <td className="hidden px-4 py-3 md:table-cell"><Skeleton className="h-3 w-6" /></td>
      <td className="hidden px-4 py-3 lg:table-cell"><Skeleton className="h-3 w-20" /></td>
      <td className="px-4 py-3" />
    </tr>
  );
}

// ─── TeamMemberRow ────────────────────────────────────────────────────────────

type TeamMemberRowProps = {
  member: TeamMemberItem;
  access: TeamAccess;
  assignableRoles: AssignableRole[];
  orgRolePermissions: RolePermissionsConfig | null;
};

export function TeamMemberRow({ member: m, access, assignableRoles, orgRolePermissions }: TeamMemberRowProps) {
  const [permDialogOpen, setPermDialogOpen] = useState(false);
  const [localOverrides, setLocalOverrides] = useState<MemberPermissionOverrides | null>(m.permissionOverrides);

  const hasCustomPerms = localOverrides && Object.keys(localOverrides).length > 0;

  return (
    <>
      <tr
        key={m.membershipId}
        className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors"
      >
        {/* Member */}
        <td className="px-4 py-3">
          <div className="flex items-center gap-3">
            <MemberAvatar name={m.name} image={m.image} />
            <div>
              <p className="font-medium text-foreground">{m.name}</p>
              <p className="text-xs text-muted-foreground">{m.email}</p>
            </div>
          </div>
        </td>

        {/* Role */}
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex rounded-pill px-2 py-0.5 text-xs font-medium capitalize ${ROLE_BADGE[m.roleKey] ?? "bg-secondary text-foreground"}`}
            >
              {m.roleName}
            </span>
            {hasCustomPerms && (
              <span className="inline-flex rounded-pill bg-info/10 px-1.5 py-0.5 text-[10px] font-medium text-info">
                Custom
              </span>
            )}
          </div>
        </td>

        {/* Status */}
        <td className="hidden px-4 py-3 sm:table-cell">
          <span
            className={`inline-flex rounded-pill px-2 py-0.5 text-xs font-medium capitalize ${STATUS_BADGE[m.status] ?? "bg-secondary text-foreground"}`}
          >
            {m.status}
          </span>
        </td>

        {/* Projects */}
        <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
          {m.projectCount}
        </td>

        {/* Joined */}
        <td className="hidden px-4 py-3 text-xs text-muted-foreground lg:table-cell">
          {m.joinedAt
            ? new Date(m.joinedAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })
            : "—"}
        </td>

        {/* Actions */}
        <td className="px-4 py-3 text-right">
          <MemberActions
            member={m}
            access={access}
            assignableRoles={assignableRoles}
            orgRolePermissions={orgRolePermissions}
            onOpenPermissions={() => setPermDialogOpen(true)}
          />
        </td>
      </tr>

      {/* Permissions dialog */}
      {access.canManage && m.userId !== access.currentUserId && (
        <MemberPermissionsDialog
          open={permDialogOpen}
          onOpenChange={setPermDialogOpen}
          membershipId={m.membershipId}
          memberName={m.name}
          roleKey={m.roleKey}
          roleName={m.roleName}
          orgRolePermissions={orgRolePermissions}
          initialOverrides={localOverrides}
          onSaved={setLocalOverrides}
        />
      )}
    </>
  );
}
