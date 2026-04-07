import type { MetadataRoute } from "next";

const BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://yourdomain.com";

/**
 * Generates the robots.txt file served at `/robots.txt`.
 *
 * Allows all crawlers on public pages.
 * Disallows admin routes to prevent indexing.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/"],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
