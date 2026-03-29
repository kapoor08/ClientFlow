import "server-only";

import { eq } from "drizzle-orm";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { db } from "@/lib/db";
import { organizationSettings, organizations, organizationMemberships } from "@/db/schema";
import { user } from "@/db/auth-schema";

// ─── Types ─────────────────────────────────────────────────────────────────────

export type SsoConfig = {
  enabled: boolean;
  providerType: "oidc" | "saml" | "google" | "azure" | "okta";
  discoveryUrl: string;
  clientId: string;
  clientSecret: string;
  entityId?: string;
};

type OidcDiscovery = {
  authorization_endpoint: string;
  token_endpoint: string;
  userinfo_endpoint?: string;
  jwks_uri?: string;
  issuer: string;
};

type OidcTokenResponse = {
  access_token: string;
  id_token?: string;
  token_type: string;
  expires_in?: number;
};

type OidcUserInfo = {
  sub: string;
  email: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  email_verified?: boolean;
};

export type SsoOrgContext = {
  organizationId: string;
  organizationSlug: string;
  config: SsoConfig;
};

// ─── Org lookup ────────────────────────────────────────────────────────────────

/**
 * Given an email address, looks up whether the user's org has SSO enabled.
 * Matches on the email domain against all org member email addresses.
 */
export async function getSsoContextForEmail(
  email: string,
): Promise<SsoOrgContext | null> {
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) return null;

  // Find organizations that:
  // 1. Have a member with an email matching this domain
  // 2. Have ssoConfig with enabled = true
  const rows = await db
    .select({
      organizationId: organizations.id,
      organizationSlug: organizations.slug,
      ssoConfig: organizationSettings.ssoConfig,
    })
    .from(organizationMemberships)
    .innerJoin(user, eq(organizationMemberships.userId, user.id))
    .innerJoin(organizations, eq(organizationMemberships.organizationId, organizations.id))
    .innerJoin(
      organizationSettings,
      eq(organizationSettings.organizationId, organizations.id),
    )
    .where(eq(user.email, email))
    .limit(1);

  for (const row of rows) {
    const cfg = row.ssoConfig as SsoConfig | null;
    if (cfg?.enabled && cfg.clientId && cfg.discoveryUrl) {
      return {
        organizationId: row.organizationId,
        organizationSlug: row.organizationSlug,
        config: cfg,
      };
    }
  }

  return null;
}

/**
 * Looks up SSO config by org slug (used by the initiate endpoint).
 */
export async function getSsoContextBySlug(
  slug: string,
): Promise<SsoOrgContext | null> {
  const [row] = await db
    .select({
      organizationId: organizations.id,
      organizationSlug: organizations.slug,
      ssoConfig: organizationSettings.ssoConfig,
    })
    .from(organizations)
    .innerJoin(
      organizationSettings,
      eq(organizationSettings.organizationId, organizations.id),
    )
    .where(eq(organizations.slug, slug))
    .limit(1);

  if (!row) return null;

  const cfg = row.ssoConfig as SsoConfig | null;
  if (!cfg?.enabled || !cfg.clientId || !cfg.discoveryUrl) return null;

  return {
    organizationId: row.organizationId,
    organizationSlug: row.organizationSlug,
    config: cfg,
  };
}

// ─── OIDC Discovery ────────────────────────────────────────────────────────────

const discoveryCache = new Map<string, { data: OidcDiscovery; expiresAt: number }>();

export async function discoverOidcEndpoints(
  discoveryUrl: string,
): Promise<OidcDiscovery> {
  const cached = discoveryCache.get(discoveryUrl);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  const res = await fetch(discoveryUrl, {
    signal: AbortSignal.timeout(8_000),
    next: { revalidate: 3600 },
  } as RequestInit);

  if (!res.ok) {
    throw new Error(`OIDC discovery failed: ${res.status} ${res.statusText}`);
  }

  const data = (await res.json()) as OidcDiscovery;

  if (!data.authorization_endpoint || !data.token_endpoint) {
    throw new Error("OIDC discovery document is missing required endpoints.");
  }

  discoveryCache.set(discoveryUrl, {
    data,
    expiresAt: Date.now() + 3600_000, // 1 hour cache
  });

  return data;
}

// ─── Authorization URL ─────────────────────────────────────────────────────────

