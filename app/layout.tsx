import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import ClientProviders from "@/providers/ClientProviders";
import NextTopLoader from "nextjs-toploader";
import { seoConfig } from "@/config/seo";
import { organizationSchema, webSiteSchema } from "@/lib/jsonLd";
import { CookieConsentBanner } from "@/components/consent/CookieConsentBanner";
import { PostHogProvider } from "@/components/analytics/PostHogProvider";
import { Suspense } from "react";
import "./globals.css";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Organization + WebSite JSON-LD - site-wide structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: organizationSchema() }}
        />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: webSiteSchema() }} />
      </head>
      <body className={`${GeistSans.variable} ${GeistMono.variable} scrollbar-thin antialiased`}>
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
        <NuqsAdapter>
          <ClientProviders>{children}</ClientProviders>
        </NuqsAdapter>
        {/* Suspense required because PostHogProvider reads useSearchParams */}
        <Suspense fallback={null}>
          <PostHogProvider />
        </Suspense>
        <CookieConsentBanner />
      </body>
    </html>
  );
}
