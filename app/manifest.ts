import type { MetadataRoute } from "next";
import { seoConfig } from "@/config/seo";

/**
 * PWA manifest. Enables "Add to Home Screen" on mobile and makes the app
 * installable on desktop (Chrome / Edge / Safari).
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: seoConfig.brand.name,
    short_name: seoConfig.brand.name,
    description: seoConfig.brand.shortDescription,
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: seoConfig.themeColor,
    icons: [
      {
        src: "/logo-app.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/logo-app.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
