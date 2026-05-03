import "server-only";

import { and, eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import { orgIntegrations, type TeamsIntegrationConfig } from "@/db/schema";

export const TEAMS_PROVIDER = "teams" as const;

export type TeamsIntegrationRow = {
  id: string;
  organizationId: string;
  enabled: boolean;
  config: TeamsIntegrationConfig;
  installedByUserId: string | null;
  installedAt: Date;
};

function rowFromDb(row: typeof orgIntegrations.$inferSelect): TeamsIntegrationRow {
  return {
    id: row.id,
    organizationId: row.organizationId,
    enabled: row.enabled,
    config: (row.config ?? {}) as TeamsIntegrationConfig,
    installedByUserId: row.installedByUserId,
    installedAt: row.installedAt,
  };
}

export async function getTeamsIntegration(
  organizationId: string,
): Promise<TeamsIntegrationRow | null> {
  const [row] = await db
    .select()
    .from(orgIntegrations)
    .where(
      and(
        eq(orgIntegrations.organizationId, organizationId),
        eq(orgIntegrations.provider, TEAMS_PROVIDER),
      ),
    )
    .limit(1);

  return row ? rowFromDb(row) : null;
}

export async function upsertTeamsIntegration(input: {
  organizationId: string;
  config: TeamsIntegrationConfig;
  installedByUserId: string;
}): Promise<void> {
  await db
    .insert(orgIntegrations)
    .values({
      id: crypto.randomUUID(),
      organizationId: input.organizationId,
      provider: TEAMS_PROVIDER,
      enabled: true,
      config: input.config as unknown as Record<string, unknown>,
      installedByUserId: input.installedByUserId,
      installedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [orgIntegrations.organizationId, orgIntegrations.provider],
      set: {
        enabled: true,
        config: input.config as unknown as Record<string, unknown>,
        installedByUserId: input.installedByUserId,
        installedAt: new Date(),
        updatedAt: new Date(),
      },
    });
}

export async function deleteTeamsIntegration(organizationId: string): Promise<void> {
  await db
    .delete(orgIntegrations)
    .where(
      and(
        eq(orgIntegrations.organizationId, organizationId),
        eq(orgIntegrations.provider, TEAMS_PROVIDER),
      ),
    );
}
