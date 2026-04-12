import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import { session, account, user } from "@/db/auth-schema";
import {
  getSsoContextBySlug,
  discoverOidcEndpoints,
  exchangeCodeForTokens,
  verifyIdToken,
  fetchUserInfo,
} from "@/server/security/sso";
import { bootstrapWorkspaceForUser } from "@/server/organization-settings";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const REDIRECT_URI = `${BASE_URL}/api/auth/sso/callback`;
const SESSION_DAYS = 30;

// BetterAuth session cookie name (must match what BetterAuth reads)
const SESSION_COOKIE = "better-auth.session_token";

function ssoError(reason: string): NextResponse {
  const url = new URL("/auth/sso", BASE_URL);
  url.searchParams.set("error", reason);
  return NextResponse.redirect(url);
}

/**
 * GET /api/auth/sso/callback?code=...&state=...
 *
 * 1. Validates state cookie to prevent CSRF
 * 2. Exchanges the authorization code for tokens
 * 3. Parses the ID token and validates claims
 * 4. Creates or finds the user in the DB
 * 5. Creates a BetterAuth session directly in the DB
 * 6. Sets the session cookie and redirects to dashboard
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const returnedState = searchParams.get("state");
  const errorParam = searchParams.get("error");

  // IdP returned an error
  if (errorParam) {
    console.error("[SSO callback] IdP error:", errorParam, searchParams.get("error_description"));
    return ssoError("idp_error");
  }

  if (!code || !returnedState) {
    return ssoError("missing_params");
  }

  // ── Validate state (CSRF protection) ─────────────────────────────────────
  const storedState = request.cookies.get("sso_state")?.value;
  const storedNonce = request.cookies.get("sso_nonce")?.value;
  const storedOrg = request.cookies.get("sso_org")?.value;

  if (!storedState || storedState !== returnedState || !storedNonce || !storedOrg) {
    return ssoError("state_mismatch");
  }

  try {
    // ── Reload SSO config ───────────────────────────────────────────────────
    const ctx = await getSsoContextBySlug(storedOrg);
    if (!ctx) return ssoError("sso_not_configured");

    // ── OIDC discovery ──────────────────────────────────────────────────────
    const discovery = await discoverOidcEndpoints(ctx.config.discoveryUrl);

    // ── Token exchange ──────────────────────────────────────────────────────
    const tokens = await exchangeCodeForTokens({
      tokenEndpoint: discovery.token_endpoint,
      code,
      clientId: ctx.config.clientId,
      clientSecret: ctx.config.clientSecret,
      redirectUri: REDIRECT_URI,
    });

    // ── User info ───────────────────────────────────────────────────────────
    let userInfo: { sub: string; email: string; name?: string; email_verified?: boolean };

    if (tokens.id_token) {
      userInfo = await verifyIdToken(
        tokens.id_token,
        discovery.jwks_uri,
        storedNonce,
        ctx.config.clientId,
        discovery.issuer,
      );
    } else if (discovery.userinfo_endpoint) {
      userInfo = await fetchUserInfo(discovery.userinfo_endpoint, tokens.access_token);
    } else {
      return ssoError("no_user_info");
    }

    if (!userInfo.email) return ssoError("no_email");

    // ── Find or create user ─────────────────────────────────────────────────
    let [existingUser] = await db
      .select({ id: user.id, name: user.name, email: user.email })
      .from(user)
      .where(eq(user.email, userInfo.email.toLowerCase()))
      .limit(1);

    const isNewUser = !existingUser;
    const userName = userInfo.name ?? userInfo.email.split("@")[0];

    if (!existingUser) {
      const userId = crypto.randomUUID();
      await db.insert(user).values({
        id: userId,
        name: userName,
        email: userInfo.email.toLowerCase(),
        emailVerified: userInfo.email_verified ?? true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      existingUser = { id: userId, name: userName, email: userInfo.email.toLowerCase() };

      // Bootstrap workspace for new user (creates org + membership)
      await bootstrapWorkspaceForUser({
        id: userId,
        name: userName,
        email: userInfo.email.toLowerCase(),
      });
    }

    // ── Upsert SSO account record ───────────────────────────────────────────
    const [existingAccount] = await db
      .select({ id: account.id })
      .from(account)
      .where(eq(account.userId, existingUser.id))
      .limit(1);

    if (!existingAccount) {
      await db.insert(account).values({
        id: crypto.randomUUID(),
        accountId: userInfo.sub,
        providerId: "sso",
        userId: existingUser.id,
        idToken: tokens.id_token ?? null,
        accessToken: tokens.access_token,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    } else {
      await db
        .update(account)
        .set({
          accessToken: tokens.access_token,
          idToken: tokens.id_token ?? null,
          updatedAt: new Date(),
        })
        .where(eq(account.userId, existingUser.id));
    }

    // ── Create BetterAuth session ───────────────────────────────────────────
    const sessionToken = randomBytes(32).toString("hex");
    const sessionId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

    await db.insert(session).values({
      id: sessionId,
      token: sessionToken,
      userId: existingUser.id,
      expiresAt,
      createdAt: new Date(),
      updatedAt: new Date(),
      ipAddress: request.headers.get("x-forwarded-for") ?? null,
      userAgent: request.headers.get("user-agent") ?? null,
    });

    // ── Set cookie and redirect ─────────────────────────────────────────────
    const redirectPath = isNewUser ? "/onboarding" : "/dashboard";
    const response = NextResponse.redirect(new URL(redirectPath, BASE_URL));

    response.cookies.set(SESSION_COOKIE, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_DAYS * 24 * 60 * 60,
      path: "/",
    });

    // Clear SSO flow cookies
    response.cookies.delete("sso_state");
    response.cookies.delete("sso_nonce");
    response.cookies.delete("sso_org");

    return response;
  } catch (err) {
    console.error("[SSO callback] Error:", err);
    return ssoError("callback_failed");
  }
}
