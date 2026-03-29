import { NextRequest, NextResponse } from "next/server";

/**
 * Session cookie name must match what BetterAuth sets.
 * BetterAuth default: "better-auth.session_token"
 */
const SESSION_COOKIE = "better-auth.session_token";

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
  "/audit-logs",
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

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow public paths
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Check if this is a protected route
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();

  // Check for a session cookie
  const sessionToken = request.cookies.get(SESSION_COOKIE)?.value;

  if (!sessionToken) {
    // No session — redirect to sign-in, preserving the intended destination
    const signInUrl = new URL("/auth/sign-in", request.url);
    signInUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(signInUrl);
  }

  // Session exists — allow through.
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
