import { seoConfig } from "@/config/seo";

/**
 * JSON-LD structured data helpers. Each returns a JSON string suitable for
 * inlining as:
 *
 *   <script
 *     type="application/ld+json"
 *     dangerouslySetInnerHTML={{ __html: organizationSchema() }}
 *   />
 *
 * Structured data is what makes pages eligible for rich results in Google
 * (knowledge-panel entries, product cards, etc.).
 */

export function organizationSchema(): string {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Organization",
    name: seoConfig.brand.name,
    legalName: seoConfig.brand.legalName,
    url: seoConfig.siteUrl,
    logo: `${seoConfig.siteUrl}/logo-app.png`,
    description: seoConfig.brand.shortDescription,
    sameAs: [seoConfig.social.twitter, seoConfig.social.linkedin, seoConfig.social.github],
  });
}

export function webSiteSchema(): string {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: seoConfig.brand.name,
    url: seoConfig.siteUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: `${seoConfig.siteUrl}/help?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  });
}

export function softwareApplicationSchema(opts: {
  lowPriceUsd: number;
  highPriceUsd: number;
}): string {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: seoConfig.brand.name,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description: seoConfig.brand.shortDescription,
    url: seoConfig.siteUrl,
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "USD",
      lowPrice: String(opts.lowPriceUsd),
      highPrice: String(opts.highPriceUsd),
    },
  });
}
