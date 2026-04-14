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
  /* Load all section content and approved reviews in parallel. */
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

  /* Cast each section's content to the expected prop shape.
     landingService guarantees defaults are present so all fields exist.
     Double-cast through unknown: Record<string,unknown> → unknown → PropType. */
  const hero         = (sections?.hero         ?? {}) as unknown as Parameters<typeof HeroSection>[0];
  const about        = (sections?.about        ?? {}) as unknown as Parameters<typeof AboutSection>[0];
  const products     = (sections?.products     ?? {}) as unknown as Parameters<typeof ProductsSection>[0];
  const gallery      = (sections?.gallery      ?? {}) as unknown as Parameters<typeof GallerySection>[0];
  const reviewsHeading = (sections?.reviews    ?? {}) as unknown as { heading: string; subtitle: string };
  const bookingCta   = (sections?.booking_cta  ?? {}) as unknown as Parameters<typeof BookingCtaSection>[0];
  const contact      = (sections?.contact      ?? {}) as unknown as Parameters<typeof ContactSection>[0];

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

  const galleryItems = (gallery as { items?: unknown[] }).items ?? [];

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
        <HeroSection {...hero} />
        <AboutSection {...about} />
        <ProductsSection {...products} />
        {galleryItems.length > 0 && <GallerySection {...gallery} />}
        <ReviewsSection {...reviewsHeading} reviews={approvedReviews} />
        <BookingCtaSection {...bookingCta} />
        <ContactSection {...contact} />
      </main>
    </>
  );
}
