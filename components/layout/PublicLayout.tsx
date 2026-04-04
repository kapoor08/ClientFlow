import type { ReactNode } from "react";
import PublicHeader from "./PublicHeader";
import PublicFooter from "./PublicFooter";
import { getServerSession } from "@/lib/get-session";
import {
  getOrganizationRoleLabel,
  getOrganizationSettingsContextForUser,
  getWorkspaceHomeHrefForRole,
} from "@/lib/organization-settings";

type PublicLayoutProps = {
  children: ReactNode;
};

const PublicLayout = async ({ children }: PublicLayoutProps) => {
  const session = await getServerSession();
  const organizationContext = session?.user
    ? await getOrganizationSettingsContextForUser(session.user.id)
    : null;

  const viewer = session?.user
    ? {
        name: session.user.name || "ClientFlow User",
        email: session.user.email,
        roleLabel: session.user.isPlatformAdmin
          ? "Super Admin"
          : getOrganizationRoleLabel(organizationContext?.roleKey ?? null),
        dashboardHref: session.user.isPlatformAdmin
          ? "/admin"
          : getWorkspaceHomeHrefForRole(organizationContext?.roleKey ?? null),
      }
    : null;

  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader viewer={viewer} />
      <main className="flex-1">{children}</main>
      <PublicFooter />
    </div>
  );
};

export default PublicLayout;
