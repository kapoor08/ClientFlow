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
 * The Content-Security-Policy is set per-request in `middleware.ts` (P2-2) so
 * `script-src` can carry a fresh nonce (`'nonce-…' 'strict-dynamic'`) instead of
 * `'unsafe-inline'` - a static `headers()` value can't. Ships Report-Only by
 * default; `CSP_ENFORCE=1` flips it to enforcing. The other security headers
 * below stay static.
 */

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
        // CSP is set per-request (nonce-based) in middleware.ts - not here.
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
