/**
 * Single source of truth for SEO / social metadata.
 *
 * Every page's metadata flows through `lib/seo.ts` → `buildMetadata()` which
 * reads from this config. Change the brand name, domain, or OG image once
 * here and every page updates.
 */

export const seoConfig = {
  brand: {
    name: "ClientFlow",
    tagline: "All-in-One Client Management for Agencies",
    shortDescription:
      "The ultimate platform for agencies to manage clients, projects, invoices, and billing in one place.",
    legalName: "ClientFlow Inc.",
  },
  siteUrl: process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "https://client-flow.in",
  locale: "en_US",
  themeColor: "#2563eb",
  ogImage: {
    url: "/og-image.png", // 1200×630 PNG in /public
    width: 1200,
    height: 630,
    alt: "ClientFlow - All-in-One Client Management for Agencies",
  },
  twitter: {
    site: "@clientflow",
    creator: "@clientflow",
  },
  social: {
    twitter: "https://twitter.com/clientflow",
    linkedin: "https://linkedin.com/company/clientflow",
    github: "https://github.com/clientflow",
  },
  keywords: [
    "client management software",
    "agency project management",
    "freelancer invoicing",
    "client portal",
    "project billing",
    "team collaboration",
  ],
} as const;

export type SeoConfig = typeof seoConfig;
