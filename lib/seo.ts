import type { Metadata } from "next";
import { seoConfig } from "@/config/seo";

/**
 * Composes Next.js `Metadata` for a page. Called from every `page.tsx`
 * and `generateMetadata` function in the app.
 *
 * Fills in the defaults from `config/seo.ts` so each page only has to
 * specify what's unique to it (title, description, path).
 */

type BuildMetadataInput = {
  /** Page-specific title. Composed with the root template as `"<title> | ClientFlow"`. */
  title: string;
  /** 50–160 char description for search engines + social cards. */
  description: string;
  /**
   * Path starting with `/`. Used for canonical URL + OG URL. Omit for
   * dynamic routes without stable URLs (e.g. tenant-scoped app pages).
   */
  path?: string;
  /** Override the default OG image for this page. */
  image?: { url: string; width?: number; height?: number; alt?: string };
  /** Keep the page out of search engines (and tell bots not to cache/image-index). */
  noIndex?: boolean;
  /** OG type. Default `"website"`. Use `"article"` for blog posts. */
  type?: "website" | "article" | "profile";
  /** Extra keywords appended to the global set. */
  keywords?: string[];
  /** For OG `article` type: ISO date string. */
  publishedAt?: string;
  /** For OG `article` type: author name. */
  author?: string;
};

export function buildMetadata(input: BuildMetadataInput): Metadata {
  const canonical = input.path ? `${seoConfig.siteUrl}${input.path}` : undefined;
  const image = input.image ?? seoConfig.ogImage;
  const keywords = input.keywords
    ? [...seoConfig.keywords, ...input.keywords]
    : [...seoConfig.keywords];

  return {
    title: input.title,
    description: input.description,
    keywords,
    alternates: canonical ? { canonical } : undefined,
    openGraph: {
      title: input.title,
      description: input.description,
      url: canonical,
      siteName: seoConfig.brand.name,
      locale: seoConfig.locale,
      type: input.type ?? "website",
      images: [
        {
          url: image.url,
          width: image.width ?? 1200,
          height: image.height ?? 630,
          alt: image.alt ?? seoConfig.ogImage.alt,
        },
      ],
      ...(input.publishedAt && input.type === "article"
        ? { publishedTime: input.publishedAt }
        : {}),
      ...(input.author && input.type === "article" ? { authors: [input.author] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: input.title,
      description: input.description,
      images: [image.url],
      site: seoConfig.twitter.site,
      creator: seoConfig.twitter.creator,
    },
    robots: input.noIndex
      ? {
          index: false,
          follow: false,
          nocache: true,
          googleBot: { index: false, follow: false, noimageindex: true },
        }
      : { index: true, follow: true },
  };
}
