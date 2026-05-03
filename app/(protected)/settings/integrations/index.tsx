import { AlertTriangle, Building2 } from "lucide-react";
import { getServerSession } from "@/server/auth/session";
import { getOrganizationSettingsContextForUser } from "@/server/organization-settings";
import { getSlackIntegration } from "@/server/integrations/slack/repository";
import { SlackIntegrationCard } from "@/components/settings/SlackIntegrationCard";

// Microsoft Teams card is hidden for now - the integration code is built
// but personal Microsoft accounts can't create the Power Automate flows it
// requires. Re-enable by restoring the import and the card in the JSX
// below, plus uncommenting the Teams arm in
// server/integrations/broadcasts.ts.
// import { getTeamsIntegration } from "@/server/integrations/teams/repository";
// import { TeamsIntegrationCard } from "@/components/settings/TeamsIntegrationCard";

const IntegrationsSettingsPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ connected?: string; error?: string }>;
}) => {
  const session = await getServerSession();
  const ctx = session?.user ? await getOrganizationSettingsContextForUser(session.user.id) : null;

  const slack = ctx ? await getSlackIntegration(ctx.organizationId) : null;
  const params = await searchParams;

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-foreground text-2xl font-semibold">Integrations</h1>
        <p className="text-muted-foreground text-sm">
          Connect ClientFlow to the tools your team already uses.
        </p>
      </div>

      {!ctx ? (
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
                No active organization is linked to this account yet.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <SlackIntegrationCard
            integration={
              slack
                ? {
                    enabled: slack.enabled,
                    teamName: slack.config.teamName,
                    channelName: slack.config.channelName,
                    installedAt: slack.installedAt.toISOString(),
                  }
                : null
            }
            canManage={ctx.canManageSettings}
            connected={params.connected === "slack"}
            error={params.error ?? null}
          />
          {/* Microsoft Teams card temporarily hidden - see comment at top of file. */}
        </div>
      )}
    </div>
  );
};

export default IntegrationsSettingsPage;
