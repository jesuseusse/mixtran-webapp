import type { Metadata } from "next";
import { buildMetadata, buildLocalBusinessJsonLd, buildProductListJsonLd } from "@/lib/utils/seo";
import { HeroSection } from "@/components/landing/HeroSection";
import { AboutSection } from "@/components/landing/AboutSection";
import { ProductsSection } from "@/components/landing/ProductsSection";
import { GallerySection } from "@/components/landing/GallerySection";
import { ReviewsSection } from "@/components/landing/ReviewsSection";
import { BookingCtaSection } from "@/components/landing/BookingCtaSection";
import { ContactSection } from "@/components/landing/ContactSection";

/** ISR revalidation interval — 1 hour. Phase 4 calls revalidatePath('/') on content change. */
export const revalidate = 3600;

/**
 * Generates full page metadata including Open Graph, Twitter cards, and canonical URL.
 * In Phase 4 some fields will be pulled from DynamoDB via landingService.
 */
export function generateMetadata(): Metadata {
  return buildMetadata({
    title: "Mixtran Paint — Asesoría de Color Premium",
    description:
      "Transforma tu espacio con consultoría de color experta y pinturas de alta calidad. Agenda tu cita de asesoría personalizada hoy.",
    path: "/",
    locale: "es_MX",
  });
}

// ─────────────────────────────────────────────────────────────
// Static content (Phase 1) — all user-visible copy in Spanish.
// Replace with DynamoDB calls in Phase 4 — zero component refactor needed.
// ─────────────────────────────────────────────────────────────

const HERO = {
  headline: "Color que transforma espacios",
  subtitle:
    "Asesoría de color experta y pinturas premium para hogares y negocios. Hacemos realidad tu visión.",
  ctaText: "Agendar asesoría de color",
  ctaHref: "/agendar",
  backgroundImageUrl: "/images/hero-bg.jpg",
};

const ABOUT = {
  heading: "Hecho con pasión, aplicado con precisión",
  body:
    "Somos un equipo de consultores de color certificados y pintores maestros dedicados a transformar espacios a través del arte del color.\n\nCon más de 15 años de experiencia y cientos de proyectos concluidos, combinamos materiales premium con una técnica meticulosa para entregar resultados que superan expectativas.",
  photoUrl: "/images/about-studio.jpg",
  photoAlt: "Nuestro estudio y espacio de consultoría de color",
};

const PRODUCTS = {
  heading: "Nuestras líneas de pintura",
  subtitle: "Formulaciones premium para cada superficie y estilo.",
  products: [
    {
      id: "interior",
      name: "Interior Premium",
      description:
        "Acabados mate y cáscara de huevo de textura aterciopelada formulados para espacios habitables. Sin VOC, lavables y duraderos.",
      imageUrl: "/images/product-interior.jpg",
    },
    {
      id: "exterior",
      name: "Escudo Climático Exterior",
      description:
        "Pintura exterior de alta opacidad y resistencia UV que soporta condiciones extremas sin perder su color vibrante.",
      imageUrl: "/images/product-exterior.jpg",
    },
    {
      id: "specialty",
      name: "Especialidades y Acentos",
      description:
        "Acabados metálicos, tiza y texturizados para muros de acento, muebles e instalaciones artísticas.",
      imageUrl: "/images/product-specialty.jpg",
    },
  ],
};

const GALLERY = {
  heading: "Proyectos recientes",
  subtitle: "Una selección de espacios transformados por nuestro equipo.",
  items: [] as { id: string; url: string; alt: string }[],
  /* Populate with real S3 CloudFront URLs once media is uploaded in Phase 4 */
};

const REVIEWS = {
  heading: "Lo que dicen nuestros clientes",
  subtitle: "Opiniones reales de hogares y negocios con los que hemos trabajado.",
  reviews: [] as {
    reviewId: string;
    authorName: string;
    rating: number;
    body: string;
    createdAt: string;
  }[],
  /* Populated from DynamoDB in Phase 4 via reviewService.getApproved() */
};

const BOOKING_CTA = {
  heading: "¿Listo para transformar tu espacio?",
  body:
    "Agenda una consultoría de color gratuita de 30 minutos con uno de nuestros expertos. Te guiaremos en la selección de paleta, acabado y técnica que mejor se adapte a tu espacio y estilo de vida.",
  ctaText: "Agendar consultoría gratuita",
  ctaHref: "/agendar",
};

const CONTACT = {
  heading: "Contáctanos",
  subtitle:
    "¿Tienes preguntas sobre nuestros servicios? Nos encantaría escucharte.",
  contactInfo: {
    phone: "+1 (555) 000-0000",
    email: "hola@mixtranpaint.com",
    address: "123 Color Ave, Suite 4, Tu Ciudad, ST 00000",
  },
};

/** Structured data injected into the page for search engine rich results. */
const LOCAL_BUSINESS_JSON_LD = buildLocalBusinessJsonLd({
  name: "Mixtran Paint",
  description:
    "Asesoría de color experta y servicios de pintura profesional para espacios residenciales y comerciales.",
  streetAddress: "123 Color Ave, Suite 4",
  city: "Tu Ciudad",
  country: "MX",
  phone: "+15550000000",
  email: "hola@mixtranpaint.com",
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
 * Composes all landing section components. Content is hardcoded in Phase 1
 * and will be driven from DynamoDB in Phase 4 without touching this file's
 * component structure — only the static objects above are replaced with
 * service calls.
 */
export default function LandingPage() {
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
        <ReviewsSection {...REVIEWS} />
        <BookingCtaSection {...BOOKING_CTA} />
        <ContactSection {...CONTACT} />
      </main>
    </>
  );
}
