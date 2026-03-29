import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/get-session";
import { getOrganizationSettingsContextForUser } from "@/lib/organization-settings";
import { getRolePermissionsForOrg } from "@/lib/role-permissions";
import { RolePermissionsEditor } from "@/components/settings/RolePermissionsEditor";
import { authRoutes } from "@/core/auth";

export default async function RolePermissionsPage() {
  const session = await getServerSession();
  if (!session?.user) redirect(authRoutes.signIn);

  const ctx = await getOrganizationSettingsContextForUser(session.user.id);
  if (!ctx) redirect(authRoutes.signIn);
  if (!ctx.canManageSettings) redirect("/dashboard");

  const permissions = await getRolePermissionsForOrg(ctx.organizationId);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Role Permissions</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Control which modules each role can access and what actions they can
          perform. Owner and Admin roles always have full access.
        </p>
      </div>

      <div className="rounded-card border border-border bg-secondary/30 px-4 py-3 text-sm text-muted-foreground">
        Changes take effect immediately for all members with the affected role.
      </div>

      <RolePermissionsEditor initialPermissions={permissions} />
    </div>
  );
}
