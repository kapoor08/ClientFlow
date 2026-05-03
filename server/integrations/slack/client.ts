import "server-only";

/**
 * Thin wrapper over the handful of Slack Web API calls we use. Anything more
 * elaborate would warrant pulling in @slack/web-api, but for our minimal
 * incoming-webhook + revoke-on-disconnect flow plain fetch is enough.
 */

const SLACK_OAUTH_ACCESS_URL = "https://slack.com/api/oauth.v2.access";
const SLACK_AUTH_REVOKE_URL = "https://slack.com/api/auth.revoke";

/**
 * Shape returned by oauth.v2.access for an app that requested the
 * `incoming-webhook` scope. Slack's response is loosely typed - this is only
 * the subset we actually persist.
 */
export type SlackOAuthAccessResponse = {
  ok: boolean;
  error?: string;
  access_token?: string;
  token_type?: string;
  scope?: string;
  bot_user_id?: string;
  app_id?: string;
  team?: { id: string; name: string };
  authed_user?: { id: string };
  incoming_webhook?: {
    channel: string;
    channel_id: string;
    configuration_url: string;
    url: string;
  };
};

export async function exchangeOAuthCode(input: {
  code: string;
  redirectUri: string;
}): Promise<SlackOAuthAccessResponse> {
  const clientId = process.env.SLACK_CLIENT_ID;
  const clientSecret = process.env.SLACK_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Slack OAuth credentials are not configured.");
  }

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    code: input.code,
    redirect_uri: input.redirectUri,
  });

  const res = await fetch(SLACK_OAUTH_ACCESS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  return (await res.json()) as SlackOAuthAccessResponse;
}

/**
 * Best-effort token revocation. Slack returns ok:true on success. Failures
 * are swallowed by the caller because the row is being deleted anyway -
 * leaving an orphaned token on Slack's side is annoying but not fatal.
 */
export async function revokeBotToken(token: string): Promise<{ ok: boolean }> {
  const res = await fetch(SLACK_AUTH_REVOKE_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = (await res.json()) as { ok: boolean };
  return json;
}

/**
 * POST a Block Kit / text payload to a workspace's incoming-webhook URL.
 * Slack returns plain "ok" on success or an error string otherwise.
 */
export async function postToIncomingWebhook(input: {
  webhookUrl: string;
  payload: Record<string, unknown>;
}): Promise<{ ok: boolean; status: number; body: string }> {
  const res = await fetch(input.webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input.payload),
  });
  const body = await res.text();
  return { ok: res.ok && body === "ok", status: res.status, body };
}
