import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import ClientProviders from "@/providers/ClientProviders";
import NextTopLoader from "nextjs-toploader";
import { seoConfig } from "@/config/seo";
import { organizationSchema, webSiteSchema } from "@/lib/jsonLd";
import { CookieConsentBanner } from "@/components/consent/CookieConsentBanner";
import { PostHogProvider } from "@/components/analytics/PostHogProvider";
import { Suspense } from "react";
import { headers } from "next/headers";
import "./globals.css";

// Brand fonts, vendored locally under app/fonts/ and self-hosted via
// next/font/local (served from our own origin, so CSP `font-src 'self'` allows
// them, no render-blocking external @import, no CLS). These are the *variable*
// woff2 (latin subset) covering the weight ranges the design uses, wired into
// the --cf-font-* design tokens in globals.css via the --font-* variables.
//
// Why local, not next/font/google: the Google-fonts variant downloads from
// Google's CDN at build time, so a slow/blocked network fails the build. Local
// files make the build fully hermetic. To refresh: re-download the woff2 from
// the gstatic URLs in the Google Fonts CSS2 response.
const sora = localFont({
  src: "./fonts/Sora-latin.woff2",
  weight: "400 800",
  variable: "--font-sora",
  display: "swap",
});
const sourceSans = localFont({
  src: "./fonts/SourceSans3-latin.woff2",
  weight: "400 700",
  variable: "--font-source-sans",
  display: "swap",
});
const jetbrainsMono = localFont({
  src: "./fonts/JetBrainsMono-latin.woff2",
  weight: "400 500",
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(seoConfig.siteUrl),
  title: {
    default: `${seoConfig.brand.name} - ${seoConfig.brand.tagline}`,
    template: `%s | ${seoConfig.brand.name}`,
  },
  description: seoConfig.brand.shortDescription,
  applicationName: seoConfig.brand.name,
  authors: [{ name: seoConfig.brand.legalName }],
  creator: seoConfig.brand.legalName,
  publisher: seoConfig.brand.legalName,
  formatDetection: { email: false, address: false, telephone: false },
  icons: {
    icon: "/favicon.ico",
    apple: "/logo-app.png",
  },
  openGraph: {
    siteName: seoConfig.brand.name,
    locale: seoConfig.locale,
    type: "website",
    images: [
      {
        url: seoConfig.ogImage.url,
        width: seoConfig.ogImage.width,
        height: seoConfig.ogImage.height,
        alt: seoConfig.ogImage.alt,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: seoConfig.twitter.site,
    creator: seoConfig.twitter.creator,
    images: [seoConfig.ogImage.url],
  },
  manifest: "/manifest.webmanifest",
  keywords: [...seoConfig.keywords],
};

export const viewport: Viewport = {
  themeColor: seoConfig.themeColor,
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Per-request CSP nonce set by middleware (P2-2). Applied to the manual inline
  // JSON-LD scripts and threaded to next-themes so its flash-prevention script
  // is allowed under the nonce CSP. Absent in dev (no CSP there).
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${sora.variable} ${sourceSans.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        {/* Organization + WebSite JSON-LD - site-wide structured data */}
        <script
          type="application/ld+json"
          nonce={nonce}
          dangerouslySetInnerHTML={{ __html: organizationSchema() }}
        />
        <script
          type="application/ld+json"
          nonce={nonce}
          dangerouslySetInnerHTML={{ __html: webSiteSchema() }}
        />
      </head>
      <body className="scrollbar-thin antialiased">
        <NextTopLoader
          color="#ffffff33"
          initialPosition={0.08}
          crawlSpeed={200}
          height={4}
          crawl={true}
          showSpinner={false}
          easing="ease-in-out"
          speed={200}
        />
        <ClientProviders nonce={nonce}>{children}</ClientProviders>
        {/* Suspense required because PostHogProvider reads useSearchParams */}
        <Suspense fallback={null}>
          <PostHogProvider />
        </Suspense>
        <CookieConsentBanner />
      </body>
    </html>
  );
}
