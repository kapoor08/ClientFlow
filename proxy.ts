import { NextRequest, NextResponse } from "next/server";
import { authRatelimit, apiRatelimit } from "@/server/rate-limit";

/**
 * BetterAuth sets "better-auth.session_token" in development (HTTP).
 * In production (HTTPS / NODE_ENV=production) it automatically prepends
 * "__Secure-" to satisfy the Secure cookie prefix requirements.
 * We check both so the middleware works in all environments.
 */
const SESSION_COOKIES = [
  "__Secure-better-auth.session_token", // production (Vercel / any HTTPS)
  "better-auth.session_token",           // development (localhost HTTP)
];

/**
 * Route prefixes that require an authenticated session.
 */
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/projects",
  "/clients",
  "/tasks",
  "/files",
  "/billing",
  "/invoices",
  "/settings",
  "/teams",
  "/analytics",
  "/notifications",
  "/invitations",
  "/org-security",
  "/developer",
  "/activity-logs",
  "/client-portal",
  "/onboarding",
];

/**
 * Paths that are always public (never redirect to sign-in).
 */
const PUBLIC_PREFIXES = [
  "/auth/",
  "/api/auth/",
  "/_next/",
  "/favicon",
  "/logo",
];

/**
 * Auth API routes that get the stricter rate limit.
 */
const AUTH_API_PREFIXES = [
  "/api/auth/sign-in",
  "/api/auth/sign-up",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
  "/api/auth/send-verification-email",
  "/api/auth/verify-email",
];

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip = getClientIp(request);

  // Rate limit auth endpoints (stricter)
  if (AUTH_API_PREFIXES.some((p) => pathname.startsWith(p))) {
    const { success, limit, remaining, reset } = await authRatelimit.limit(ip);
    if (!success) {
      return new NextResponse(
        JSON.stringify({ error: "Too many requests. Please try again later." }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "X-RateLimit-Limit": String(limit),
            "X-RateLimit-Remaining": String(remaining),
            "X-RateLimit-Reset": String(reset),
            "Retry-After": String(Math.ceil((reset - Date.now()) / 1000)),
          },
        },
      );
    }
    return NextResponse.next();
  }

  // Rate limit all other API routes (general)
  if (pathname.startsWith("/api/")) {
    const { success, limit, remaining, reset } = await apiRatelimit.limit(ip);
    if (!success) {
      return new NextResponse(
        JSON.stringify({ error: "Too many requests. Please try again later." }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "X-RateLimit-Limit": String(limit),
            "X-RateLimit-Remaining": String(remaining),
            "X-RateLimit-Reset": String(reset),
            "Retry-After": String(Math.ceil((reset - Date.now()) / 1000)),
          },
        },
      );
    }
    return NextResponse.next();
  }

  // Always allow public paths
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Check if this is a protected route
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();

  // Check for a session cookie (works for both dev and production cookie names)
  const sessionToken = SESSION_COOKIES.some(
    (name) => request.cookies.get(name)?.value,
  );

  if (!sessionToken) {
    // No session - redirect to sign-in, preserving the intended destination
    const signInUrl = new URL("/auth/sign-in", request.url);
    signInUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(signInUrl);
  }

  // Session exists - allow through.
  // Deep SSO enforcement (checking if the org requires SSO for this specific
  // user) is handled at the application layer in server components, since
  // middleware runs on the Edge Runtime without access to the database.
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - Static files (_next/static, _next/image, favicon, logo, images)
     * - API routes that handle their own auth (api/auth/*)
     */
    "/((?!_next/static|_next/image|favicon\\.ico|logo\\.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
