import React from "react";
import type { Metadata } from "next";
import { buildMetadata, buildLocalBusinessJsonLd, buildProductListJsonLd } from "@/lib/utils/seo";
import { HeroSection } from "@/components/landing/HeroSection";
import { AboutSection } from "@/components/landing/AboutSection";
import { ProductsSection } from "@/components/landing/ProductsSection";
import { GallerySection } from "@/components/landing/GallerySection";
import { ReviewsSection } from "@/components/landing/ReviewsSection";
import { BookingCtaSection } from "@/components/landing/BookingCtaSection";
import { ContactSection } from "@/components/landing/ContactSection";
import * as reviewService from "@/lib/services/reviewService";
import * as landingService from "@/lib/services/landingService";
import type { ReviewItem } from "@/components/landing/ReviewsSection";

/** ISR revalidation interval — 1 hour. Phase 4 calls revalidatePath('/') on content change. */
export const revalidate = 3600;

/**
 * Generates full page metadata including Open Graph, Twitter cards, canonical URL,
 * and SEO keywords for the MIXTRAN landing page.
 */
export function generateMetadata(): Metadata {
  return buildMetadata({
    title: "MIXTRAN | Revestimientos Plásticos, Grafiados y Texturizados",
    description:
      "MIXTRAN fabrica revestimientos plásticos con partículas de cuarzo para interiores y exteriores. Resistentes al clima, versátiles en cualquier superficie. Cagua, Edo. Aragua.",
    path: "/",
    locale: "es_VE",
    ogImage: "/images/og-default.png",
    keywords: [
      "revestimientos plásticos",
      "pinturas texturizadas",
      "fijador",
      "Cagua",
      "Aragua",
      "Venezuela",
      "pinturas"
    ],
  });
}

/**
 * Public landing page — rendered as static with ISR (revalidate = 3600).
 *
 * Section content is loaded from DynamoDB via landingService.getSections(),
 * which merges stored values with hardcoded defaults so the page always renders
 * correctly even on a fresh deployment with an empty table.
 *
 * revalidatePath('/') is triggered by:
 * - reviewService.approveReview() / rejectReview()
 * - landingService.updateSection()
 */
export default async function LandingPage() {
  /* Load all section data and approved reviews in parallel. */
  const [sections, approvedReviews] = await Promise.all([
    landingService.getSections().catch(() => null),
    reviewService
      .getApprovedReviews()
      .then((reviews) =>
        reviews.map((r): ReviewItem => ({
          reviewId: r.reviewId,
          authorName: r.authorName,
          rating: r.rating,
          body: r.body,
          createdAt: r.createdAt,
        }))
      )
      .catch(() => [] as ReviewItem[]),
  ]);

  /* Helper to extract content for a section — falls back to empty object. */
  function c(id: keyof NonNullable<typeof sections>) {
    return (sections?.[id]?.content ?? {});
  }

  /* Determine which sections are enabled and in what order. */
  function isEnabled(id: keyof NonNullable<typeof sections>) {
    return sections?.[id]?.enabled ?? true;
  }

  const hero          = c("hero")        as unknown as Parameters<typeof HeroSection>[0];
  const about         = c("about")       as unknown as Parameters<typeof AboutSection>[0];
  const products      = c("products")    as unknown as Parameters<typeof ProductsSection>[0];
  const gallery       = c("gallery")     as unknown as Parameters<typeof GallerySection>[0];
  const reviewsHeading= c("reviews")     as unknown as { heading: string; subtitle: string };
  const bookingCta    = c("booking_cta") as unknown as Parameters<typeof BookingCtaSection>[0];
  const contact       = c("contact")     as unknown as Parameters<typeof ContactSection>[0];

  const galleryItems = (c("gallery") as { items?: unknown[] }).items ?? [];

  /** Structured data for Google Knowledge Panel and local search results. */
  const localBusinessJsonLd = buildLocalBusinessJsonLd({
    name: "MIXTRAN",
    description:
      "MIXTRAN fabrica revestimientos plásticos con partículas de cuarzo para interiores y exteriores. Resistentes al clima, versátiles en cualquier superficie.",
    streetAddress: "CALLE 10-08 CASA NRO 14-A URB CIUDAD JARDIN CAGUA ARAGUA ZONA POSTAL 2122",
    city: "Cagua",
    region: "Edo. Aragua",
    country: "VE",
    phone: "+584124091061",
    email: "mixtranrevestimientoplastico@gmail.com",
  });

  const productListJsonLd = buildProductListJsonLd(
    ((products as { products?: { name: string; description: string }[] }).products ?? []).map(
      (p) => ({ name: p.name, description: p.description })
    )
  );

  /* Build ordered list of section renderers — sorted by `order`, skipping disabled. */
  type SectionEntry = { id: string; order: number; node: React.ReactNode };
  const sectionNodes: SectionEntry[] = [
    { id: "hero",        order: sections?.hero?.order        ?? 0, node: isEnabled("hero")        ? <HeroSection {...hero} /> : null },
    { id: "about",       order: sections?.about?.order       ?? 1, node: isEnabled("about")       ? <AboutSection {...about} /> : null },
    { id: "products",    order: sections?.products?.order    ?? 2, node: isEnabled("products")    ? <ProductsSection {...products} /> : null },
    { id: "gallery",     order: sections?.gallery?.order     ?? 3, node: isEnabled("gallery") && galleryItems.length > 0 ? <GallerySection {...gallery} /> : null },
    { id: "reviews",     order: sections?.reviews?.order     ?? 4, node: isEnabled("reviews")     ? <ReviewsSection {...reviewsHeading} reviews={approvedReviews} /> : null },
    { id: "booking_cta", order: sections?.booking_cta?.order ?? 5, node: isEnabled("booking_cta") ? <BookingCtaSection {...bookingCta} /> : null },
    { id: "contact",     order: sections?.contact?.order     ?? 6, node: isEnabled("contact")     ? <ContactSection {...contact} /> : null },
  ]
    .sort((a, b) => a.order - b.order)
    .filter((s) => s.node !== null);

  return (
    <>
      {/* JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productListJsonLd) }}
      />

      <main>
        {sectionNodes.map((s) => (
          <React.Fragment key={s.id}>{s.node}</React.Fragment>
        ))}
      </main>
    </>
  );
}
