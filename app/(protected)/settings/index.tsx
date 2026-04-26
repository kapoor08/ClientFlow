import { AlertTriangle, Building2 } from "lucide-react";
import { eq } from "drizzle-orm";
import { OrganizationSettingsForm } from "@/components/settings";
import { GstinSection } from "@/components/settings/GstinSection";
import { getServerSession } from "@/server/auth/session";
import { getOrganizationSettingsContextForUser } from "@/server/organization-settings";
import { db } from "@/server/db/client";
import { organizations } from "@/db/schema";

const OrgSettingsPage = async () => {
  const session = await getServerSession();
  const settingsContext = session?.user
    ? await getOrganizationSettingsContextForUser(session.user.id)
    : null;

  const gstRow = settingsContext
    ? ((
        await db
          .select({
            gstin: organizations.gstin,
            gstStateCode: organizations.gstStateCode,
            gstLegalName: organizations.gstLegalName,
          })
          .from(organizations)
          .where(eq(organizations.id, settingsContext.organizationId))
          .limit(1)
      )[0] ?? null)
    : null;

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-foreground text-2xl font-semibold">
          Organization Settings
        </h1>
        <p className="text-muted-foreground text-sm">
          Manage your organization profile and authentication preferences.
        </p>
      </div>

      {settingsContext ? (
        <div className="space-y-6">
          <OrganizationSettingsForm initialValues={settingsContext} />
          {settingsContext.canManageSettings && (
            <GstinSection
              initialGstin={gstRow?.gstin ?? null}
              initialGstLegalName={gstRow?.gstLegalName ?? null}
              initialGstStateCode={gstRow?.gstStateCode ?? null}
            />
          )}
        </div>
      ) : (
        <div className="rounded-card border-border bg-card shadow-cf-1 max-w-2xl border p-6">
          <div className="flex items-start gap-3">
            <div className="bg-secondary text-muted-foreground rounded-full p-2">
              <AlertTriangle size={18} />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Building2 size={16} className="text-muted-foreground" />
                <h2 className="font-display text-foreground text-base font-semibold">
                  Workspace Not Ready
                </h2>
              </div>
              <p className="text-muted-foreground text-sm">
                No active organization is linked to this account yet. Complete workspace bootstrap
                before managing organization settings.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrgSettingsPage;
