import type { MetadataRoute } from "next";
import { seoConfig } from "@/config/seo";

/**
 * Search engine crawling rules. Allows public marketing pages, disallows
 * every tenant-scoped and admin path so Google never surfaces, e.g.,
 * `/dashboard?task=xyz` or `/admin/users` in search results.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/admin/",
          "/auth/",
          "/onboarding/",
          "/dashboard",
          "/projects",
          "/clients",
          "/tasks",
          "/invoices",
          "/files",
          "/settings",
          "/teams",
          "/billing",
          "/client-portal",
          "/analytics",
          "/notifications",
          "/invitations",
          "/org-security",
          "/developer",
          "/activity-logs",
          "/invite/",
          "/ip-blocked",
          "/unauthorized",
          "/plans",
        ],
      },
    ],
    sitemap: `${seoConfig.siteUrl}/sitemap.xml`,
    host: seoConfig.siteUrl,
  };
}
