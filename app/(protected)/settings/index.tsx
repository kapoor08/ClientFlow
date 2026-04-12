import { AlertTriangle, Building2 } from "lucide-react";
import { OrganizationSettingsForm } from "@/components/settings";
import { getServerSession } from "@/server/auth/session";
import { getOrganizationSettingsContextForUser } from "@/server/organization-settings";

const OrgSettingsPage = async () => {
  const session = await getServerSession();
  const settingsContext = session?.user
    ? await getOrganizationSettingsContextForUser(session.user.id)
    : null;

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-foreground">
          Organization Settings
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage your organization profile and authentication preferences.
        </p>
      </div>

      {settingsContext ? (
        <OrganizationSettingsForm initialValues={settingsContext} />
      ) : (
        <div className="max-w-2xl rounded-card border border-border bg-card p-6 shadow-cf-1">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-secondary p-2 text-muted-foreground">
              <AlertTriangle size={18} />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Building2 size={16} className="text-muted-foreground" />
                <h2 className="font-display text-base font-semibold text-foreground">
                  Workspace Not Ready
                </h2>
              </div>
              <p className="text-sm text-muted-foreground">
                No active organization is linked to this account yet. Complete
                workspace bootstrap before managing organization settings.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrgSettingsPage;
