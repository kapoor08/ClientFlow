import type { MetadataRoute } from "next";
import { db } from "@/server/db/client";
import { statusIncidents } from "@/db/schema";
import { desc } from "drizzle-orm";
import { getStatusBaseUrl } from "@/server/status/urls";

/**
 * Sitemap for the status subdomain.
 *
 * On the production subdomain (`status.client-flow.in`) middleware rewrites
 * the request to `/status/...` internally, so this file - which lives at
 * `app/status/sitemap.ts` - is served at `status.client-flow.in/sitemap.xml`.
 *
 * Lists the canonical landing page plus every incident slug. Resolved
 * incidents stay indexed so post-mortem-style URLs remain reachable to
 * search engines linking to them.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getStatusBaseUrl();
  const now = new Date();

  const incidents = await db
    .select({
      slug: statusIncidents.slug,
      updatedAt: statusIncidents.updatedAt,
    })
    .from(statusIncidents)
    .orderBy(desc(statusIncidents.startedAt));

  return [
    {
      url: `${base}/`,
      lastModified: now,
      changeFrequency: "always",
      priority: 0.7,
    },
    ...incidents.map((inc) => ({
      url: `${base}/incidents/${inc.slug}`,
      lastModified: inc.updatedAt ?? now,
      changeFrequency: "weekly" as const,
      priority: 0.4,
    })),
  ];
}
