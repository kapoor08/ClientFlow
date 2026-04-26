import { withSentryConfig } from "@sentry/nextjs";
import bundleAnalyzer from "@next/bundle-analyzer";
import type { NextConfig } from "next";

/**
 * Bundle analyzer - emits HTML reports under `.next/analyze/` when
 * `ANALYZE=true` is set. Run with `npm run analyze`. Safe in normal builds:
 * the wrapper is a no-op when ANALYZE is unset.
 */
const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const isProduction = process.env.NODE_ENV === "production";

/**
 * Content-Security-Policy.
 *
 * Defaults to *enforcing* in production. The browser blocks resources that
 * fall outside the directive list below. To roll back to Report-Only without
 * a redeploy of new code, set `CSP_REPORT_ONLY=1` in the environment - the
 * header key flips from `Content-Security-Policy` to
 * `Content-Security-Policy-Report-Only` on the next request.
 *
 * Why an env flag rather than a code change: if a legitimate resource starts
 * being blocked in production, an env edit + Vercel redeploy is faster (and
 * leaves a clearer audit trail) than reverting code under pressure.
 *
 * Sources included:
 *   - `'self'` for first-party everything
 *   - `'unsafe-inline'` on script/style: needed by Next.js streaming hydration
 *     and Tailwind. A later iteration can move scripts to nonces via middleware.
 *   - Stripe: Elements (`js.stripe.com`), API (`api.stripe.com`), hosted-checkout
 *     iframes (`hooks.stripe.com`).
 *   - Sentry ingest: the SDK tunnels through `/monitoring` (same-origin), but
 *     the raw ingest domains are also allowed in case the tunnel is disabled.
 *   - Vercel scripts: Web Analytics + Speed Insights if/when they are added.
 *   - `data: blob: https:` on img-src covers user-uploaded avatars and
 *     branding logos that may come from any HTTPS origin.
 */
const cspReportOnly = process.env.CSP_REPORT_ONLY === "1";
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://js.stripe.com https://va.vercel-scripts.com https://vercel.live",
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

/**
 * Security headers applied to every response.
 *
 * `Permissions-Policy` locks down browser APIs that this app has no business
 * using. If a feature that requires one of these is added later, relax it here.
 *
 * `Strict-Transport-Security` is only sent in production - browsers refuse to
 * serve `localhost` over HTTPS, so HSTS on dev just causes confusion.
 */
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value:
      'camera=(), microphone=(), geolocation=(), interest-cohort=(), payment=(self "https://js.stripe.com")',
  },
  ...(isProduction
    ? [
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
        {
          // Enforcing by default. Set CSP_REPORT_ONLY=1 to roll back without
          // a code change - the header key flips to the Report-Only variant.
          key: cspReportOnly ? "Content-Security-Policy-Report-Only" : "Content-Security-Policy",
          value: csp,
        },
      ]
    : []),
];

const nextConfig: NextConfig = {
  serverExternalPackages: ["@react-pdf/renderer"],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default withSentryConfig(withBundleAnalyzer(nextConfig), {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: "nil-2qc",

  project: "client-flow",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  tunnelRoute: "/monitoring",

  webpack: {
    // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,

    // Tree-shaking options for reducing bundle size
    treeshake: {
      // Automatically tree-shake Sentry logger statements to reduce bundle size
      removeDebugLogging: true,
    },
  },
});
