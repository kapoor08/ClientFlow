import "server-only";

import { and, eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import { orgIntegrations, type SlackIntegrationConfig } from "@/db/schema";

export const SLACK_PROVIDER = "slack" as const;

export type SlackIntegrationRow = {
  id: string;
  organizationId: string;
  enabled: boolean;
  config: SlackIntegrationConfig;
  installedByUserId: string | null;
  installedAt: Date;
};

function rowFromDb(row: typeof orgIntegrations.$inferSelect): SlackIntegrationRow {
  return {
    id: row.id,
    organizationId: row.organizationId,
    enabled: row.enabled,
    config: (row.config ?? {}) as SlackIntegrationConfig,
    installedByUserId: row.installedByUserId,
    installedAt: row.installedAt,
  };
}

export async function getSlackIntegration(
  organizationId: string,
): Promise<SlackIntegrationRow | null> {
  const [row] = await db
    .select()
    .from(orgIntegrations)
    .where(
      and(
        eq(orgIntegrations.organizationId, organizationId),
        eq(orgIntegrations.provider, SLACK_PROVIDER),
      ),
    )
    .limit(1);

  return row ? rowFromDb(row) : null;
}

export async function upsertSlackIntegration(input: {
  organizationId: string;
  config: SlackIntegrationConfig;
  installedByUserId: string;
}): Promise<void> {
  await db
    .insert(orgIntegrations)
    .values({
      id: crypto.randomUUID(),
      organizationId: input.organizationId,
      provider: SLACK_PROVIDER,
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

export async function deleteSlackIntegration(organizationId: string): Promise<void> {
  await db
    .delete(orgIntegrations)
    .where(
      and(
        eq(orgIntegrations.organizationId, organizationId),
        eq(orgIntegrations.provider, SLACK_PROVIDER),
      ),
    );
}

export async function setSlackEnabled(organizationId: string, enabled: boolean): Promise<void> {
  await db
    .update(orgIntegrations)
    .set({ enabled, updatedAt: new Date() })
    .where(
      and(
        eq(orgIntegrations.organizationId, organizationId),
        eq(orgIntegrations.provider, SLACK_PROVIDER),
      ),
    );
}
