import type { MetadataRoute } from "next";

const BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://yourdomain.com";

/**
 * Generates the XML sitemap for the public-facing pages.
 *
 * Next.js serialises this automatically at `/sitemap.xml`.
 * Add new public routes here as they are created in future phases.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${BASE_URL}/agendar`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];
}
