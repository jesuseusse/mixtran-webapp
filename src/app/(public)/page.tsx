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

// ─────────────────────────────────────────────────────────────
// Static content (Phase 1) — all user-visible copy in Spanish.
// Replace with DynamoDB service calls in Phase 4 — zero component
// refactor needed; only the data source changes.
// ─────────────────────────────────────────────────────────────

const HERO = {
  headline: "MIXTRAN — Revestimientos que duran",
  subtitle: "Plásticos · Grafiados · Texturizados · Pinturas para interiores y exteriores",
  ctaText: "Agenda tu asesoría",
  ctaHref: "/agendar",
  backgroundImageUrl: "/images/hero-bg.png",
};

const ABOUT = {
  heading: "¿Qué es MIXTRAN?",
  body:
    "MIXTRAN MLQ es un revestimiento plástico con partículas de cuarzo diseñado para proteger y embellecer cualquier superficie. Su fórmula avanzada lo hace resistente a todos los climas, con desempeño comprobado en zonas costeras de alta salinidad y en regiones montañosas.\n\nSe adhiere a una amplia variedad de sustratos: paredes en buen estado, yeso seco, ladrillos de cemento, madera, hierro, láminas metálicas, vidrio, aluminio, paneles de cualquier tipo y cartón piedra. Ideal tanto para interiores como para exteriores.\n\nAntes de aplicar MLQ, se recomienda usar nuestro Fijador para sellar la superficie, mejorar la adherencia y garantizar un acabado duradero y uniforme.",
  photoUrl: "/images/about-studio.png",
  photoAlt: "Aplicación de revestimiento MIXTRAN MLQ en pared exterior",
};

const PRODUCTS = {
  heading: "Nuestros productos",
  subtitle: "Soluciones de revestimiento para cada superficie y clima.",
  products: [
    {
      id: "fijador",
      name: "Fijador",
      description:
        "Sellador de superficies que garantiza la máxima adherencia del MLQ. Se aplica antes del revestimiento con rodillo de peluche o esponja. Penetra en el sustrato para unificar la absorción y preparar la base.",
      imageUrl: "/images/product-interior.png",
    },
    {
      id: "mlq",
      name: "MLQ",
      description:
        "Revestimiento plástico con partículas de cuarzo. Resiste cualquier clima: zonas costeras con alta salinidad y áreas montañosas. Uso interior y exterior. Compatible con paredes, yeso, cemento, madera, hierro, vidrio, aluminio y paneles de todo tipo.",
      imageUrl: "/images/product-exterior.png",
    },
  ],
};

const GALLERY = {
  heading: "Proyectos recientes",
  subtitle: "Una selección de espacios transformados con MIXTRAN.",
  items: [] as { id: string; url: string; alt: string }[],
  /* Gallery images will be uploaded to S3 and served via CloudFront in Phase 4. */
};

const REVIEWS_HEADING = {
  heading: "Lo que dicen nuestros clientes",
  subtitle: "Opiniones reales de clientes que confiaron en MIXTRAN.",
};

const BOOKING_CTA = {
  heading: "¿Necesitas asesoría profesional?",
  body: "Agenda una cita con nuestro experto en revestimientos y obtén la solución ideal para tu proyecto.",
  ctaText: "Agendar cita gratis",
  ctaHref: "/agendar",
};

const CONTACT = {
  heading: "Contáctanos",
  subtitle: "Estamos disponibles para atender tu consulta y orientarte en tu proyecto.",
  contactInfo: {
    company: "MIXTRAN — Emprendimiento Carlos Álvarez 71",
    phone: "0412-4091061",
    phone2: "0412-3859612",
    email: "mixtranrevestimientoplastico@gmail.com",
    address: "CALLE 10-08 CASA NRO 14-A URB CIUDAD JARDIN CAGUA ARAGUA ZONA POSTAL 2122",
    rif: "508062914-MDF",
  },
};

/** Structured data for Google Knowledge Panel and local search results. */
const LOCAL_BUSINESS_JSON_LD = buildLocalBusinessJsonLd({
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

const PRODUCT_LIST_JSON_LD = buildProductListJsonLd(
  PRODUCTS.products.map((p) => ({
    name: p.name,
    description: p.description,
  }))
);

/**
 * Public landing page — rendered as static with ISR (revalidate = 3600).
 *
 * Approved reviews are fetched from DynamoDB at build/revalidate time.
 * revalidatePath('/') is called from reviewService.approveReview() so new
 * approvals appear within seconds without a full rebuild.
 */
export default async function LandingPage() {
  /* Fetch approved reviews — returns [] gracefully if the table is not yet created. */
  const approvedReviews: ReviewItem[] = await reviewService
    .getApprovedReviews()
    .then((reviews) =>
      reviews.map((r) => ({
        reviewId: r.reviewId,
        authorName: r.authorName,
        rating: r.rating,
        body: r.body,
        createdAt: r.createdAt,
      }))
    )
    .catch(() => []);

  return (
    <>
      {/* JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(LOCAL_BUSINESS_JSON_LD) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(PRODUCT_LIST_JSON_LD) }}
      />

      <main>
        <HeroSection {...HERO} />
        <AboutSection {...ABOUT} />
        <ProductsSection {...PRODUCTS} />
        {GALLERY.items.length > 0 && <GallerySection {...GALLERY} />}
        <ReviewsSection {...REVIEWS_HEADING} reviews={approvedReviews} />
        <BookingCtaSection {...BOOKING_CTA} />
        <ContactSection {...CONTACT} />
      </main>
    </>
  );
}
