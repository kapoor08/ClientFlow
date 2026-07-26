import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { and, eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import { session, account, user } from "@/db/auth-schema";
import { organizationMemberships } from "@/db/schema";
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
    //
    // Security (P0-4): the org whose SSO was used (`storedOrg` →
    // `ctx.organizationId`) controls the IdP that just asserted this email.
    // An EXISTING account may therefore be authenticated through this IdP only
    // if it is already an active member of THIS org. Without that check, a
    // malicious org admin can point `ssoConfig` at an IdP they control, assert
    // any victim's email, and have a session minted for the victim
    // (cross-org account takeover). A NEW account is auto-created only when the
    // IdP asserts a verified email, and (per existing behavior) lands in its
    // own bootstrapped workspace rather than joining `storedOrg`.
    const normalizedEmail = userInfo.email.toLowerCase();
    let [existingUser] = await db
      .select({ id: user.id, name: user.name, email: user.email })
      .from(user)
      .where(eq(user.email, normalizedEmail))
      .limit(1);

    const isNewUser = !existingUser;
    const userName = userInfo.name ?? userInfo.email.split("@")[0];

    if (existingUser) {
      const [membership] = await db
        .select({ id: organizationMemberships.id })
        .from(organizationMemberships)
        .where(
          and(
            eq(organizationMemberships.organizationId, ctx.organizationId),
            eq(organizationMemberships.userId, existingUser.id),
            eq(organizationMemberships.status, "active"),
          ),
        )
        .limit(1);

      if (!membership) return ssoError("not_a_member");
    } else {
      if (userInfo.email_verified !== true) return ssoError("email_not_verified");

      const userId = crypto.randomUUID();
      await db.insert(user).values({
        id: userId,
        name: userName,
        email: normalizedEmail,
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      existingUser = { id: userId, name: userName, email: normalizedEmail };

      // Bootstrap workspace for new user (creates org + membership)
      await bootstrapWorkspaceForUser({
        id: userId,
        name: userName,
        email: normalizedEmail,
      });
    }

    // ── Upsert SSO account record ───────────────────────────────────────────
    // Scoped to the `sso` provider so we never overwrite the tokens of the
    // user's other accounts (e.g. password/credential or Google).
    const [existingAccount] = await db
      .select({ id: account.id })
      .from(account)
      .where(and(eq(account.userId, existingUser.id), eq(account.providerId, "sso")))
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
        .where(and(eq(account.userId, existingUser.id), eq(account.providerId, "sso")));
    }

    // ── Create BetterAuth session ───────────────────────────────────────────
    // MFA note (P1-12): SSO delegates MFA to the org's IdP (the standard
    // enterprise model). Combined with the active-membership binding above
    // (P0-4), only real members of the org whose admin configured the IdP can
    // authenticate here, so the app's TOTP is intentionally not additionally
    // enforced on this federated path.
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
