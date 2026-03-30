import type { ReactNode } from "react";
import type { User } from "@/lib/auth";
import { getUserInitials } from "@/core/auth";
import SignOutButton from "@/components/auth/SignOutButton";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { TrialBanner } from "@/components/layout/TrialBanner";
import { GlobalSearch } from "@/components/layout/GlobalSearch";
import AppSidebar from "./AppSidebar";
import { OrgSwitcher, type OrgOption } from "./OrgSwitcher";
import type {
  RolePermissionsConfig,
  MemberPermissionOverrides,
} from "@/config/role-permissions";

type AppShellProps = {
  children: ReactNode;
  user: User;
  planCode: string;
  daysLeftInTrial: number | null;
  roleKey?: string | null;
  orgName?: string | null;
  logoUrl?: string | null;
  brandColor?: string | null;
  orgs?: OrgOption[];
  activeOrgId?: string;
  rolePermissions?: RolePermissionsConfig | null;
  memberPermissionOverrides?: MemberPermissionOverrides | null;
};

const AppShell = ({
  children,
  user,
  planCode,
  daysLeftInTrial,
  roleKey,
  orgName,
  logoUrl,
  brandColor,
  orgs,
  activeOrgId,
  rolePermissions,
  memberPermissionOverrides,
}: AppShellProps) => {
  const isClient = roleKey === "client";
  return (
    <div className="flex min-h-screen bg-background">
      {isClient ? (
        <AppSidebar
          mode="portal"
          logoUrl={logoUrl}
          brandColor={brandColor}
          orgName={orgName}
          rolePermissions={rolePermissions}
          memberPermissionOverrides={memberPermissionOverrides}
        />
      ) : (
        <AppSidebar
          mode="admin"
          planCode={planCode}
          roleKey={roleKey}
          logoUrl={logoUrl}
          orgName={orgName}
          brandColor={brandColor}
          rolePermissions={rolePermissions}
          memberPermissionOverrides={memberPermissionOverrides}
        />
      )}
      <div className="flex flex-1 flex-col min-w-0">
        {daysLeftInTrial !== null && <TrialBanner daysLeft={daysLeftInTrial} />}
        <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-card/80 px-6 backdrop-blur-lg">
          <div className="flex items-center gap-3">
            {orgs && orgs.length > 1 && activeOrgId && (
              <OrgSwitcher orgs={orgs} activeOrgId={activeOrgId} />
            )}
            <GlobalSearch />
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <div className="flex items-center gap-3 rounded-lg px-2 py-1 text-sm font-medium text-foreground">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                {getUserInitials(user.name, user.email)}
              </div>
              <div className="hidden text-left sm:block">
                <p className="leading-none">{user.name || "ClientFlow User"}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {user.email}
                </p>
              </div>
              <SignOutButton />
            </div>
          </div>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
};

export default AppShell;