export function buildOidcAuthorizationUrl(params: {
  authorizationEndpoint: string;
  clientId: string;
  redirectUri: string;
  state: string;
  nonce: string;
  loginHint?: string;
}): string {
  const url = new URL(params.authorizationEndpoint);
  url.searchParams.set("client_id", params.clientId);
  url.searchParams.set("redirect_uri", params.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("state", params.state);
  url.searchParams.set("nonce", params.nonce);
  if (params.loginHint) {
    url.searchParams.set("login_hint", params.loginHint);
  }
  return url.toString();
}

// ─── Token exchange ─────────────────────────────────────────────────────────────

export async function exchangeCodeForTokens(params: {
  tokenEndpoint: string;
  code: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}): Promise<OidcTokenResponse> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code: params.code,
    redirect_uri: params.redirectUri,
    client_id: params.clientId,
    client_secret: params.clientSecret,
  });

  const res = await fetch(params.tokenEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
    signal: AbortSignal.timeout(10_000),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token exchange failed: ${res.status} — ${text}`);
  }

  return res.json() as Promise<OidcTokenResponse>;
}

// ─── ID Token verification (JWKS) ─────────────────────────────────────────────

/**
 * Verifies an OIDC ID token cryptographically using the IdP's JWKS endpoint,
 * then validates standard claims (iss, aud, exp, nonce).
 *
 * Falls back to claim-only parsing when no jwks_uri is available.
 */
export async function verifyIdToken(
  idToken: string,
  jwksUri: string | undefined,
  expectedNonce: string,
  expectedClientId: string,
  expectedIssuer: string,
): Promise<OidcUserInfo> {
  if (jwksUri) {
    const JWKS = createRemoteJWKSet(new URL(jwksUri));

    const { payload } = await jwtVerify(idToken, JWKS, {
      audience: expectedClientId,
      issuer: expectedIssuer,
    });

    // Nonce check
    if (payload.nonce && payload.nonce !== expectedNonce) {
      throw new Error("ID token nonce mismatch.");
    }

    const email = payload.email as string | undefined;
    if (!email) throw new Error("ID token is missing the email claim.");

    return {
      sub: payload.sub as string,
      email,
      name: payload.name as string | undefined,
      given_name: payload.given_name as string | undefined,
      family_name: payload.family_name as string | undefined,
      email_verified: payload.email_verified as boolean | undefined,
    };
  }

  // Fallback: claim-only validation (no JWKS URI in discovery document)
  return parseIdToken(idToken, expectedNonce, expectedClientId);
}

/**
 * Decodes and validates JWT claims from an OIDC ID token without signature verification.
 * Used as a fallback when jwks_uri is not available in the discovery document.
 */
export function parseIdToken(
  idToken: string,
  expectedNonce: string,
  expectedClientId: string,
): OidcUserInfo & { nonce?: string } {
  const parts = idToken.split(".");
  if (parts.length !== 3) throw new Error("Malformed ID token.");

  const payload = JSON.parse(
    Buffer.from(parts[1], "base64url").toString("utf8"),
  ) as Record<string, unknown>;

  // Expiry check
  if (typeof payload.exp === "number" && payload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error("ID token has expired.");
  }

  // Audience check
  const aud = payload.aud;
  const audList = Array.isArray(aud) ? aud : [aud];
  if (!audList.includes(expectedClientId)) {
    throw new Error("ID token audience mismatch.");
  }

  // Nonce check
  if (payload.nonce && payload.nonce !== expectedNonce) {
    throw new Error("ID token nonce mismatch.");
  }

  const email = payload.email as string | undefined;
  if (!email) throw new Error("ID token is missing the email claim.");

  return {
    sub: payload.sub as string,
    email,
    name: payload.name as string | undefined,
    given_name: payload.given_name as string | undefined,
    family_name: payload.family_name as string | undefined,
    email_verified: payload.email_verified as boolean | undefined,
    nonce: payload.nonce as string | undefined,
  };
}

// ─── Userinfo endpoint fallback ────────────────────────────────────────────────

export async function fetchUserInfo(
  userinfoEndpoint: string,
  accessToken: string,
): Promise<OidcUserInfo> {
  const res = await fetch(userinfoEndpoint, {
    headers: { Authorization: `Bearer ${accessToken}` },
    signal: AbortSignal.timeout(8_000),
  });

  if (!res.ok) throw new Error(`Userinfo request failed: ${res.status}`);
  return res.json() as Promise<OidcUserInfo>;
}
