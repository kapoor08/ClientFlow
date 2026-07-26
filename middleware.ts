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
  "better-auth.session_token", // development (localhost HTTP)
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
const PUBLIC_PREFIXES = ["/auth/", "/api/auth/", "/_next/", "/favicon", "/logo"];

/**
 * Production hostname for the status page. The status subdomain is *also*
 * served from the main app codebase via internal rewrite to `/status/*`;
 * users only ever see `status.client-flow.in/...` in the URL bar.
 *
 * In dev, `status.localhost:3000` works the same way - modern browsers
 * (Chrome 65+, Firefox 84+, Safari 14+) resolve `*.localhost` to loopback
 * automatically per RFC 6761, so no /etc/hosts edit is required.
 */
const PRODUCTION_STATUS_HOST = "status.client-flow.in";

function isStatusHost(host: string): boolean {
  return host.toLowerCase().startsWith("status.");
}

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
  // 2FA challenge endpoints (verify-totp / verify-backup-code). Without this
  // they fall to the general 120/60s bucket = ~120 guesses/min against a
  // 6-digit code; the strict auth bucket (10/10s) throttles brute force.
  "/api/auth/two-factor",
];

/**
 * Content-Security-Policy (P2-2). Built per-request so `script-src` carries a
 * fresh nonce instead of `'unsafe-inline'`. `'strict-dynamic'` trusts scripts
 * loaded by the nonced entrypoints (e.g. Stripe.js pulled in by the bundle), so
 * the host allowlist is a CSP2 fallback. Production only - dev uses inline
 * `eval` for HMR/Fast Refresh. Ships Report-Only by default; set CSP_ENFORCE=1
 * once verified in-browser (zero violations across all routes) to enforce.
 */
function buildCsp(nonce: string): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://js.stripe.com https://va.vercel-scripts.com https://vercel.live`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://api.stripe.com https://*.ingest.sentry.io https://*.ingest.us.sentry.io https://*.ingest.de.sentry.io",
    "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join("; ");
}

