import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import {
  getSsoContextForEmail,
  getSsoContextBySlug,
  discoverOidcEndpoints,
  buildOidcAuthorizationUrl,
} from "@/lib/sso";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const REDIRECT_URI = `${BASE_URL}/api/auth/sso/callback`;

/**
 * GET /api/auth/sso/initiate?email=user@company.com
 * GET /api/auth/sso/initiate?org=my-org-slug
 *
 * Looks up SSO config for the org, builds the OIDC authorization URL,
 * stores state + nonce in short-lived cookies, and redirects to the IdP.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const email = searchParams.get("email");
  const orgSlug = searchParams.get("org");

  try {
    // Resolve SSO context
    let ctx = null;
    if (email) {
      ctx = await getSsoContextForEmail(email);
    } else if (orgSlug) {
      ctx = await getSsoContextBySlug(orgSlug);
    }

    if (!ctx) {
      const url = new URL("/auth/sso", BASE_URL);
      url.searchParams.set("error", "sso_not_configured");
      if (email) url.searchParams.set("email", email);
      return NextResponse.redirect(url);
    }

    // Discover OIDC endpoints
    const discovery = await discoverOidcEndpoints(ctx.config.discoveryUrl);

    // Generate state and nonce
    const state = randomBytes(24).toString("hex");
    const nonce = randomBytes(24).toString("hex");

    // Build redirect URL
    const authUrl = buildOidcAuthorizationUrl({
      authorizationEndpoint: discovery.authorization_endpoint,
      clientId: ctx.config.clientId,
      redirectUri: REDIRECT_URI,
      state,
      nonce,
      loginHint: email ?? undefined,
    });

    // Store state, nonce, and org in secure cookies (expires in 10 minutes)
    const response = NextResponse.redirect(authUrl);
    const cookieOpts = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      maxAge: 600, // 10 minutes
      path: "/",
    };

    response.cookies.set("sso_state", state, cookieOpts);
    response.cookies.set("sso_nonce", nonce, cookieOpts);
    response.cookies.set("sso_org", ctx.organizationSlug, cookieOpts);

    return response;
  } catch (err) {
    console.error("[SSO initiate]", err);
    const url = new URL("/auth/sso", BASE_URL);
    url.searchParams.set("error", "sso_discovery_failed");
    return NextResponse.redirect(url);
  }
}
