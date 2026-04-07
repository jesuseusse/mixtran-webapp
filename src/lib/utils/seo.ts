import type { Metadata } from "next";

/** Base URL for the site. Override per-environment via NEXT_PUBLIC_APP_URL. */
const BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://yourdomain.com";

// ─────────────────────────────────────────────────────────────
// generateMetadata helper
// ─────────────────────────────────────────────────────────────

/** Options accepted by {@link buildMetadata}. */
export interface MetadataOptions {
  /** Page title (without brand suffix — template adds it). */
  title: string;
  /** Short description for meta and OG tags. */
  description: string;
  /** Canonical path relative to BASE_URL (e.g. `"/"`, `"/agendar"`). */
  path?: string;
  /** Absolute URL to the OG share image. */
  ogImage?: string;
  /** Open Graph locale (e.g. `"es_VE"`, `"es_MX"`). @default "es_MX" */
  locale?: string;
  /** SEO keywords for the `<meta name="keywords">` tag. */
  keywords?: string[];
}

/**
 * Builds a fully-populated Next.js `Metadata` object.
 *
 * Includes title, description, canonical URL, Open Graph, and Twitter card.
 * Used in `generateMetadata()` functions on page files.
 *
 * @example
 * export function generateMetadata(): Metadata {
 *   return buildMetadata({
 *     title: "Premium Color Advisory",
 *     description: "Book your personal color session today.",
 *     path: "/",
 *   });
 * }
 */
export function buildMetadata({
  title,
  description,
  path = "/",
  ogImage,
  locale = "es_MX",
  keywords,
}: MetadataOptions): Metadata {
  const url = `${BASE_URL}${path}`;
  const image = ogImage ?? `${BASE_URL}/og-default.jpg`;

  return {
    title,
    description,
    ...(keywords?.length ? { keywords } : {}),
    metadataBase: new URL(BASE_URL),
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      type: "website",
      locale,
      images: [{ url: image, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

// ─────────────────────────────────────────────────────────────
// JSON-LD builders
// ─────────────────────────────────────────────────────────────

/** Props for {@link buildLocalBusinessJsonLd}. */
export interface LocalBusinessJsonLdProps {
  /** Business trading name. */
  name: string;
  /** Short description of the business. */
  description: string;
  /** Full street address. */
  streetAddress: string;
  /** City. */
  city: string;
  /** State or region (e.g. `"Edo. Aragua"`). */
  region?: string;
  /** ISO 3166-1 alpha-2 country code (e.g. `"VE"`). */
  country: string;
  /** E.164 phone number (e.g. `"+15551234567"`). */
  phone: string;
  /** Business email. */
  email: string;
  /** Absolute URL to the business logo. */
  logo?: string;
  /** Average review rating (1–5). */
  ratingValue?: number;
  /** Total number of reviews used to compute the rating. */
  reviewCount?: number;
}

/**
 * Builds a `LocalBusiness` JSON-LD object for structured data.
 *
 * Render the result inside a `<script type="application/ld+json">` tag
 * using `JSON.stringify`. Helps search engines surface business info in
 * Knowledge Panels and local results.
 *
 * @example
 * const jsonLd = buildLocalBusinessJsonLd({ name: "Mixtran Paint", ... });
 * // <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
 */
export function buildLocalBusinessJsonLd({
  name,
  description,
  streetAddress,
  city,
  region,
  country,
  phone,
  email,
  logo,
  ratingValue,
  reviewCount,
}: LocalBusinessJsonLdProps): object {
  const base: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name,
    description,
    url: BASE_URL,
    telephone: phone,
    email,
    address: {
      "@type": "PostalAddress",
      streetAddress,
      addressLocality: city,
      ...(region ? { addressRegion: region } : {}),
      addressCountry: country,
    },
  };

  if (logo) base["logo"] = logo;

  if (ratingValue !== undefined && reviewCount !== undefined) {
    base["aggregateRating"] = {
      "@type": "AggregateRating",
      ratingValue,
      reviewCount,
      bestRating: 5,
      worstRating: 1,
    };
  }

  return base;
}

/** A single product entry for {@link buildProductListJsonLd}. */
export interface ProductJsonLdItem {
  /** Product name. */
  name: string;
  /** Short description of the product line. */
  description: string;
  /** Absolute URL to the product image. */
  image?: string;
}

/**
 * Builds an array of `Product` JSON-LD objects for a paint product catalogue.
 *
 * Render the result as an `ItemList` or alongside a `LocalBusiness` schema.
 *
 * @example
 * const products = buildProductListJsonLd([
 *   { name: "Premium Interior", description: "Smooth matte finish..." },
 * ]);
 */
export function buildProductListJsonLd(
  items: ProductJsonLdItem[]
): object {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Product",
        name: item.name,
        description: item.description,
        ...(item.image ? { image: item.image } : {}),
        brand: {
          "@type": "Brand",
          name: "Mixtran Paint",
        },
      },
    })),
  };
}