function getClientIp(request: NextRequest): string {
  // Prefer Vercel's platform-injected header: the edge derives it from the real
  // connection and strips any client-supplied `x-vercel-*`, so it cannot be
  // forged (unlike the leftmost `x-forwarded-for` entry, which a client
  // controls). Fall back to x-real-ip / XFF for local dev and non-Vercel hosts.
  return (
    request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

type LimitResult = Awaited<ReturnType<typeof authRatelimit.limit>>;

const RATE_LIMIT_TIMEOUT_MS = 2000;

/**
 * Runs an Upstash limiter without ever letting a Redis outage take the whole
 * site down. The middleware matcher covers every page and API route, so an
 * un-guarded `.limit()` rejection (or hang) becomes a 500 on *everything*,
 * including `/api/health` and every auth flow - a hard outage that fails
 * closed. We instead fail **open**: on any limiter error or a >2s stall we log
 * a warning and return `null`, and the caller lets the request through.
 */
async function safeLimit(limiter: typeof authRatelimit, ip: string): Promise<LimitResult | null> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const timeout = new Promise<null>((resolve) => {
      timer = setTimeout(() => resolve(null), RATE_LIMIT_TIMEOUT_MS);
    });
    const result = await Promise.race([limiter.limit(ip), timeout]);
    if (result === null) {
      console.warn("[middleware] rate limiter timed out; failing open");
    }
    return result;
  } catch (err) {
    console.warn("[middleware] rate limiter unavailable; failing open:", err);
    return null;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/**
 * Trust upstream `x-request-id` if present (Vercel forwards one), otherwise
 * mint a fresh one. The ID is forwarded onto the request so server components
 * can read it via `headers().get("x-request-id")` and is echoed back on the
 * response so clients can quote it when reporting bugs.
 */
function ensureRequestId(request: NextRequest): { id: string; headers: Headers } {
  const incoming = request.headers.get("x-request-id");
  const id = incoming && incoming.length <= 200 ? incoming : crypto.randomUUID();
  const headers = new Headers(request.headers);
  headers.set("x-request-id", id);
  // Forward the request pathname so server components / layouts can gate on
  // it (e.g. plan-based route access). `headers().get('x-pathname')` then
  // returns the URL the user requested, regardless of Next's internal
  // rewrites.
  headers.set("x-pathname", request.nextUrl.pathname);
  return { id, headers };
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get("host") ?? "";
  const ip = getClientIp(request);
  const { id: requestId, headers: forwardedHeaders } = ensureRequestId(request);

  // Per-request CSP nonce (production only). Setting the nonce + CSP on the
  // *request* headers is what makes Next auto-nonce its own inline/hydration
  // scripts; the same policy is echoed on every response below (P2-2).
  const cspEnabled = process.env.NODE_ENV === "production";
  const nonce = cspEnabled ? btoa(crypto.randomUUID()) : "";
  const csp = cspEnabled ? buildCsp(nonce) : "";
  if (cspEnabled) {
    forwardedHeaders.set("x-nonce", nonce);
    // Next reads the nonce from this exact request header (always the enforcing
    // key; report-only is a response-side concept applied below).
    forwardedHeaders.set("Content-Security-Policy", csp);
  }

  const withRequestId = (res: NextResponse) => {
    res.headers.set("x-request-id", requestId);
    if (cspEnabled) {
      // Report-Only by default during rollout so a missed inline script can't
      // break prod; flip to enforcing with CSP_ENFORCE=1 after verification.
      const key =
        process.env.CSP_ENFORCE === "1"
          ? "Content-Security-Policy"
          : "Content-Security-Policy-Report-Only";
      res.headers.set(key, csp);
    }
    return res;
  };
  const passThrough = () =>
    withRequestId(NextResponse.next({ request: { headers: forwardedHeaders } }));

  // ── Status subdomain routing ──────────────────────────────────────────────
  // Requests to `status.<host>` are rewritten internally to `/status/...`.
  // The user-visible URL stays on the subdomain. Pages and route handlers
  // therefore live under `app/status/`, not at the root.
  if (isStatusHost(host)) {
    // Avoid double-rewriting if Next has already routed internally.
    if (!pathname.startsWith("/status")) {
      const rewriteUrl = request.nextUrl.clone();
      rewriteUrl.pathname = pathname === "/" ? "/status" : `/status${pathname}`;
      return withRequestId(
        NextResponse.rewrite(rewriteUrl, { request: { headers: forwardedHeaders } }),
      );
    }
    return passThrough();
  }

  // Main host hitting `/status/*` in production - send the user to the
  // canonical subdomain. In dev, allow the path-based variant so localhost
  // testing without a subdomain still works.
  if (process.env.NODE_ENV === "production" && pathname.startsWith("/status")) {
    const targetPath = pathname.replace(/^\/status/, "") || "/";
    const target = new URL(
      `https://${PRODUCTION_STATUS_HOST}${targetPath}${request.nextUrl.search}`,
    );
    return NextResponse.redirect(target, 308);
  }

  // Rate limit auth endpoints (stricter)
  if (AUTH_API_PREFIXES.some((p) => pathname.startsWith(p))) {
    const result = await safeLimit(authRatelimit, ip);
    if (result && !result.success) {
      const { limit, remaining, reset } = result;
      return withRequestId(
        new NextResponse(JSON.stringify({ error: "Too many requests. Please try again later." }), {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "X-RateLimit-Limit": String(limit),
            "X-RateLimit-Remaining": String(remaining),
            "X-RateLimit-Reset": String(reset),
            "Retry-After": String(Math.ceil((reset - Date.now()) / 1000)),
          },
        }),
      );
    }
    return passThrough();
  }

  // Rate limit all other API routes (general).
  // /api/health is intentionally included - uptime probes at 60s cadence from
  // a single IP stay well under the 120/60s bucket, and any runaway caller
  // shouldn't bypass the limit just because the endpoint is cheap.
  if (pathname.startsWith("/api/")) {
    const result = await safeLimit(apiRatelimit, ip);
    if (result && !result.success) {
      const { limit, remaining, reset } = result;
      return withRequestId(
        new NextResponse(JSON.stringify({ error: "Too many requests. Please try again later." }), {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "X-RateLimit-Limit": String(limit),
            "X-RateLimit-Remaining": String(remaining),
            "X-RateLimit-Reset": String(reset),
            "Retry-After": String(Math.ceil((reset - Date.now()) / 1000)),
          },
        }),
      );
    }
    return passThrough();
  }

  // Always allow public paths
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    return passThrough();
  }

  // Check if this is a protected route
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  if (!isProtected) return passThrough();

  // Check for a session cookie (works for both dev and production cookie names)
  const sessionToken = SESSION_COOKIES.some((name) => request.cookies.get(name)?.value);

  if (!sessionToken) {
    // No session - redirect to sign-in, preserving the intended destination
    const signInUrl = new URL("/auth/sign-in", request.url);
    signInUrl.searchParams.set("redirectTo", pathname);
    return withRequestId(NextResponse.redirect(signInUrl));
  }

  // Session exists - allow through.
  // Deep SSO enforcement (checking if the org requires SSO for this specific
  // user) is handled at the application layer in server components, since
  // middleware runs on the Edge Runtime without access to the database.
  return passThrough();
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
