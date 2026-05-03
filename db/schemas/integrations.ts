import { boolean, index, jsonb, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { user } from "../auth-schema";
import { organizations } from "./access";
import { createdAt, updatedAt } from "./helpers";

/**
 * Per-organization third-party integrations (Slack today; Microsoft Teams,
 * GitHub, etc. follow the same shape).
 *
 * One row per (organization, provider). The `config` JSONB stores
 * provider-specific install state - for Slack that's the OAuth bot token,
 * the channel-scoped incoming-webhook URL, the team identifiers, and the
 * user-selected channel name.
 *
 * Tokens are stored in the database as Slack returns them. Treat this table
 * the same way you'd treat any other secrets store - row-level access is
 * gated by org membership at the data-access layer.
 */
export const orgIntegrations = pgTable(
  "org_integrations",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    provider: text("provider").notNull(),
    enabled: boolean("enabled").default(true).notNull(),
    config: jsonb("config").$type<Record<string, unknown>>(),
    installedByUserId: text("installed_by_user_id").references(() => user.id),
    installedAt: timestamp("installed_at").defaultNow().notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex("org_integrations_org_provider_unique").on(table.organizationId, table.provider),
    index("org_integrations_provider_idx").on(table.provider),
  ],
);

export type SlackIntegrationConfig = {
  /** Bot token returned by oauth.v2.access. Used for auth.revoke and chat.postMessage. */
  accessToken: string;
  /** Channel-scoped incoming-webhook URL. POST JSON here to deliver a message. */
  webhookUrl: string;
  /** Channel the user picked during install (e.g. "#general"). Display only. */
  channelName: string | null;
  /** Slack channel ID (e.g. "C0123ABC456"). For chat.postMessage if we ever switch. */
  channelId: string | null;
  /** Workspace ID (e.g. "T0123ABC456"). */
  teamId: string | null;
  /** Workspace display name (e.g. "Nebrion Tech"). For the connected-card UI. */
  teamName: string | null;
  /** ID of the bot user inside that workspace. */
  botUserId: string | null;
  /** Slack scopes granted at install time. Used to detect when we need a re-install. */
  scopes: string[];
};

/**
 * Microsoft Teams integration via Power Automate "When a Teams webhook
 * request is received" trigger.
 *
 * Microsoft is deprecating Office 365 Connectors / Incoming Webhooks, so
 * we use the modern Workflows-app path instead. The user creates a flow
 * in the Teams Workflows app from Microsoft's "Post to a channel when a
 * webhook request is received" template, then pastes the generated URL
 * into ClientFlow. We POST Adaptive Card payloads to that URL and the
 * flow forwards them to the chosen Teams channel.
 *
 * No OAuth tokens, no Azure registration, no admin consent - the auth is
 * baked into the URL's `sig` query parameter (HMAC of the trigger).
 */
export type TeamsIntegrationConfig = {
  /** Power Automate webhook URL (https://prod-NN.<region>.logic.azure.com/...). */
  webhookUrl: string;
  /** User-supplied label so they remember which channel/team it's wired to. */
  channelLabel: string | null;
};
