import "server-only";

/**
 * Thin wrapper around POSTing JSON to a Power Automate webhook. The URL
 * itself carries the auth (HMAC `sig` query parameter), so there's nothing
 * else to send - no headers, no tokens.
 */

export async function postToPowerAutomate(input: {
  webhookUrl: string;
  payload: Record<string, unknown>;
}): Promise<{ ok: boolean; status: number; body: string }> {
  const res = await fetch(input.webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input.payload),
  });
  // Power Automate returns 202 Accepted with an empty body on success.
  // 4xx/5xx come back with a JSON error envelope.
  const body = await res.text();
  return { ok: res.ok, status: res.status, body };
}

/**
 * Permissive validation of a Power Automate / Logic Apps webhook URL.
 * Microsoft's Workflows-app trigger always issues URLs on the
 * `*.logic.azure.com` host with a `sig` query parameter for HMAC auth.
 * We reject anything else so a typo can't silently leak task data to a
 * random endpoint.
 */
export function isValidPowerAutomateUrl(raw: string): boolean {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return false;
  }
  if (url.protocol !== "https:") return false;
  if (!url.hostname.endsWith(".logic.azure.com")) return false;
  if (!url.searchParams.has("sig")) return false;
  return true;
}
