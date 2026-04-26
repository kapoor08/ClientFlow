import type { MetadataRoute } from "next";
import { seoConfig } from "@/config/seo";

/**
 * Static public routes that should appear in the sitemap. Protected /
 * admin / auth routes are intentionally excluded - they're per-tenant or
 * sign-in gated and have no SEO value.
 */
const STATIC_PUBLIC_ROUTES: Array<{
  path: string;
  priority: number;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
}> = [
  { path: "", priority: 1.0, changeFrequency: "weekly" },
  { path: "/pricing", priority: 0.9, changeFrequency: "monthly" },
  { path: "/features", priority: 0.9, changeFrequency: "monthly" },
  { path: "/about", priority: 0.7, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.7, changeFrequency: "monthly" },
  { path: "/docs", priority: 0.8, changeFrequency: "weekly" },
  { path: "/api-docs", priority: 0.7, changeFrequency: "weekly" },
  { path: "/help", priority: 0.7, changeFrequency: "weekly" },
  { path: "/blogs", priority: 0.7, changeFrequency: "weekly" },
  { path: "/changelog", priority: 0.6, changeFrequency: "weekly" },
  { path: "/careers", priority: 0.5, changeFrequency: "monthly" },
  { path: "/integrations", priority: 0.6, changeFrequency: "monthly" },
  { path: "/partners", priority: 0.4, changeFrequency: "monthly" },
  { path: "/press", priority: 0.3, changeFrequency: "monthly" },
  { path: "/security", priority: 0.6, changeFrequency: "monthly" },
  { path: "/status", priority: 0.4, changeFrequency: "daily" },
  { path: "/legal", priority: 0.3, changeFrequency: "yearly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return STATIC_PUBLIC_ROUTES.map(({ path, priority, changeFrequency }) => ({
    url: `${seoConfig.siteUrl}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
  }));

  // TODO (Phase D / post-launch): append dynamic routes here by querying the
  // DB for published blog posts, public help articles, etc.
}
